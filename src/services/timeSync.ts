import { format, parseISO, addHours, subHours, isBefore, isAfter, isWithinInterval, addDays, startOfDay } from 'date-fns';
import { Shift, ButtonState, AttendanceLog } from '../types';
import { storageService } from './storage';

class TimeSyncService {
  // A. Logic Xác định Ca Đêm
  isOvernightShift(shift: Shift): boolean {
    const startTime = this.parseTimeOnly(shift.startTime);
    const endTime = this.parseTimeOnly(shift.endTime);

    // Ca đêm: thời gian kết thúc nhỏ hơn thời gian bắt đầu (theo logic giờ thuần túy)
    // So sánh theo tổng số phút từ 00:00
    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;

    return endMinutes < startMinutes;
  }

  // Parse time string to time object (hours and minutes only)
  private parseTimeOnly(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  // Parse time string to Date object for a specific date
  private parseTimeForDate(timeString: string, date: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  // B. Xây dựng Timestamp Chuẩn cho Ngày Làm việc D
  buildScheduledTimestamps(shift: Shift, workdayDate: Date): {
    scheduledStartTimeFull: Date;
    scheduledOfficeEndTimeFull: Date;
    scheduledEndTimeFull: Date;
    isOvernightShift: boolean;
  } {
    const isOvernight = this.isOvernightShift(shift);
    const workdayStart = startOfDay(workdayDate);

    // Thời gian bắt đầu ca (luôn trong ngày workdayDate)
    const scheduledStartTimeFull = this.parseTimeForDate(shift.startTime, workdayStart);

    // Thời gian kết thúc văn phòng
    let scheduledOfficeEndTimeFull: Date;
    if (isOvernight) {
      // Ca đêm: kết thúc vào ngày hôm sau
      const nextDay = addDays(workdayStart, 1);
      scheduledOfficeEndTimeFull = this.parseTimeForDate(shift.officeEndTime, nextDay);
    } else {
      // Ca ngày: kết thúc trong cùng ngày
      scheduledOfficeEndTimeFull = this.parseTimeForDate(shift.officeEndTime, workdayStart);
    }

    // Thời gian kết thúc ca (có thể bao gồm overtime)
    let scheduledEndTimeFull: Date;
    if (isOvernight) {
      // Ca đêm: kết thúc vào ngày hôm sau
      const nextDay = addDays(workdayStart, 1);
      scheduledEndTimeFull = this.parseTimeForDate(shift.endTime, nextDay);
    } else {
      // Ca ngày: kết thúc trong cùng ngày
      scheduledEndTimeFull = this.parseTimeForDate(shift.endTime, workdayStart);
    }

    return {
      scheduledStartTimeFull,
      scheduledOfficeEndTimeFull,
      scheduledEndTimeFull,
      isOvernightShift: isOvernight,
    };
  }

  // Parse time string to Date object for today (legacy method for compatibility)
  private parseTimeToday(timeString: string, isNightShift: boolean = false): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const today = new Date();
    const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0, 0);

    // For night shifts, if time is in early morning (< 12), it's next day
    if (isNightShift && hours < 12) {
      timeDate.setDate(timeDate.getDate() + 1);
    }

    return timeDate;
  }

  // Get the next working day for a shift
  private getNextWorkingDay(shift: Shift): Date {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Find next working day
    for (let i = 0; i <= 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const checkDay = checkDate.getDay();

      if (shift.workDays.includes(checkDay)) {
        // If it's today and we haven't passed the departure time yet
        if (i === 0) {
          const departureTime = this.parseTimeToday(shift.departureTime, shift.isNightShift);
          if (isBefore(today, departureTime)) {
            return checkDate;
          }
        } else {
          return checkDate;
        }
      }
    }

    // Fallback to today if no working day found
    return today;
  }

  // Check if current time is within active window for a shift
  isWithinActiveWindow(shift: Shift): boolean {
    const now = new Date();
    const today = startOfDay(now);

    // Use new logic to build timestamps
    const timestamps = this.buildScheduledTimestamps(shift, today);
    const { scheduledStartTimeFull, scheduledEndTimeFull } = timestamps;

    // Active window: 1 hour before departure to 2 hours after end time
    const windowStart = subHours(scheduledStartTimeFull, 1);
    const windowEnd = addHours(scheduledEndTimeFull, 2);

    return isWithinInterval(now, { start: windowStart, end: windowEnd });
  }

