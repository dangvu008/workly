import { format, parseISO, startOfDay, endOfDay, addDays, isSameDay, addMinutes, subMinutes, addHours, subHours } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  AttendanceLog,
  DailyWorkStatus,
  DailyWorkStatusNew,
  Shift,
  ButtonState,
  UserSettings,
  PublicHoliday
} from '../types';
import { TIME_CONSTANTS } from '../constants';
import { storageService } from './storage';
import { notificationService } from './notifications';
import { timeSyncService } from './timeSync';

class WorkManager {
  // Calculate work hours and status based on shift schedule and actual logs
  async calculateDailyWorkStatus(date: string, logs: AttendanceLog[], shift: Shift): Promise<DailyWorkStatus> {
    try {
      const settings = await storageService.getUserSettings();
      const holidays = await storageService.getPublicHolidays();

      const isHoliday = this.isHoliday(date, holidays);
      const dayOfWeek = new Date(date).getDay();
      const isSunday = dayOfWeek === 0;

      // Initialize status
      let status: DailyWorkStatus['status'] = 'pending';
      let vaoLogTime: string | undefined;
      let raLogTime: string | undefined;
      let lateMinutes = 0;
      let earlyMinutes = 0;

      // Find check-in and check-out logs
      const checkInLog = logs.find(log => log.type === 'check_in');
      const checkOutLog = logs.find(log => log.type === 'check_out');

      if (checkInLog) {
        vaoLogTime = checkInLog.time;
        const checkInTime = parseISO(checkInLog.time);
        const scheduledStartTime = this.parseShiftTime(date, shift.startTime, shift.isNightShift);

        const diffMinutes = Math.floor((checkInTime.getTime() - scheduledStartTime.getTime()) / (1000 * 60));
        if (diffMinutes > settings.lateThresholdMinutes) {
          lateMinutes = diffMinutes;
          status = 'late';
        }
      }

      if (checkOutLog) {
        raLogTime = checkOutLog.time;
        const checkOutTime = parseISO(checkOutLog.time);
        const scheduledEndTime = this.parseShiftTime(date, shift.officeEndTime, shift.isNightShift);

        const diffMinutes = Math.floor((scheduledEndTime.getTime() - checkOutTime.getTime()) / (1000 * 60));
        if (diffMinutes > 0) {
          earlyMinutes = diffMinutes;
          if (status !== 'late') {
            status = 'early';
          }
        }
      }

      // If both check-in and check-out are present and no issues, mark as completed
      if (checkInLog && checkOutLog && status === 'pending') {
        status = 'completed';
      }

      // If only one log is present, still pending
      if ((checkInLog && !checkOutLog) || (!checkInLog && checkOutLog)) {
        status = 'pending';
      }

      // If no logs at all, check if it's a past date
      if (!checkInLog && !checkOutLog) {
        const today = new Date();
        const workDate = new Date(date);
        if (workDate < startOfDay(today)) {
          status = 'absent';
        }
      }

      // Calculate scheduled hours based on shift
      const scheduledHours = this.calculateScheduledHours(shift);

      // Distribute hours by type
      let standardHoursScheduled = 0;
      let otHoursScheduled = 0;
      let sundayHoursScheduled = 0;
      let nightHoursScheduled = 0;

      if (isSunday) {
        sundayHoursScheduled = scheduledHours;
      } else if (isHoliday) {
        // Holiday hours are treated as overtime
        otHoursScheduled = scheduledHours;
      } else {
        // Regular weekday
        const standardHours = Math.min(scheduledHours, 8); // Assume 8 hours is standard
        standardHoursScheduled = standardHours;

        if (scheduledHours > 8) {
          otHoursScheduled = scheduledHours - 8;
        }
      }

      // Calculate night hours if it's a night shift
      if (shift.isNightShift) {
        nightHoursScheduled = this.calculateNightHours(shift);
      }

      return {
        status,
        vaoLogTime,
        raLogTime,
        standardHoursScheduled,
        otHoursScheduled,
        sundayHoursScheduled,
        nightHoursScheduled,
        totalHoursScheduled: scheduledHours,
        lateMinutes,
        earlyMinutes,
        isHolidayWork: isHoliday,
      };
    } catch (error) {
      console.error('Error calculating daily work status:', error);
      throw error;
    }
  }

