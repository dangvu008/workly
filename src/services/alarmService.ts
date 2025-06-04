/**
 * Alarm Service - Hệ thống báo thức sử dụng âm thanh và rung
 * Thay thế notifications để hoạt động trong Expo Go
 */

import { Platform, Alert, Vibration, AppState, AppStateStatus } from 'react-native';
import { Audio } from 'expo-audio';
import { AlarmData, Shift, Note, UserSettings } from '../types';
import { storageService } from './storage';
import { t } from '../i18n';

interface ScheduledAlarm {
  id: string;
  title: string;
  message: string;
  scheduledTime: Date;
  type: 'shift_reminder' | 'note_reminder' | 'weather_warning';
  relatedId?: string;
  isActive: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface AlarmStatus {
  isSupported: boolean;
  hasAudioPermission: boolean;
  isBackgroundEnabled: boolean;
  scheduledCount: number;
  message: string;
}

class AlarmService {
  private alarms: Map<string, ScheduledAlarm> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private sound: Audio.Sound | null = null;
  private isInitialized = false;
  private appState: AppStateStatus = 'active';
  private currentLanguage = 'vi';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Cấu hình audio với expo-audio
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (audioError) {
        console.warn('⚠️ AlarmService: Không thể cấu hình audio mode:', audioError);
      }

      // Load alarm sound
      await this.loadAlarmSound();

      // Lắng nghe app state changes
      AppState.addEventListener('change', this.handleAppStateChange);

      // Bắt đầu kiểm tra alarms
      this.startAlarmChecker();

      // Load existing alarms from storage
      await this.loadAlarmsFromStorage();

      // Clear expired alarms ngay sau khi load
      await this.clearExpiredAlarms();

