/**
 * Work Manager Service - Quản lý logic chấm công và trạng thái làm việc
 * Xử lý tất cả logic nghiệp vụ liên quan đến chấm công, tính toán giờ làm việc
 */

import { format, parseISO, addDays, differenceInMinutes, differenceInSeconds, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { storageService } from './storage';
import { notificationService } from './notifications';
import { 
  AttendanceLog, 
  ButtonState, 
  DailyWorkStatus, 
  DailyWorkStatusNew,
  Shift, 
  UserSettings,
  RapidPressDetectedException 
} from '../types';
import { BUTTON_STATES, DEFAULT_SETTINGS } from '../constants';

class WorkManager {
  /**
   * Lấy trạng thái hiện tại của nút chấm công
   */
  async getCurrentButtonState(date: string): Promise<ButtonState> {
    try {
      const settings = await storageService.getUserSettings();
      const activeShiftId = await storageService.getActiveShiftId();
      const shifts = await storageService.getShiftList();
      const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;
      
      if (!activeShift) {
        return 'go_work';
      }

      const logs = await storageService.getAttendanceLogsForDate(date);
      const now = new Date();
      const currentTime = format(now, 'HH:mm');

      // Kiểm tra xem có phải ngày làm việc không
      const dayOfWeek = now.getDay();
      if (!activeShift.workDays.includes(dayOfWeek)) {
        return 'completed_day';
      }

      // Kiểm tra auto reset logic - reset 1 giờ trước giờ khởi hành
      const departureTime = activeShift.departureTime;
      const [depHour, depMin] = departureTime.split(':').map(Number);
      const resetHour = depHour - 1;
      const resetTime = `${resetHour.toString().padStart(2, '0')}:${depMin.toString().padStart(2, '0')}`;
      
      if (currentTime < resetTime) {
        return 'completed_day';
      }

      // Kiểm tra hide logic - ẩn 2 giờ sau giờ kết thúc ca
      const endTime = activeShift.endTime;
      const [endHour, endMin] = endTime.split(':').map(Number);
      let hideHour = endHour + 2;
      let hideDay = 0;
      
      if (hideHour >= 24) {
        hideHour -= 24;
        hideDay = 1;
      }
      
      const hideTime = `${hideHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      
      if (hideDay === 0 && currentTime > hideTime) {
        return 'completed_day';
      }

      // Xác định trạng thái dựa trên logs
      const hasGoWork = logs.some(log => log.type === 'go_work');
      const hasCheckIn = logs.some(log => log.type === 'check_in');
      const hasCheckOut = logs.some(log => log.type === 'check_out');
      const hasComplete = logs.some(log => log.type === 'complete');

      if (hasComplete) {
        return 'completed_day';
      }

      if (settings.multiButtonMode === 'simple') {
        return hasGoWork ? 'completed_day' : 'go_work';
      }

      // Full mode logic
      if (!hasGoWork) {
        return 'go_work';
      }

      if (!hasCheckIn) {
        // Kiểm tra thời gian để quyết định awaiting hay check_in
        if (currentTime < activeShift.startTime) {
          return 'awaiting_check_in';
        }
        return 'check_in';
      }

      if (!hasCheckOut) {
        // Kiểm tra thời gian để quyết định working hay check_out
        if (currentTime < activeShift.endTime) {
          return 'working';
        }
        return 'check_out';
      }

      // Có check_out rồi, chờ complete
      return 'complete';

    } catch (error) {
      console.error('Error getting current button state:', error);
      return 'go_work';
    }
  }

  /**
   * Xử lý khi người dùng bấm nút chấm công
   */
  async handleButtonPress(currentState: ButtonState): Promise<void> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date().toISOString();
      const settings = await storageService.getUserSettings();

      console.log(`🔘 WorkManager: Handling button press - State: ${currentState}`);

      switch (currentState) {
        case 'go_work':
          await this.addAttendanceLog(today, 'go_work', now);
          break;

        case 'check_in':
          await this.addAttendanceLog(today, 'check_in', now);
          break;

        case 'check_out':
          // Kiểm tra rapid press logic
          const logs = await storageService.getAttendanceLogsForDate(today);
          const checkInLog = logs.find(log => log.type === 'check_in');
          
          if (checkInLog && settings.multiButtonMode === 'full') {
            const checkInTime = new Date(checkInLog.time);
            const checkOutTime = new Date(now);
            const durationSeconds = differenceInSeconds(checkOutTime, checkInTime);
            
            if (durationSeconds < settings.rapidPressThresholdSeconds) {
              // Throw exception để UI xử lý confirmation dialog
              throw new RapidPressDetectedException(
                durationSeconds,
                settings.rapidPressThresholdSeconds,
                checkInLog.time,
                now
              );
            }
          }
          
          await this.addAttendanceLog(today, 'check_out', now);
          break;

        case 'complete':
          await this.addAttendanceLog(today, 'complete', now);
          break;

        default:
          console.log(`🔘 WorkManager: No action for state: ${currentState}`);
          break;
      }

      // Tính toán và lưu daily work status
      await this.calculateAndSaveDailyWorkStatus(today);

    } catch (error) {
      if (error instanceof RapidPressDetectedException) {
        throw error; // Re-throw để UI xử lý
      }
      console.error('Error handling button press:', error);
      throw error;
    }
  }

  /**
   * Thêm log chấm công
   */
  private async addAttendanceLog(date: string, type: AttendanceLog['type'], time: string): Promise<void> {
    try {
      const logs = await storageService.getAttendanceLogsForDate(date);
      const newLog: AttendanceLog = { type, time };
      
      logs.push(newLog);
      await storageService.setAttendanceLogsForDate(date, logs);
      
      console.log(`📝 WorkManager: Added ${type} log at ${time}`);
    } catch (error) {
      console.error('Error adding attendance log:', error);
      throw error;
    }
  }

  /**
   * Tính toán và lưu daily work status
   */
  private async calculateAndSaveDailyWorkStatus(date: string): Promise<void> {
    try {
      const logs = await storageService.getAttendanceLogsForDate(date);
      const activeShiftId = await storageService.getActiveShiftId();
      const shifts = await storageService.getShiftList();
      const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

      if (!activeShift) {
        console.log('⚠️ WorkManager: No active shift, skipping status calculation');
        return;
      }

      const status = await this.calculateDailyWorkStatusNew(date, logs, activeShift);
      
      // Convert to old format for compatibility
      const dailyStatus: DailyWorkStatus = {
        status: status.status as any,
        vaoLogTime: status.vaoLogTime,
        raLogTime: status.raLogTime,
        standardHoursScheduled: status.standardHours,
        otHoursScheduled: status.otHours,
        sundayHoursScheduled: status.sundayHours,
        nightHoursScheduled: status.nightHours,
        totalHoursScheduled: status.totalHours,
        lateMinutes: 0, // TODO: Calculate based on logs vs schedule
        earlyMinutes: 0, // TODO: Calculate based on logs vs schedule
        isHolidayWork: status.isHolidayWork,
        isManualOverride: false
      };

      await storageService.setDailyWorkStatusForDate(date, dailyStatus);
      console.log(`💾 WorkManager: Saved daily work status for ${date}:`, status.status);

    } catch (error) {
      console.error('Error calculating and saving daily work status:', error);
    }
  }

  /**
   * Tính toán trạng thái làm việc mới
   */
  async calculateDailyWorkStatusNew(date: string, logs: AttendanceLog[], shift: Shift): Promise<DailyWorkStatusNew> {
    try {
      const goWorkLog = logs.find(log => log.type === 'go_work');
      const checkInLog = logs.find(log => log.type === 'check_in');
      const checkOutLog = logs.find(log => log.type === 'check_out');
      const completeLog = logs.find(log => log.type === 'complete');

      // Xác định trạng thái dựa trên logs
      let status: DailyWorkStatusNew['status'] = 'CHUA_DI';

      if (!goWorkLog) {
        status = 'CHUA_DI';
      } else if (!checkInLog) {
        status = 'DA_DI_CHUA_VAO';
      } else if (!checkOutLog) {
        status = 'CHUA_RA';
      } else {
        // Có đủ check-in và check-out, kiểm tra thời gian
        const checkInTime = new Date(checkInLog.time);
        const checkOutTime = new Date(checkOutLog.time);
        const shiftStartTime = this.parseTimeToDate(date, shift.startTime);
        const shiftEndTime = this.parseTimeToDate(date, shift.endTime);

        // Xử lý ca đêm (endTime < startTime)
        if (shift.isNightShift && shift.endTime < shift.startTime) {
          shiftEndTime.setDate(shiftEndTime.getDate() + 1);
        }

        const isLate = checkInTime > shiftStartTime;
        const isEarly = checkOutTime < shiftEndTime;

        if (completeLog) {
          status = 'DU_CONG'; // Complete log có ưu tiên cao nhất
        } else if (isLate && isEarly) {
          status = 'DI_MUON_VE_SOM';
        } else if (isLate) {
          status = 'DI_MUON';
        } else if (isEarly) {
          status = 'VE_SOM';
        } else {
          status = 'DU_CONG';
        }
      }

      // Tính toán giờ làm việc
      const workHours = this.calculateWorkHours(date, logs, shift, status);

      return {
        date,
        status,
        vaoLogTime: checkInLog?.time || null,
        raLogTime: checkOutLog?.time || null,
        standardHours: workHours.standardHours,
        otHours: workHours.otHours,
        totalHours: workHours.totalHours,
        sundayHours: workHours.sundayHours,
        nightHours: workHours.nightHours,
        isHolidayWork: workHours.isHolidayWork,
        notes: ''
      };

    } catch (error) {
      console.error('Error calculating daily work status:', error);
      return {
        date,
        status: 'CHUA_DI',
        vaoLogTime: null,
        raLogTime: null,
        standardHours: 0,
        otHours: 0,
        totalHours: 0,
        sundayHours: 0,
        nightHours: 0,
        isHolidayWork: false,
        notes: ''
      };
    }
  }

  /**
   * Parse time string to Date object for specific date
   */
  private parseTimeToDate(date: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const dateObj = parseISO(date);
    dateObj.setHours(hours, minutes, 0, 0);
    return dateObj;
  }

  /**
   * Tính toán giờ làm việc
   */
  private calculateWorkHours(date: string, logs: AttendanceLog[], shift: Shift, status: DailyWorkStatusNew['status']) {
    const dateObj = parseISO(date);
    const dayOfWeek = dateObj.getDay();
    const isSunday = dayOfWeek === 0;
    const isHolidayWork = false; // TODO: Check against holiday list

    // Nếu trạng thái là DU_CONG, tính theo lịch trình ca
    if (status === 'DU_CONG') {
      const standardHours = 8; // Default standard hours
      return {
        standardHours,
        otHours: 0,
        totalHours: standardHours,
        sundayHours: isSunday ? standardHours : 0,
        nightHours: shift.isNightShift ? standardHours : 0,
        isHolidayWork
      };
    }

    // Các trạng thái khác tính theo thời gian thực tế (nếu có)
    const checkInLog = logs.find(log => log.type === 'check_in');
    const checkOutLog = logs.find(log => log.type === 'check_out');

    if (!checkInLog || !checkOutLog) {
      return {
        standardHours: 0,
        otHours: 0,
        totalHours: 0,
        sundayHours: 0,
        nightHours: 0,
        isHolidayWork
      };
    }

    const checkInTime = new Date(checkInLog.time);
    const checkOutTime = new Date(checkOutLog.time);
    const totalMinutes = differenceInMinutes(checkOutTime, checkInTime);
    const totalHours = Math.max(0, (totalMinutes - shift.breakMinutes) / 60);

    return {
      standardHours: Math.min(totalHours, 8),
      otHours: Math.max(0, totalHours - 8),
      totalHours,
      sundayHours: isSunday ? totalHours : 0,
      nightHours: shift.isNightShift ? totalHours : 0,
      isHolidayWork
    };
  }

  /**
   * Xử lý xác nhận "Bấm Nhanh" - tính đủ công theo lịch trình
   */
  async calculateDailyWorkStatusWithRapidPressConfirmed(
    date: string,
    logs: AttendanceLog[],
    shift: Shift,
    checkInTime: string,
    checkOutTime: string
  ): Promise<DailyWorkStatus> {
    try {
      console.log('🚀 WorkManager: Processing rapid press confirmation');

      // Tạo status với trạng thái DU_CONG và giờ làm việc theo lịch trình
      const standardHours = 8; // Default standard hours
      const dateObj = parseISO(date);
      const isSunday = dateObj.getDay() === 0;

      const status: DailyWorkStatus = {
        status: 'DU_CONG' as any,
        vaoLogTime: checkInTime,
        raLogTime: checkOutTime,
        standardHoursScheduled: standardHours,
        otHoursScheduled: 0,
        sundayHoursScheduled: isSunday ? standardHours : 0,
        nightHoursScheduled: shift.isNightShift ? standardHours : 0,
        totalHoursScheduled: standardHours,
        lateMinutes: 0,
        earlyMinutes: 0,
        isHolidayWork: false,
        isManualOverride: false
      };

      // Lưu vào storage
      await storageService.setDailyWorkStatusForDate(date, status);
      console.log('✅ WorkManager: Saved rapid press confirmed status');

      return status;

    } catch (error) {
      console.error('Error processing rapid press confirmation:', error);
      throw error;
    }
  }

  /**
   * Reset daily status - xóa logs và status cho ngày
   */
  async resetDailyStatus(date: string): Promise<void> {
    try {
      console.log(`🔄 WorkManager: Resetting daily status for ${date}`);

      // Xóa attendance logs
      await storageService.clearAttendanceLogsForDate(date);

      // Xóa daily work status - không thể set null, thay vào đó xóa khỏi storage
      const allStatus = await storageService.getDailyWorkStatus();
      delete allStatus[date];
      await storageService.setDailyWorkStatus(allStatus);

      console.log('✅ WorkManager: Daily status reset completed');

    } catch (error) {
      console.error('Error resetting daily status:', error);
      throw error;
    }
  }

  /**
   * Đặt trạng thái làm việc thủ công
   */
  async setManualWorkStatus(date: string, status: DailyWorkStatus['status'], selectedShiftId?: string): Promise<void> {
    try {
      console.log(`📝 WorkManager: Setting manual work status for ${date}: ${status}`, { selectedShiftId });

      // Sử dụng selectedShiftId nếu có, nếu không thì dùng activeShift
      const activeShiftId = selectedShiftId || await storageService.getActiveShiftId();
      const shifts = await storageService.getShiftList();
      const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

      if (!activeShift) {
        throw new Error('Không có ca làm việc đang hoạt động');
      }

      const dateObj = parseISO(date);
      const isSunday = dateObj.getDay() === 0;
      const standardHours = status === 'CONG_TAC' ? 8 : (status === 'DU_CONG' ? 8 : 0);

      const workStatus: DailyWorkStatus = {
        status,
        appliedShiftIdForDay: activeShiftId, // Lưu ca làm việc áp dụng cho ngày này
        vaoLogTime: undefined,
        raLogTime: undefined,
        standardHoursScheduled: standardHours,
        otHoursScheduled: 0,
        sundayHoursScheduled: isSunday ? standardHours : 0,
        nightHoursScheduled: activeShift.isNightShift ? standardHours : 0,
        totalHoursScheduled: standardHours,
        lateMinutes: 0,
        earlyMinutes: 0,
        isHolidayWork: false,
        isManualOverride: true
      };

      await storageService.setDailyWorkStatusForDate(date, workStatus);
      console.log('✅ WorkManager: Manual work status saved');

    } catch (error) {
      console.error('Error setting manual work status:', error);
      throw error;
    }
  }

  /**
   * Tính lại trạng thái từ attendance logs
   */
  async recalculateFromAttendanceLogs(date: string): Promise<void> {
    try {
      console.log(`🔄 WorkManager: Recalculating status from logs for ${date}`);

      // Lấy logs và tính lại trạng thái
      const logs = await storageService.getAttendanceLogsForDate(date);
      const activeShiftId = await storageService.getActiveShiftId();
      const shifts = await storageService.getShiftList();
      const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

      if (!activeShift) {
        throw new Error('Không tìm thấy ca làm việc');
      }

      // Tính toán lại trạng thái dựa trên logs
      const workStatus = await this.calculateDailyWorkStatus(date, activeShift, logs);

      // Xóa manual override flag
      workStatus.isManualOverride = false;

      await storageService.setDailyWorkStatusForDate(date, workStatus);
      console.log('✅ WorkManager: Status recalculated from logs');

    } catch (error) {
      console.error('❌ WorkManager: Error recalculating from logs:', error);
      throw error;
    }
  }

  /**
   * Xóa trạng thái thủ công và tính lại từ chấm công
   */
  async clearManualStatus(date: string): Promise<void> {
    try {
      console.log(`🗑️ WorkManager: Clearing manual status for ${date}`);

      // Tính lại từ logs
      await this.recalculateFromAttendanceLogs(date);

      console.log('✅ WorkManager: Manual status cleared and recalculated');

    } catch (error) {
      console.error('❌ WorkManager: Error clearing manual status:', error);
      throw error;
    }
  }

  /**
   * Cập nhật thời gian chấm công
   */
  async updateAttendanceTime(date: string, checkInTime: string, checkOutTime: string): Promise<void> {
    try {
      console.log(`🕐 WorkManager: Updating attendance time for ${date}`);

      // Validate times
      const checkIn = new Date(checkInTime);
      const checkOut = new Date(checkOutTime);

      if (checkOut <= checkIn) {
        throw new Error('Thời gian ra phải sau thời gian vào');
      }

      // Get existing status or create new one
      let status = await storageService.getDailyWorkStatusForDate(date);

      if (!status) {
        const activeShiftId = await storageService.getActiveShiftId();
        const shifts = await storageService.getShiftList();
        const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

        if (!activeShift) {
          throw new Error('Không có ca làm việc đang hoạt động');
        }

        // Create new status
        status = {
          status: 'DU_CONG' as any,
          standardHoursScheduled: 8,
          otHoursScheduled: 0,
          sundayHoursScheduled: 0,
          nightHoursScheduled: 0,
          totalHoursScheduled: 8,
          lateMinutes: 0,
          earlyMinutes: 0,
          isHolidayWork: false,
          isManualOverride: true
        };
      }

      // Update times
      status.vaoLogTime = checkInTime;
      status.raLogTime = checkOutTime;
      status.isManualOverride = true;

      await storageService.setDailyWorkStatusForDate(date, status);
      console.log('✅ WorkManager: Attendance time updated');

    } catch (error) {
      console.error('Error updating attendance time:', error);
      throw error;
    }
  }

  /**
   * Tính lại từ attendance logs
   */
  async recalculateFromAttendanceLogs(date: string): Promise<void> {
    try {
      console.log(`🔄 WorkManager: Recalculating from attendance logs for ${date}`);

      const activeShiftId = await storageService.getActiveShiftId();
      const shifts = await storageService.getShiftList();
      const activeShift = activeShiftId ? shifts.find((s: Shift) => s.id === activeShiftId) : null;

      if (!activeShift) {
        throw new Error('Không có ca làm việc đang hoạt động');
      }

      // Recalculate status based on logs
      await this.calculateAndSaveDailyWorkStatus(date);

      // Mark as not manual override
      const status = await storageService.getDailyWorkStatusForDate(date);
      if (status) {
        status.isManualOverride = false;
        await storageService.setDailyWorkStatusForDate(date, status);
      }

      console.log('✅ WorkManager: Recalculation completed');

    } catch (error) {
      console.error('Error recalculating from attendance logs:', error);
      throw error;
    }
  }

  /**
   * Xóa trạng thái thủ công và tính lại
   */
  async clearManualStatusAndRecalculate(date: string): Promise<void> {
    try {
      console.log(`🗑️ WorkManager: Clearing manual status and recalculating for ${date}`);

      // Recalculate from logs
      await this.recalculateFromAttendanceLogs(date);

      console.log('✅ WorkManager: Manual status cleared and recalculated');

    } catch (error) {
      console.error('Error clearing manual status:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra và xoay ca làm việc (shift rotation)
   */
  async checkAndRotateShifts(): Promise<void> {
    try {
      console.log('🔄 WorkManager: Checking shift rotation');

      const settings = await storageService.getUserSettings();

      if (!settings.rotationConfig || settings.changeShiftReminderMode !== 'rotate') {
        console.log('⏭️ WorkManager: Shift rotation disabled');
        return;
      }

      const { rotationShifts, rotationFrequency, rotationLastAppliedDate, currentRotationIndex } = settings.rotationConfig;

      if (!rotationShifts || rotationShifts.length === 0) {
        console.log('⚠️ WorkManager: No rotation shifts configured');
        return;
      }

      // Check if rotation is due
      const now = new Date();
      const lastApplied = rotationLastAppliedDate ? parseISO(rotationLastAppliedDate) : null;

      let shouldRotate = false;

      if (!lastApplied) {
        shouldRotate = true;
      } else {
        const daysSinceLastRotation = differenceInMinutes(now, lastApplied) / (24 * 60);

        switch (rotationFrequency) {
          case 'weekly':
            shouldRotate = daysSinceLastRotation >= 7;
            break;
          case 'biweekly':
            shouldRotate = daysSinceLastRotation >= 14;
            break;
          case 'triweekly':
            shouldRotate = daysSinceLastRotation >= 21;
            break;
          case 'monthly':
            shouldRotate = daysSinceLastRotation >= 30;
            break;
        }
      }

      if (shouldRotate) {
        const nextIndex = (currentRotationIndex + 1) % rotationShifts.length;
        const nextShiftId = rotationShifts[nextIndex];

        // Apply rotation
        await storageService.setActiveShiftId(nextShiftId);

        // Update rotation config
        const updatedConfig = {
          ...settings.rotationConfig,
          currentRotationIndex: nextIndex,
          rotationLastAppliedDate: now.toISOString()
        };

        await storageService.setUserSettings({
          ...settings,
          rotationConfig: updatedConfig
        });

        console.log(`✅ WorkManager: Rotated to shift ${nextShiftId}`);
      }

    } catch (error) {
      console.error('Error checking shift rotation:', error);
    }
  }

  /**
   * Lập lịch nhắc nhở hàng tuần
   */
  async scheduleWeeklyReminder(): Promise<void> {
    try {
      console.log('📅 WorkManager: Scheduling weekly reminder');

      const settings = await storageService.getUserSettings();

      if (settings.changeShiftReminderMode !== 'ask_weekly') {
        console.log('⏭️ WorkManager: Weekly reminder disabled');
        return;
      }

      // Schedule reminder for end of week (Friday evening)
      const now = new Date();
      const friday = new Date(now);
      friday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
      friday.setHours(17, 0, 0, 0); // 5 PM Friday

      if (friday <= now) {
        friday.setDate(friday.getDate() + 7); // Next Friday
      }

      await notificationService.scheduleWeeklyShiftReminder(friday);
      console.log(`✅ WorkManager: Weekly reminder scheduled for ${friday.toISOString()}`);

    } catch (error) {
      console.error('Error scheduling weekly reminder:', error);
    }
  }

  /**
   * Lấy thông tin hiển thị thời gian
   */
  async getTimeDisplayInfo(): Promise<any> {
    try {
      const activeShift = await storageService.getActiveShift();
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayStatus = await storageService.getDailyWorkStatusForDate(today);
      const logs = await storageService.getAttendanceLogsForDate(today);

      if (!activeShift) {
        return {
          currentTime: format(new Date(), 'HH:mm'),
          shiftInfo: null,
          workStatus: null,
          nextAction: null
        };
      }

      const now = new Date();
      const currentTime = format(now, 'HH:mm');

      return {
        currentTime,
        shiftInfo: {
          name: activeShift.name,
          startTime: activeShift.startTime,
          endTime: activeShift.endTime,
          departureTime: activeShift.departureTime
        },
        workStatus: todayStatus,
        nextAction: await this.getCurrentButtonState(today),
        logs: logs.map(log => ({
          type: log.type,
          time: format(parseISO(log.time), 'HH:mm')
        }))
      };

    } catch (error) {
      console.error('Error getting time display info:', error);
      return {
        currentTime: format(new Date(), 'HH:mm'),
        shiftInfo: null,
        workStatus: null,
        nextAction: null
      };
    }
  }
}

// Export singleton instance
export const workManager = new WorkManager();
