import { format, parseISO, startOfDay, endOfDay, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  AttendanceLog, 
  DailyWorkStatus, 
  Shift, 
  ButtonState, 
  UserSettings,
  PublicHoliday 
} from '../types';
import { TIME_CONSTANTS } from '../constants';
import { storageService } from './storage';
import { notificationService } from './notifications';

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

  // Get current button state based on logs and time
  async getCurrentButtonState(date: string): Promise<ButtonState> {
    try {
      const logs = await storageService.getAttendanceLogsForDate(date);
      const settings = await storageService.getUserSettings();
      const activeShift = await storageService.getActiveShift();

      if (!activeShift) {
        return 'go_work';
      }

      // Check if completed
      const completeLog = logs.find(log => log.type === 'complete');
      if (completeLog) {
        return 'completed';
      }

      // Check logs in order
      const goWorkLog = logs.find(log => log.type === 'go_work');
      const checkInLog = logs.find(log => log.type === 'check_in');
      const checkOutLog = logs.find(log => log.type === 'check_out');

      const now = new Date();
      const startTime = this.parseShiftTime(date, activeShift.startTime, activeShift.isNightShift);
      const endTime = this.parseShiftTime(date, activeShift.officeEndTime, activeShift.isNightShift);

      if (!goWorkLog) {
        return 'go_work';
      }

      if (!checkInLog) {
        // Check if it's time to check in (within 30 minutes of start time)
        const timeDiff = Math.abs(now.getTime() - startTime.getTime()) / (1000 * 60);
        if (timeDiff <= 30) {
          return 'check_in';
        }
        return 'waiting_checkin';
      }

      if (!checkOutLog) {
        // Check if it's time to check out (after end time or within 30 minutes before)
        const timeDiff = (now.getTime() - endTime.getTime()) / (1000 * 60);
        if (timeDiff >= -30) {
          return 'check_out';
        }
        return 'working';
      }

      // Both check-in and check-out done
      const finalEndTime = this.parseShiftTime(date, activeShift.endTime, activeShift.isNightShift);
      const timeDiff = (now.getTime() - finalEndTime.getTime()) / (1000 * 60);
      
      if (timeDiff >= 0) {
        return 'complete';
      }
      
      return 'ready_complete';
    } catch (error) {
      console.error('Error getting current button state:', error);
      return 'go_work';
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

      const { shiftIds, frequency, lastAppliedDate } = settings.rotationConfig;
      
      if (shiftIds.length < 2) {
        return;
      }

      const now = new Date();
      const lastApplied = lastAppliedDate ? new Date(lastAppliedDate) : new Date(0);
      
      let shouldRotate = false;
      
      switch (frequency) {
        case 'weekly':
          shouldRotate = (now.getTime() - lastApplied.getTime()) >= (7 * 24 * 60 * 60 * 1000);
          break;
        case 'biweekly':
          shouldRotate = (now.getTime() - lastApplied.getTime()) >= (14 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          shouldRotate = (now.getTime() - lastApplied.getTime()) >= (30 * 24 * 60 * 60 * 1000);
          break;
      }

      if (shouldRotate) {
        const currentShiftId = await storageService.getActiveShiftId();
        const currentIndex = shiftIds.indexOf(currentShiftId || '');
        const nextIndex = (currentIndex + 1) % shiftIds.length;
        const nextShiftId = shiftIds[nextIndex];

        const shifts = await storageService.getShiftList();
        const currentShift = shifts.find(s => s.id === currentShiftId);
        const nextShift = shifts.find(s => s.id === nextShiftId);

        if (nextShift) {
          await storageService.setActiveShiftId(nextShiftId);
          await storageService.updateUserSettings({
            rotationConfig: {
              ...settings.rotationConfig,
              lastAppliedDate: now.toISOString(),
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
    } catch (error) {
      console.error('Error checking and rotating shifts:', error);
    }
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