      this.isInitialized = true;
      console.log('✅ AlarmService: Đã khởi tạo thành công');
    } catch (error) {
      console.error('❌ AlarmService: Lỗi khởi tạo:', error);
      throw error;
    }
  }

  private async loadAlarmSound(): Promise<void> {
    try {
      // Sử dụng âm thanh hệ thống với expo-audio
      // Tạm thời disable để tránh lỗi network và tập trung vào vibration
      // const sound = await Audio.Sound.createAsync(
      //   { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
      //   { shouldPlay: false, isLooping: false }
      // );
      // this.sound = sound;

      // Tạm thời disable âm thanh, chỉ dùng vibration
      this.sound = null;
      console.log('🔇 AlarmService: Âm thanh tạm thời disabled, chỉ sử dụng vibration');
    } catch (error) {
      console.warn('⚠️ AlarmService: Không thể load âm thanh alarm, sử dụng vibration only');
      this.sound = null;
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    this.appState = nextAppState;

    if (nextAppState === 'active') {
      // App trở lại foreground, chỉ kiểm tra alarms nếu đã qua một khoảng thời gian
      // Tránh trigger ngay lập tức khi app mới khởi động
      setTimeout(() => {
        this.checkAlarms();
      }, 2000); // Đợi 2 giây để app ổn định
    }
  };

  private startAlarmChecker(): void {
    // Kiểm tra mỗi 30 giây
    this.checkInterval = setInterval(() => {
      this.checkAlarms();
    }, 30000);
  }

  private async checkAlarms(): Promise<void> {
    const now = new Date();
    const triggeredAlarms: ScheduledAlarm[] = [];

    // Tìm các alarm cần kích hoạt
    for (const [id, alarm] of this.alarms) {
      if (alarm.isActive && alarm.scheduledTime <= now) {
        triggeredAlarms.push(alarm);
        // Xóa alarm đã kích hoạt
        this.alarms.delete(id);
      }
    }

    // Kích hoạt các alarms
    for (const alarm of triggeredAlarms) {
      await this.triggerAlarm(alarm);
    }

    // Lưu lại danh sách alarms
    await this.saveAlarmsToStorage();
  }

  private async triggerAlarm(alarm: ScheduledAlarm): Promise<void> {
    try {
      console.log(`🔔 AlarmService: Kích hoạt alarm - ${alarm.title}`);

      // Phát âm thanh nếu được bật (với expo-audio)
      if (alarm.soundEnabled && this.sound) {
        try {
          await this.sound.replayAsync();
        } catch (soundError) {
          console.warn('⚠️ AlarmService: Lỗi phát âm thanh:', soundError);
        }
      }

      // Rung nếu được bật
      if (alarm.vibrationEnabled) {
        // Rung pattern: 500ms on, 200ms off, repeat 3 times
        Vibration.vibrate([500, 200, 500, 200, 500]);
      }

      // Hiển thị alert
      this.showAlarmAlert(alarm);

    } catch (error) {
      console.error('❌ AlarmService: Lỗi kích hoạt alarm:', error);
    }
  }

  private showAlarmAlert(alarm: ScheduledAlarm): void {
    const buttons = [
      {
        text: t(this.currentLanguage, 'common.ok'),
        onPress: () => {
          this.stopAlarmSound();
        }
      }
    ];

    // Thêm nút snooze cho note reminders
    if (alarm.type === 'note_reminder') {
      buttons.unshift({
        text: '⏰ Báo lại 5 phút',
        onPress: () => {
          this.snoozeAlarm(alarm, 5);
        }
      });
    }

    Alert.alert(
      `🔔 ${alarm.title}`,
      alarm.message,
      buttons,
      { 
        cancelable: false,
        onDismiss: () => this.stopAlarmSound()
      }
    );
  }

  private async stopAlarmSound(): Promise<void> {
    try {
      if (this.sound) {
        try {
          await this.sound.stopAsync();
        } catch (soundError) {
          console.warn('⚠️ AlarmService: Lỗi dừng âm thanh:', soundError);
        }
      }
      Vibration.cancel();
    } catch (error) {
      console.error('❌ AlarmService: Lỗi dừng âm thanh:', error);
    }
  }

  private async snoozeAlarm(alarm: ScheduledAlarm, minutes: number): Promise<void> {
    try {
      await this.stopAlarmSound();
      
      // Tạo alarm mới với thời gian snooze
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
      
      const snoozeAlarm: ScheduledAlarm = {
        ...alarm,
        id: `${alarm.id}_snooze_${Date.now()}`,
        scheduledTime: snoozeTime,
        title: `⏰ ${alarm.title} (Báo lại)`,
      };

      this.alarms.set(snoozeAlarm.id, snoozeAlarm);
      await this.saveAlarmsToStorage();
      
      console.log(`⏰ AlarmService: Đã snooze alarm ${minutes} phút`);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi snooze alarm:', error);
    }
  }

  // Public methods
  async scheduleShiftReminder(shift: Shift): Promise<void> {
    try {
      await this.initialize();
      
      const settings = await storageService.getUserSettings();
      this.currentLanguage = settings.language || 'vi';

      // Xóa các reminder cũ của shift này
      await this.cancelShiftReminders(shift.id);

      if (!settings.alarmSoundEnabled && !settings.alarmVibrationEnabled) {
        console.log('🔕 AlarmService: Cả âm thanh và rung đều bị tắt, bỏ qua lập lịch');
        return;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Lập lịch cho 7 ngày tới
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dayOfWeek = targetDate.getDay();

        // Kiểm tra shift có làm việc ngày này không
        if (!shift.workDays.includes(dayOfWeek)) {
          continue;
        }

        // Lập lịch nhắc nhở khởi hành (30 phút trước)
        const departureTime = this.parseTime(shift.departureTime);
        const departureDateTime = new Date(targetDate);
        departureDateTime.setHours(departureTime.hours, departureTime.minutes - 30, 0, 0);

        // Xử lý ca đêm
        if (shift.isNightShift && departureTime.hours >= 20) {
          departureDateTime.setDate(departureDateTime.getDate() - 1);
        }

        if (departureDateTime > now) {
          const alarmId = `departure_${shift.id}_${i}`;
          const alarm: ScheduledAlarm = {
            id: alarmId,
            title: t(this.currentLanguage, 'alarms.departureTitle'),
            message: t(this.currentLanguage, 'alarms.departureMessage')
              .replace('{time}', shift.departureTime)
              .replace('{shift}', shift.name),
            scheduledTime: departureDateTime,
            type: 'shift_reminder',
            relatedId: shift.id,
            isActive: true,
            soundEnabled: settings.alarmSoundEnabled,
            vibrationEnabled: settings.alarmVibrationEnabled,
          };

          this.alarms.set(alarmId, alarm);
        }

        // Lập lịch nhắc nhở chấm công vào
        const startTime = this.parseTime(shift.startTime);
        const startDateTime = new Date(targetDate);
        startDateTime.setHours(startTime.hours, startTime.minutes, 0, 0);

        if (shift.isNightShift && startTime.hours < 12) {
          startDateTime.setDate(startDateTime.getDate() + 1);
        }

        if (startDateTime > now) {
          const alarmId = `checkin_${shift.id}_${i}`;
          const alarm: ScheduledAlarm = {
            id: alarmId,
            title: t(this.currentLanguage, 'alarms.checkinTitle'),
            message: t(this.currentLanguage, 'alarms.checkinMessage')
              .replace('{shift}', shift.name),
            scheduledTime: startDateTime,
            type: 'shift_reminder',
            relatedId: shift.id,
            isActive: true,
            soundEnabled: settings.alarmSoundEnabled,
            vibrationEnabled: settings.alarmVibrationEnabled,
          };

          this.alarms.set(alarmId, alarm);
        }

        // Lập lịch nhắc nhở chấm công ra
        const endTime = this.parseTime(shift.officeEndTime);
        const endDateTime = new Date(targetDate);
        endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);

        if (shift.isNightShift && endTime.hours < 12) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        if (endDateTime > now) {
          const alarmId = `checkout_${shift.id}_${i}`;
          const alarm: ScheduledAlarm = {
            id: alarmId,
            title: t(this.currentLanguage, 'alarms.checkoutTitle'),
            message: t(this.currentLanguage, 'alarms.checkoutMessage')
              .replace('{shift}', shift.name),
            scheduledTime: endDateTime,
            type: 'shift_reminder',
            relatedId: shift.id,
            isActive: true,
            soundEnabled: settings.alarmSoundEnabled,
            vibrationEnabled: settings.alarmVibrationEnabled,
          };

          this.alarms.set(alarmId, alarm);
        }
      }

      await this.saveAlarmsToStorage();
      console.log(`✅ AlarmService: Đã lập lịch ${this.alarms.size} alarms cho ca ${shift.name}`);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi lập lịch shift reminders:', error);
      throw error;
    }
  }

  async scheduleNoteReminder(note: Note): Promise<void> {
    try {
      await this.initialize();

      const settings = await storageService.getUserSettings();
      this.currentLanguage = settings.language || 'vi';

      // Xóa reminder cũ nếu có
      await this.cancelNoteReminder(note.id);

      // Handle specific datetime reminders
      if (note.reminderDateTime) {
        const reminderTime = new Date(note.reminderDateTime);
        const now = new Date();

        if (reminderTime <= now) return;

        const alarmId = `note_${note.id}`;
        const alarm: ScheduledAlarm = {
          id: alarmId,
          title: `📝 ${note.title}`,
          message: note.content.length > 100
            ? note.content.substring(0, 100) + '...'
            : note.content,
          scheduledTime: reminderTime,
          type: 'note_reminder',
          relatedId: note.id,
          isActive: true,
          soundEnabled: settings.alarmSoundEnabled,
          vibrationEnabled: settings.alarmVibrationEnabled,
        };

        this.alarms.set(alarmId, alarm);
        await this.saveAlarmsToStorage();

        console.log(`✅ AlarmService: Đã lập lịch alarm cho note ${note.title}`);
        return;
      }

      // Handle shift-based reminders
      if (note.associatedShiftIds && note.associatedShiftIds.length > 0) {
        await this.scheduleShiftBasedNoteReminders(note);
      }
    } catch (error) {
      console.error('❌ AlarmService: Lỗi lập lịch note reminder:', error);
      throw error;
    }
  }

  /**
   * Lập lịch alarm cho note dựa trên shift (5 phút trước departure time)
   */
  private async scheduleShiftBasedNoteReminders(note: Note): Promise<void> {
    if (!note.associatedShiftIds || note.associatedShiftIds.length === 0) return;

    const { timeSyncService } = await import('./timeSync');
    const shifts = await storageService.getShifts();
    const settings = await storageService.getUserSettings();

    for (const shiftId of note.associatedShiftIds) {
      const shift = shifts.find(s => s.id === shiftId);
      if (!shift) continue;

      // Tính toán thời gian nhắc nhở cho 7 ngày tới
      const reminderTimes = timeSyncService.calculateShiftBasedReminderTimes(shift);

      // Lập lịch cho từng thời gian
      for (let i = 0; i < reminderTimes.length; i++) {
        const reminderTime = reminderTimes[i];
        const alarmId = `note_shift_${note.id}_${shiftId}_${i}`;

        const alarm: ScheduledAlarm = {
          id: alarmId,
          title: `📝 ${note.title}`,
          message: `${note.content.length > 80 ? note.content.substring(0, 80) + '...' : note.content} (Ca: ${shift.name})`,
          scheduledTime: reminderTime,
          type: 'note_reminder',
          relatedId: note.id,
          isActive: true,
          soundEnabled: settings.alarmSoundEnabled,
          vibrationEnabled: settings.alarmVibrationEnabled,
        };

        this.alarms.set(alarmId, alarm);
      }
    }

    await this.saveAlarmsToStorage();
    console.log(`✅ AlarmService: Đã lập lịch shift-based alarms cho note ${note.title}`);
  }

  async cancelShiftReminders(shiftId?: string): Promise<void> {
    try {
      const toDelete: string[] = [];
      
      for (const [id, alarm] of this.alarms) {
        if (alarm.type === 'shift_reminder') {
          if (!shiftId || alarm.relatedId === shiftId) {
            toDelete.push(id);
          }
        }
      }

      toDelete.forEach(id => this.alarms.delete(id));
      await this.saveAlarmsToStorage();
      
      console.log(`🗑️ AlarmService: Đã xóa ${toDelete.length} shift alarms`);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi xóa shift reminders:', error);
    }
  }

  async cancelNoteReminder(noteId: string): Promise<void> {
    try {
      // Cancel specific datetime reminder
      const alarmId = `note_${noteId}`;
      this.alarms.delete(alarmId);

      // Cancel all shift-based reminders for this note
      const toDelete: string[] = [];
      for (const [id, alarm] of this.alarms) {
        if (id.startsWith(`note_shift_${noteId}_`)) {
          toDelete.push(id);
        }
      }

      for (const id of toDelete) {
        this.alarms.delete(id);
      }

      await this.saveAlarmsToStorage();

      console.log(`🗑️ AlarmService: Đã xóa note alarm ${noteId} và ${toDelete.length} shift-based alarms`);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi xóa note reminder:', error);
    }
  }

  // Utility methods
  private parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  private async saveAlarmsToStorage(): Promise<void> {
    try {
      const alarmsArray = Array.from(this.alarms.values());
      // Sử dụng saveData method đã được thêm vào StorageService
      await storageService.saveData('scheduled_alarms', alarmsArray);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi lưu alarms:', error);
    }
  }

  private async loadAlarmsFromStorage(): Promise<void> {
    try {
      // Sử dụng getData method đã được thêm vào StorageService
      const alarmsArray = await storageService.getData('scheduled_alarms', []);
      this.alarms.clear();

      const now = new Date();
      let validAlarmsCount = 0;
      let expiredAlarmsCount = 0;

      for (const alarmData of alarmsArray) {
        const alarm: ScheduledAlarm = {
          ...alarmData,
          scheduledTime: new Date(alarmData.scheduledTime),
        };

        // Kiểm tra alarm có hợp lệ không (thời gian trong tương lai và không quá xa)
        const timeDiff = alarm.scheduledTime.getTime() - now.getTime();
        const maxFutureTime = 7 * 24 * 60 * 60 * 1000; // 7 ngày

        if (timeDiff > 0 && timeDiff <= maxFutureTime) {
          // Alarm hợp lệ - trong tương lai và không quá 7 ngày
          this.alarms.set(alarm.id, alarm);
          validAlarmsCount++;
        } else {
          // Alarm đã hết hạn hoặc quá xa - bỏ qua
          expiredAlarmsCount++;
        }
      }

      // Lưu lại danh sách đã được làm sạch
      if (expiredAlarmsCount > 0) {
        await this.saveAlarmsToStorage();
      }

      console.log(`📥 AlarmService: Đã load ${validAlarmsCount} alarms hợp lệ, bỏ qua ${expiredAlarmsCount} alarms hết hạn`);
    } catch (error) {
      console.error('❌ AlarmService: Lỗi load alarms:', error);
    }
  }

  async getAlarmStatus(): Promise<AlarmStatus> {
    await this.initialize();
    
    return {
      isSupported: true,
      hasAudioPermission: this.sound !== null,
      isBackgroundEnabled: this.checkInterval !== null,
      scheduledCount: this.alarms.size,
      message: `Hệ thống báo thức đang hoạt động với ${this.alarms.size} lịch nhắc nhở`,
    };
  }

  async testAlarm(): Promise<void> {
    try {
      await this.initialize();

      // Tạo test alarm với thời gian 5 giây sau để tránh trigger ngay lập tức
      const testTime = new Date();
      testTime.setSeconds(testTime.getSeconds() + 5);

      const testAlarm: ScheduledAlarm = {
        id: 'test_alarm',
        title: '🧪 Test Alarm',
        message: 'Hệ thống báo thức đang hoạt động bình thường!',
        scheduledTime: testTime,
        type: 'note_reminder',
        isActive: true,
        soundEnabled: true,
        vibrationEnabled: true,
      };

      // Thêm vào danh sách alarms để được schedule đúng cách
      this.alarms.set(testAlarm.id, testAlarm);
      await this.saveAlarmsToStorage();

      console.log('🧪 AlarmService: Test alarm đã được lên lịch sau 5 giây');
    } catch (error) {
      console.error('❌ AlarmService: Lỗi test alarm:', error);
      throw error;
    }
  }

  // Method để clear tất cả alarms cũ/không hợp lệ
  async clearExpiredAlarms(): Promise<void> {
    try {
      const now = new Date();
      let clearedCount = 0;

      for (const [id, alarm] of this.alarms) {
        if (alarm.scheduledTime <= now) {
          this.alarms.delete(id);
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        await this.saveAlarmsToStorage();
        console.log(`🧹 AlarmService: Đã xóa ${clearedCount} alarms hết hạn`);
      }
    } catch (error) {
      console.error('❌ AlarmService: Lỗi clear expired alarms:', error);
    }
  }

  // Method để reset hoàn toàn tất cả alarms (dùng khi debug)
  async clearAllAlarms(): Promise<void> {
    try {
      this.alarms.clear();
      await storageService.removeData('scheduled_alarms');
      console.log('🗑️ AlarmService: Đã xóa tất cả alarms');
    } catch (error) {
      console.error('❌ AlarmService: Lỗi clear all alarms:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.sound) {
      try {
        this.sound.unloadAsync();
      } catch (error) {
        console.warn('⚠️ AlarmService: Lỗi unload sound:', error);
      }
      this.sound = null;
    }

    AppState.removeEventListener('change', this.handleAppStateChange);
    this.isInitialized = false;

    console.log('🧹 AlarmService: Đã cleanup');
  }
}

export const alarmService = new AlarmService();