  // Get current button state based on logs and time (using timeSync)
  async getCurrentButtonState(date: string): Promise<ButtonState> {
    try {
      const logs = await storageService.getAttendanceLogsForDate(date);
      const activeShift = await storageService.getActiveShift();

      if (!activeShift) {
        return 'go_work';
      }

      // Use timeSyncService for intelligent state calculation
      return await timeSyncService.getCurrentButtonState(activeShift, logs);
    } catch (error) {
      console.error('Error getting current button state:', error);
      return 'go_work';
    }
  }

  // Check if button should be shown based on time sync
  async shouldShowMultiButton(): Promise<boolean> {
    try {
      const activeShift = await storageService.getActiveShift();
      if (!activeShift) return false;

      return timeSyncService.isWithinActiveWindow(activeShift);
    } catch (error) {
      console.error('Error checking if button should be shown:', error);
      return false;
    }
  }

  // Check if attendance history should be shown
  async shouldShowAttendanceHistory(): Promise<boolean> {
    try {
      const activeShift = await storageService.getActiveShift();
      if (!activeShift) return false;

      return timeSyncService.shouldShowAttendanceHistory(activeShift);
    } catch (error) {
      console.error('Error checking if history should be shown:', error);
      return false;
    }
  }

  // Get priority notes based on current shift and time
  async getPriorityNotes(allNotes: any[], displayCount: number): Promise<any[]> {
    try {
      const activeShift = await storageService.getActiveShift();
      if (!activeShift) {
        // Fallback to original logic if no active shift
        return allNotes
          .filter(note => note.isPriority || (note.reminderDateTime && new Date(note.reminderDateTime) > new Date()))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, displayCount);
      }

      return await timeSyncService.getPriorityNotes(activeShift, allNotes, displayCount);
    } catch (error) {
      console.error('Error getting priority notes:', error);
      return [];
    }
  }

  // Get time display info for UI
  async getTimeDisplayInfo(): Promise<{
    isActiveWindow: boolean;
    shouldShowButton: boolean;
    shouldShowHistory: boolean;
    timeUntilNextReset: number;
    currentPhase: 'before_work' | 'work_time' | 'after_work' | 'inactive';
  } | null> {
    try {
      const activeShift = await storageService.getActiveShift();
      if (!activeShift) return null;

      return timeSyncService.getTimeDisplayInfo(activeShift);
    } catch (error) {
      console.error('Error getting time display info:', error);
      return null;
    }
  }

  // Handle button press
  async handleButtonPress(buttonState: ButtonState): Promise<void> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date().toISOString();

      let logType: AttendanceLog['type'];

      switch (buttonState) {
        case 'go_work':
          logType = 'go_work';
          // Setup location for first time if needed
          await this.setupLocationIfNeeded('home');
          break;
        case 'check_in':
          logType = 'check_in';
          // Setup work location for first time if needed
          await this.setupLocationIfNeeded('work');
          break;
        case 'check_out':
          logType = 'check_out';
          break;
        case 'complete':
          logType = 'complete';
          break;
        default:
          throw new Error(`Invalid button state: ${buttonState}`);
      }

      // Add log
      await storageService.addAttendanceLog(today, {
        type: logType,
        time: now,
      });

      // Recalculate work status
      await this.recalculateWorkStatus(today);

      // Cancel related notifications
      await this.cancelRelatedNotifications(logType);

    } catch (error) {
      console.error('Error handling button press:', error);
      throw error;
    }
  }

  // Reset daily status (manual reset)
  async resetDailyStatus(date: string): Promise<void> {
    try {
      await storageService.clearAttendanceLogsForDate(date);

      const allStatus = await storageService.getDailyWorkStatus();
      delete allStatus[date];
      await storageService.setDailyWorkStatus(allStatus);

      // Reschedule notifications for today if it's today
      const today = format(new Date(), 'yyyy-MM-dd');
      if (date === today) {
        const activeShift = await storageService.getActiveShift();
        if (activeShift) {
          await notificationService.scheduleShiftReminders(activeShift);
        }
      }
    } catch (error) {
      console.error('Error resetting daily status:', error);
      throw error;
    }
  }

  // Auto-rotate shifts if enabled
  async checkAndRotateShifts(): Promise<void> {
    try {
      const settings = await storageService.getUserSettings();

      if (settings.changeShiftReminderMode !== 'rotate' || !settings.rotationConfig) {
        return;
      }

      const { rotationShifts, rotationFrequency, rotationLastAppliedDate, currentRotationIndex } = settings.rotationConfig;

      if (rotationShifts.length < 2) {
        return;
      }

      const now = new Date();
      const lastApplied = rotationLastAppliedDate ? new Date(rotationLastAppliedDate) : new Date(0);

      let shouldRotate = false;
      let nextRotationDate = new Date(lastApplied);

      switch (rotationFrequency) {
        case 'weekly':
          nextRotationDate.setDate(lastApplied.getDate() + 7);
          break;
        case 'biweekly':
          nextRotationDate.setDate(lastApplied.getDate() + 14);
          break;
        case 'triweekly':
          nextRotationDate.setDate(lastApplied.getDate() + 21);
          break;
        case 'monthly':
          nextRotationDate.setMonth(lastApplied.getMonth() + 1);
          break;
      }

      shouldRotate = now >= nextRotationDate;

      if (shouldRotate) {
        const currentShiftId = await storageService.getActiveShiftId();
        const nextIndex = (currentRotationIndex + 1) % rotationShifts.length;
        const nextShiftId = rotationShifts[nextIndex];

        // Only rotate if the new shift is different from current
        if (nextShiftId !== currentShiftId) {
          const shifts = await storageService.getShiftList();
          const currentShift = shifts.find(s => s.id === currentShiftId);
          const nextShift = shifts.find(s => s.id === nextShiftId);

          if (nextShift) {
            await storageService.setActiveShiftId(nextShiftId);
            await storageService.updateUserSettings({
              rotationConfig: {
                ...settings.rotationConfig,
                rotationLastAppliedDate: nextRotationDate.toISOString(),
                currentRotationIndex: nextIndex,
              },
            });

            // Schedule new shift reminders
            await notificationService.scheduleShiftReminders(nextShift);

            // Notify user
            await notificationService.scheduleShiftRotationNotification(
              currentShift?.name || 'Ca cũ',
              nextShift.name
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking and rotating shifts:', error);
    }
  }

  // Schedule weekly reminder for ask_weekly mode
  async scheduleWeeklyReminder(): Promise<void> {
    try {
      const settings = await storageService.getUserSettings();

      if (settings.changeShiftReminderMode !== 'ask_weekly') {
        return;
      }

      const activeShift = await storageService.getActiveShift();
      if (!activeShift) {
        return;
      }

      // Find the last working day of the week
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Find the next occurrence of the last working day in the shift
      const workDays = activeShift.workDays.sort((a, b) => b - a); // Sort descending
      const lastWorkDay = workDays[0]; // Highest day number (last day of week)

      let reminderDate = new Date(today);
      let daysToAdd = lastWorkDay - currentDay;

      if (daysToAdd <= 0) {
        daysToAdd += 7; // Next week
      }

      reminderDate.setDate(today.getDate() + daysToAdd);

      // Set reminder time to 1 hour after shift end time
      const endTime = this.parseTime(activeShift.endTime);
      reminderDate.setHours(endTime.hours + 1, endTime.minutes, 0, 0);

      // Schedule notification
      await notificationService.scheduleWeeklyShiftReminder(reminderDate);

    } catch (error) {
      console.error('Error scheduling weekly reminder:', error);
    }
  }

  // C. Tính toán DailyWorkStatus với Logic Mới
  async calculateDailyWorkStatusNew(date: string, logs: AttendanceLog[], shift: Shift): Promise<DailyWorkStatusNew> {
    try {
      const workDate = parseISO(date);
      const settings = await storageService.getUserSettings();

      // A. Xây dựng Timestamp Chuẩn
      const timestamps = timeSyncService.buildScheduledTimestamps(shift, workDate);
      const {
        scheduledStartTimeFull,
        scheduledOfficeEndTimeFull,
        scheduledEndTimeFull,
        isOvernightShift
      } = timestamps;

      // Find relevant logs
      const goWorkLog = logs.find(log => log.type === 'go_work');
      const checkInLog = logs.find(log => log.type === 'check_in');
      const checkOutLog = logs.find(log => log.type === 'check_out');
      const completeLog = logs.find(log => log.type === 'complete');

      // Determine status
      let status: DailyWorkStatus['status'] = 'CHUA_DI';
      let vaoLogTime: string | null = null;
      let raLogTime: string | null = null;

      if (completeLog) {
        status = 'DU_CONG';
        vaoLogTime = checkInLog?.time || null;
        raLogTime = checkOutLog?.time || null;
      } else if (checkInLog && checkOutLog) {
        const checkInTime = parseISO(checkInLog.time);
        const checkOutTime = parseISO(checkOutLog.time);

        // Check if late or early
        const lateThreshold = settings.lateThresholdMinutes || 15;
        const isLate = checkInTime > addMinutes(scheduledStartTimeFull, lateThreshold);
        const isEarly = checkOutTime < subMinutes(scheduledOfficeEndTimeFull, 30);

        if (isLate && isEarly) {
          status = 'DI_MUON_VE_SOM';
        } else if (isLate) {
          status = 'DI_MUON';
        } else if (isEarly) {
          status = 'VE_SOM';
        } else {
          status = 'DU_CONG';
        }

        vaoLogTime = checkInLog.time;
        raLogTime = checkOutLog.time;
      } else if (checkInLog) {
        status = 'CHUA_RA';
        vaoLogTime = checkInLog.time;
      } else if (goWorkLog) {
        status = 'DA_DI_CHUA_VAO';
      }

      // B. Logic Tính Công
      let standardHours = 0;
      let otHours = 0;
      let totalHours = 0;
      let sundayHours = 0;
      let nightHours = 0;
      let isHolidayWork = false;

      if (status === 'DU_CONG') {
        // Tính theo lịch trình ca cố định
        const standardMinutes = Math.max(0,
          (scheduledOfficeEndTimeFull.getTime() - scheduledStartTimeFull.getTime()) / (1000 * 60) - shift.breakMinutes
        );
        standardHours = standardMinutes / 60;

        // Overtime hours (từ office end đến shift end)
        const otMinutes = Math.max(0,
          (scheduledEndTimeFull.getTime() - scheduledOfficeEndTimeFull.getTime()) / (1000 * 60)
        );
        otHours = otMinutes / 60;

        totalHours = standardHours + otHours;

        // Phân loại Giờ Đặc biệt theo Lịch trình
        if (workDate.getDay() === 0) {
          sundayHours = totalHours;
        }

        nightHours = this.calculateNightHoursNew(scheduledStartTimeFull, scheduledEndTimeFull, workDate);
        isHolidayWork = await this.isHolidayDate(workDate);

      } else if (status === 'DI_MUON' || status === 'VE_SOM' || status === 'DI_MUON_VE_SOM') {
        // Tính theo thời gian thực tế
        if (vaoLogTime && raLogTime) {
          const actualStart = parseISO(vaoLogTime);
          const actualEnd = parseISO(raLogTime);

          // Standard hours (up to office end time)
          const standardEndTime = actualEnd <= scheduledOfficeEndTimeFull ? actualEnd : scheduledOfficeEndTimeFull;
          const standardMinutes = Math.max(0,
            (standardEndTime.getTime() - actualStart.getTime()) / (1000 * 60) - shift.breakMinutes
          );
          standardHours = Math.max(0, standardMinutes / 60);

          // Overtime hours
          if (actualEnd > scheduledOfficeEndTimeFull) {
            const otMinutes = (actualEnd.getTime() - scheduledOfficeEndTimeFull.getTime()) / (1000 * 60);
            otHours = otMinutes / 60;
          }

          totalHours = standardHours + otHours;

          // Special hours
          if (workDate.getDay() === 0) {
            sundayHours = totalHours;
          }

          nightHours = this.calculateNightHoursNew(actualStart, actualEnd, workDate);
          isHolidayWork = await this.isHolidayDate(workDate);
        }
      }

      return {
        date,
        status,
        vaoLogTime,
        raLogTime,
        standardHours: Math.round(standardHours * 100) / 100,
        otHours: Math.round(otHours * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        sundayHours: Math.round(sundayHours * 100) / 100,
        nightHours: Math.round(nightHours * 100) / 100,
        isHolidayWork,
        notes: '',
      };
    } catch (error) {
      console.error('Error calculating daily work status (new):', error);
      throw error;
    }
  }

  // Calculate night hours for a specific time period
  private calculateNightHoursNew(startTime: Date, endTime: Date, workDate: Date): number {
    // Night period: 22:00 - 06:00
    const nightStartHour = 22;
    const nightEndHour = 6;

    let totalNightMinutes = 0;

    // Create night period boundaries for the work date and next day
    const workDateStart = startOfDay(workDate);
    const nextDayStart = addDays(workDateStart, 1);

    // Night period of work date (22:00 - 23:59)
    const nightStart1 = new Date(workDateStart);
    nightStart1.setHours(nightStartHour, 0, 0, 0);
    const nightEnd1 = new Date(workDateStart);
    nightEnd1.setHours(23, 59, 59, 999);

    // Night period of next day (00:00 - 06:00)
    const nightStart2 = new Date(nextDayStart);
    nightStart2.setHours(0, 0, 0, 0);
    const nightEnd2 = new Date(nextDayStart);
    nightEnd2.setHours(nightEndHour, 0, 0, 0);

    // Calculate overlap with first night period (22:00 - 23:59)
    if (startTime <= nightEnd1 && endTime >= nightStart1) {
      const overlapStart = startTime > nightStart1 ? startTime : nightStart1;
      const overlapEnd = endTime < nightEnd1 ? endTime : nightEnd1;
      totalNightMinutes += Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));
    }

    // Calculate overlap with second night period (00:00 - 06:00)
    if (startTime <= nightEnd2 && endTime >= nightStart2) {
      const overlapStart = startTime > nightStart2 ? startTime : nightStart2;
      const overlapEnd = endTime < nightEnd2 ? endTime : nightEnd2;
      totalNightMinutes += Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));
    }

    return totalNightMinutes / 60;
  }

  // Check if a date is a holiday
  private async isHolidayDate(date: Date): Promise<boolean> {
    try {
      const holidays = await storageService.getPublicHolidays();
      const dateString = format(date, 'yyyy-MM-dd');
      return holidays.some(holiday => holiday.date === dateString);
    } catch (error) {
      console.error('Error checking holiday date:', error);
      return false;
    }
  }

  // Validation for manual log updates
  validateLogUpdate(checkInTime: string, checkOutTime: string, shift: Shift, workDate: Date): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      const checkIn = parseISO(checkInTime);
      const checkOut = parseISO(checkOutTime);

      // Basic validation: check-out must be after check-in
      if (checkOut <= checkIn) {
        errors.push('Thời gian ra phải sau thời gian vào');
      }

      // Get shift boundaries
      const timestamps = timeSyncService.buildScheduledTimestamps(shift, workDate);
      const { scheduledStartTimeFull, scheduledEndTimeFull } = timestamps;

      // Check if times are within reasonable shift boundaries (with some flexibility)
      const flexibleStart = subHours(scheduledStartTimeFull, 2); // 2 hours before shift start
      const flexibleEnd = addHours(scheduledEndTimeFull, 4); // 4 hours after shift end

      if (checkIn < flexibleStart || checkIn > flexibleEnd) {
        errors.push('Thời gian vào không hợp lý so với ca làm việc');
      }

      if (checkOut < flexibleStart || checkOut > flexibleEnd) {
        errors.push('Thời gian ra không hợp lý so với ca làm việc');
      }

      // Check minimum work duration (at least 1 hour)
      const workDuration = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      if (workDuration < 1) {
        errors.push('Thời gian làm việc phải ít nhất 1 giờ');
      }

      // Check maximum work duration (not more than 16 hours)
      if (workDuration > 16) {
        errors.push('Thời gian làm việc không được quá 16 giờ');
      }

    } catch (error) {
      errors.push('Định dạng thời gian không hợp lệ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper methods
  private parseShiftTime(date: string, timeString: string, isNightShift: boolean): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const shiftDate = new Date(date);
    shiftDate.setHours(hours, minutes, 0, 0);

    // For night shifts, if time is in early morning (< 12), it's next day
    if (isNightShift && hours < 12) {
      shiftDate.setDate(shiftDate.getDate() + 1);
    }

    return shiftDate;
  }

  private calculateScheduledHours(shift: Shift): number {
    const startTime = this.parseTime(shift.startTime);
    const endTime = this.parseTime(shift.officeEndTime);

    let totalMinutes = 0;

    if (shift.isNightShift && endTime.hours < startTime.hours) {
      // Night shift crosses midnight
      totalMinutes = (24 - startTime.hours) * 60 - startTime.minutes + endTime.hours * 60 + endTime.minutes;
    } else {
      totalMinutes = (endTime.hours - startTime.hours) * 60 + (endTime.minutes - startTime.minutes);
    }

    // Subtract break time
    totalMinutes -= shift.breakMinutes;

    return Math.max(0, totalMinutes / 60);
  }

  private calculateNightHours(shift: Shift): number {
    // Calculate hours between 22:00 and 06:00
    const startTime = this.parseTime(shift.startTime);
    const endTime = this.parseTime(shift.officeEndTime);

    let nightMinutes = 0;

    // Night period: 22:00 - 06:00
    const nightStart = { hours: 22, minutes: 0 };
    const nightEnd = { hours: 6, minutes: 0 };

    if (shift.isNightShift) {
      // For night shifts, calculate overlap with night period
      if (startTime.hours >= 22 || startTime.hours < 6) {
        if (endTime.hours <= 6) {
          // Shift entirely within night period
          nightMinutes = this.calculateScheduledHours(shift) * 60;
        } else {
          // Shift starts in night, ends in day
          nightMinutes = (6 - startTime.hours) * 60 - startTime.minutes;
        }
      }
    }

    return Math.max(0, nightMinutes / 60);
  }

  private parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  private isHoliday(date: string, holidays: PublicHoliday[]): boolean {
    return holidays.some(holiday => holiday.date === date);
  }

  private async setupLocationIfNeeded(locationType: 'home' | 'work'): Promise<void> {
    const settings = await storageService.getUserSettings();

    if (!settings.weatherLocation ||
        (locationType === 'home' && !settings.weatherLocation.home) ||
        (locationType === 'work' && !settings.weatherLocation.work && !settings.weatherLocation.useSingleLocation)) {

      // This would trigger location setup in the UI
      // For now, we'll just log it
      console.log(`Need to setup ${locationType} location`);
    }
  }

  private async cancelRelatedNotifications(logType: AttendanceLog['type']): Promise<void> {
    // Cancel specific notifications based on log type
    const scheduledNotifications = await notificationService.getAllScheduledNotifications();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data;
      if (data?.type === logType) {
        await notificationService.cancelShiftReminders();
        break;
      }
    }
  }

  private async recalculateWorkStatus(date: string): Promise<void> {
    const logs = await storageService.getAttendanceLogsForDate(date);
    const activeShift = await storageService.getActiveShift();

    if (activeShift) {
      const status = await this.calculateDailyWorkStatus(date, logs, activeShift);
      await storageService.setDailyWorkStatusForDate(date, status);
    }
  }
}

export const workManager = new WorkManager();