  // Check if it's time to reset button to "Đi Làm"
  shouldResetButton(shift: Shift): boolean {
    const now = new Date();
    const today = startOfDay(now);

    // Use new logic to build timestamps
    const timestamps = this.buildScheduledTimestamps(shift, today);
    const { scheduledStartTimeFull } = timestamps;

    const resetTime = subHours(scheduledStartTimeFull, 1);

    // Reset 1 hour before departure time
    return isAfter(now, resetTime) && isBefore(now, scheduledStartTimeFull);
  }

  // Get current button state based on time and logs
  async getCurrentButtonState(shift: Shift, logs: AttendanceLog[], mode?: 'simple' | 'full'): Promise<ButtonState> {
    const now = new Date();
    const today = startOfDay(now);

    // Check if within active window
    if (!this.isWithinActiveWindow(shift)) {
      return 'go_work'; // Hidden/disabled state, but return go_work as default
    }

    // Check if should reset
    if (this.shouldResetButton(shift)) {
      return 'go_work';
    }

    // Use new logic to build timestamps
    const timestamps = this.buildScheduledTimestamps(shift, today);
    const { scheduledStartTimeFull, scheduledOfficeEndTimeFull, scheduledEndTimeFull } = timestamps;

    // Check existing logs for today
    const todayString = format(now, 'yyyy-MM-dd');
    const todayLogs = logs.filter(log =>
      format(parseISO(log.time), 'yyyy-MM-dd') === todayString
    );

    // Determine state based on logs and time - Logic theo thiết kế mới
    const goWorkLog = todayLogs.find(log => log.type === 'go_work');
    const checkInLog = todayLogs.find(log => log.type === 'check_in');
    const checkOutLog = todayLogs.find(log => log.type === 'check_out');
    const completeLog = todayLogs.find(log => log.type === 'complete');

    // Xử lý mode 'simple'
    if (mode === 'simple') {
      if (!goWorkLog) {
        return 'go_work'; // "ĐI LÀM"
      } else {
        return 'completed_day'; // "ĐÃ XÁC NHẬN ĐI LÀM" (disabled)
      }
    }

    // Logic cho mode 'full' (mặc định)
    // 1. Chưa có log go_work -> trạng thái "ĐI LÀM"
    if (!goWorkLog) {
      return 'go_work';
    }

    // 2. Đã có go_work, chưa có check_in
    if (!checkInLog) {
      // Kiểm tra xem đã đến thời điểm cho phép check-in chưa (trong khoảng 30 phút quanh scheduledStartTime)
      const timeDiff = Math.abs(now.getTime() - scheduledStartTimeFull.getTime()) / (1000 * 60);
      if (timeDiff <= 30) {
        return 'check_in'; // "CHẤM CÔNG VÀO"
      }
      return 'awaiting_check_in'; // "CHỜ CHECK-IN"
    }

    // 3. Đã có check_in, chưa có check_out
    if (!checkOutLog) {
      // Kiểm tra xem đã đến thời điểm cho phép check-out chưa (sau thời gian làm việc tối thiểu hoặc gần scheduledOfficeEndTime)
      const timeDiff = (now.getTime() - scheduledOfficeEndTimeFull.getTime()) / (1000 * 60);
      if (timeDiff >= -30) {
        return 'check_out'; // "CHẤM CÔNG RA"
      }
      return 'working'; // "ĐANG LÀM VIỆC" (có thể tạm thời disabled)
    }

    // 4. Đã có check_out, chưa có complete
    if (!completeLog) {
      return 'awaiting_complete'; // "CHỜ HOÀN TẤT" hoặc có thể cho phép "HOÀN TẤT" ngay
    }

    // 5. Đã hoàn tất tất cả
    return 'completed_day'; // "ĐÃ HOÀN TẤT"
  }

  // Check if attendance history should be shown
  shouldShowAttendanceHistory(shift: Shift): boolean {
    return this.isWithinActiveWindow(shift);
  }

  // Get priority notes based on current shift and time
  async getPriorityNotes(shift: Shift, allNotes: any[], displayCount: number): Promise<any[]> {
    const now = new Date();

    // Filter and sort notes
    const relevantNotes = allNotes.filter(note => {
      // Always show priority notes
      if (note.isPriority) return true;

      // Show notes with upcoming reminders (next 24 hours)
      if (note.reminderDateTime) {
        const reminderTime = parseISO(note.reminderDateTime);
        const timeDiff = reminderTime.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000;
      }

      return false;
    });

    // Sort notes with shift-related priority
    const sortedNotes = relevantNotes.sort((a, b) => {
      // 1. Most urgent note first (regardless of type)
      if (a.reminderDateTime && b.reminderDateTime) {
        const aTime = parseISO(a.reminderDateTime).getTime();
        const bTime = parseISO(b.reminderDateTime).getTime();
        const aDiff = Math.abs(aTime - now.getTime());
        const bDiff = Math.abs(bTime - now.getTime());

        if (aDiff !== bDiff) {
          return aDiff - bDiff;
        }
      }

      // 2. Notes associated with current shift
      const aHasCurrentShift = a.associatedShiftIds?.includes(shift.id) || false;
      const bHasCurrentShift = b.associatedShiftIds?.includes(shift.id) || false;

      if (aHasCurrentShift && !bHasCurrentShift) return -1;
      if (!aHasCurrentShift && bHasCurrentShift) return 1;

      // 3. Priority notes
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;

      // 4. By reminder time
      if (a.reminderDateTime && b.reminderDateTime) {
        return parseISO(a.reminderDateTime).getTime() - parseISO(b.reminderDateTime).getTime();
      }
      if (a.reminderDateTime && !b.reminderDateTime) return -1;
      if (!a.reminderDateTime && b.reminderDateTime) return 1;

      // 5. By updated time
      return parseISO(b.updatedAt).getTime() - parseISO(a.updatedAt).getTime();
    });

    return sortedNotes.slice(0, displayCount);
  }

  // Calculate next weather check time based on shift
  getNextWeatherCheckTime(shift: Shift): Date {
    const nextWorkingDay = this.getNextWorkingDay(shift);
    const departureTime = this.parseTimeToday(shift.departureTime, shift.isNightShift);

    // Check weather 1 hour before departure
    return subHours(departureTime, 1);
  }

  // Get next reset time for button
  getNextResetTime(shift: Shift): Date {
    const nextWorkingDay = this.getNextWorkingDay(shift);
    const departureTime = this.parseTimeToday(shift.departureTime, shift.isNightShift);

    // Reset 1 hour before departure
    return subHours(departureTime, 1);
  }

  // Check if current time is appropriate for shift-related notifications
  isAppropriateTimeForShiftNotifications(shift: Shift): boolean {
    const now = new Date();
    const departureTime = this.parseTimeToday(shift.departureTime, shift.isNightShift);
    const endTime = this.parseTimeToday(shift.endTime, shift.isNightShift);

    // Appropriate time: from 2 hours before departure to 1 hour after end
    const notificationStart = subHours(departureTime, 2);
    const notificationEnd = addHours(endTime, 1);

    if (shift.isNightShift && isBefore(endTime, departureTime)) {
      // Night shift crossing midnight
      return isAfter(now, notificationStart) || isBefore(now, notificationEnd);
    } else {
      return isWithinInterval(now, { start: notificationStart, end: notificationEnd });
    }
  }

  // Get display info for current time and shift
  getTimeDisplayInfo(shift: Shift): {
    isActiveWindow: boolean;
    shouldShowButton: boolean;
    shouldShowHistory: boolean;
    timeUntilNextReset: number; // minutes
    currentPhase: 'before_work' | 'work_time' | 'after_work' | 'inactive';
  } {
    const now = new Date();
    const isActiveWindow = this.isWithinActiveWindow(shift);
    const shouldReset = this.shouldResetButton(shift);

    let currentPhase: 'before_work' | 'work_time' | 'after_work' | 'inactive' = 'inactive';

    if (isActiveWindow) {
      const startTime = this.parseTimeToday(shift.startTime, shift.isNightShift);
      const endTime = this.parseTimeToday(shift.endTime, shift.isNightShift);

      if (isBefore(now, startTime)) {
        currentPhase = 'before_work';
      } else if (isWithinInterval(now, { start: startTime, end: endTime })) {
        currentPhase = 'work_time';
      } else {
        currentPhase = 'after_work';
      }
    }

    const nextResetTime = this.getNextResetTime(shift);
    const timeUntilNextReset = Math.max(0, Math.floor((nextResetTime.getTime() - now.getTime()) / (1000 * 60)));

    return {
      isActiveWindow,
      shouldShowButton: isActiveWindow,
      shouldShowHistory: isActiveWindow,
      timeUntilNextReset,
      currentPhase,
    };
  }
}

export const timeSyncService = new TimeSyncService();
