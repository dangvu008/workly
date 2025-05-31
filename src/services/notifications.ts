import { Platform } from 'react-native';
import { AlarmData, Shift, Note } from '../types';
import { NOTIFICATION_CATEGORIES } from '../constants';
import { storageService } from './storage';

// Import notifications directly for Expo SDK 53+
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isRunningInExpoGo = () => {
  return Constants.executionEnvironment === 'storeClient';
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private isInitialized = false;
  private isAvailable = true; // Assume available since we're importing directly

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if running in Expo Go and warn about limitations
      if (isRunningInExpoGo() && Platform.OS === 'android') {
        console.warn(
          '⚠️ Workly: Push notifications có thể không hoạt động đầy đủ trong Expo Go. ' +
          'Để có trải nghiệm tốt nhất, hãy sử dụng development build hoặc build production.'
        );
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Workly: Notification permission not granted. Nhắc nhở sẽ không hoạt động.');
      }

      // Configure notification categories for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('shift_reminders', {
          name: 'Nhắc nhở ca làm việc',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync('note_reminders', {
          name: 'Nhắc nhở ghi chú',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync('weather_warnings', {
          name: 'Cảnh báo thời tiết',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync('shift_rotation', {
          name: 'Xoay ca làm việc',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      this.isAvailable = false;
      console.warn('⚠️ Workly: Notifications không khả dụng. Một số tính năng sẽ bị hạn chế.');
    }
  }

  async scheduleShiftReminders(shift: Shift): Promise<void> {
    try {
      await this.initialize();

      if (!this.isAvailable) {
        console.log('📱 Workly: Notifications không khả dụng, bỏ qua lập lịch nhắc nhở ca làm việc');
        return;
      }

      // Cancel existing shift reminders
      await this.cancelShiftReminders();

      const settings = await storageService.getUserSettings();
      if (!settings.alarmSoundEnabled && !settings.alarmVibrationEnabled) {
        return; // Don't schedule if both sound and vibration are disabled
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Schedule reminders for the next 7 days
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dayOfWeek = targetDate.getDay();

        // Check if this shift works on this day
        if (!shift.workDays.includes(dayOfWeek)) {
          continue;
        }

        // Schedule departure reminder (30 minutes before departure time)
        const departureTime = this.parseTime(shift.departureTime);
        const departureDateTime = new Date(targetDate);
        departureDateTime.setHours(departureTime.hours, departureTime.minutes - 30, 0, 0);

        // Handle night shift (departure time might be on previous day)
        if (shift.isNightShift && departureTime.hours >= 20) {
          departureDateTime.setDate(departureDateTime.getDate() - 1);
        }

        if (departureDateTime > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `departure_${shift.id}_${i}`,
            content: {
              title: '🚶‍♂️ Chuẩn bị đi làm',
              body: `Còn 30 phút nữa là giờ khởi hành (${shift.departureTime}) cho ca ${shift.name}`,
              categoryIdentifier: NOTIFICATION_CATEGORIES.SHIFT_REMINDER,
              data: {
                type: 'departure',
                shiftId: shift.id,
                shiftName: shift.name,
              },
            },
            trigger: {
              date: departureDateTime,
            },
          });
        }

        // Schedule check-in reminder
        const startTime = this.parseTime(shift.startTime);
        const startDateTime = new Date(targetDate);
        startDateTime.setHours(startTime.hours, startTime.minutes, 0, 0);

        // Handle night shift
        if (shift.isNightShift && startTime.hours < 12) {
          startDateTime.setDate(startDateTime.getDate() + 1);
        }

        if (startDateTime > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `checkin_${shift.id}_${i}`,
            content: {
              title: '📥 Giờ chấm công vào',
              body: `Đã đến giờ chấm công vào cho ca ${shift.name}`,
              categoryIdentifier: NOTIFICATION_CATEGORIES.SHIFT_REMINDER,
              data: {
                type: 'checkin',
                shiftId: shift.id,
                shiftName: shift.name,
              },
            },
            trigger: {
              date: startDateTime,
            },
          });
        }

        // Schedule check-out reminder
        const endTime = this.parseTime(shift.officeEndTime);
        const endDateTime = new Date(targetDate);
        endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0);

        // Handle night shift
        if (shift.isNightShift && endTime.hours < 12) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        if (endDateTime > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `checkout_${shift.id}_${i}`,
            content: {
              title: '📤 Giờ chấm công ra',
              body: `Đã đến giờ chấm công ra cho ca ${shift.name}`,
              categoryIdentifier: NOTIFICATION_CATEGORIES.SHIFT_REMINDER,
              data: {
                type: 'checkout',
                shiftId: shift.id,
                shiftName: shift.name,
              },
            },
            trigger: {
              date: endDateTime,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling shift reminders:', error);
      throw error;
    }
  }

  async cancelShiftReminders(): Promise<void> {
    try {
      if (!this.isAvailable) return;

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const shiftNotifications = scheduledNotifications.filter(
        notification =>
          notification.identifier.startsWith('departure_') ||
          notification.identifier.startsWith('checkin_') ||
          notification.identifier.startsWith('checkout_')
      );

      for (const notification of shiftNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Error canceling shift reminders:', error);
    }
  }

  // Hủy notification cụ thể theo loại và shift ID
  async cancelSpecificReminder(type: 'departure' | 'checkin' | 'checkout', shiftId: string): Promise<void> {
    try {
      if (!this.isAvailable) return;

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const specificNotifications = scheduledNotifications.filter(
        notification => notification.identifier.startsWith(`${type}_${shiftId}_`)
      );

      for (const notification of specificNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log(`🔕 Đã hủy nhắc nhở ${type} cho ca ${shiftId}`);
      }
    } catch (error) {
      console.error(`Error canceling ${type} reminders:`, error);
    }
  }

  async scheduleNoteReminder(note: Note): Promise<void> {
    try {
      await this.initialize();

      if (!this.isAvailable) {
        console.log('📱 Workly: Notifications không khả dụng, bỏ qua lập lịch nhắc nhở ghi chú');
        return;
      }

      if (!note.reminderDateTime) return;

      const reminderTime = new Date(note.reminderDateTime);
      const now = new Date();

      if (reminderTime <= now) return;

      await Notifications.scheduleNotificationAsync({
        identifier: `note_${note.id}`,
        content: {
          title: `📝 ${note.title}`,
          body: note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content,
          categoryIdentifier: NOTIFICATION_CATEGORIES.NOTE_REMINDER,
          data: {
            type: 'note',
            noteId: note.id,
            noteTitle: note.title,
          },
        },
        trigger: {
          date: reminderTime,
        },
      });
    } catch (error) {
      console.error('Error scheduling note reminder:', error);
      throw error;
    }
  }

  async cancelNoteReminder(noteId: string): Promise<void> {
    try {
      if (!this.isAvailable) return;
      await Notifications.cancelScheduledNotificationAsync(`note_${noteId}`);
    } catch (error) {
      console.error('Error canceling note reminder:', error);
    }
  }

  async scheduleWeatherWarning(message: string, location: string): Promise<void> {
    try {
      await this.initialize();

      await Notifications.scheduleNotificationAsync({
        identifier: `weather_${Date.now()}`,
        content: {
          title: '🌤️ Cảnh báo thời tiết',
          body: message,
          categoryIdentifier: NOTIFICATION_CATEGORIES.WEATHER_WARNING,
          data: {
            type: 'weather',
            location,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling weather warning:', error);
    }
  }

  async scheduleShiftRotationNotification(oldShiftName: string, newShiftName: string): Promise<void> {
    try {
      await this.initialize();

      await Notifications.scheduleNotificationAsync({
        identifier: `rotation_${Date.now()}`,
        content: {
          title: '🔄 Ca làm việc đã được thay đổi',
          body: `Ca làm việc đã chuyển từ "${oldShiftName}" sang "${newShiftName}"`,
          categoryIdentifier: NOTIFICATION_CATEGORIES.SHIFT_ROTATION,
          data: {
            type: 'rotation',
            oldShift: oldShiftName,
            newShift: newShiftName,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling shift rotation notification:', error);
    }
  }

  async scheduleWeeklyShiftReminder(reminderDate: Date): Promise<void> {
    try {
      await this.initialize();

      // Cancel existing weekly reminders
      await this.cancelWeeklyReminders();

      await Notifications.scheduleNotificationAsync({
        identifier: `weekly_reminder_${Date.now()}`,
        content: {
          title: '📅 Kết thúc tuần làm việc',
          body: 'Đã kết thúc tuần làm việc. Bạn có muốn kiểm tra và thay đổi ca cho tuần tới không?',
          categoryIdentifier: NOTIFICATION_CATEGORIES.SHIFT_REMINDER,
          data: {
            type: 'weekly_reminder',
            action: 'check_shifts',
          },
        },
        trigger: {
          date: reminderDate,
        },
      });
    } catch (error) {
      console.error('Error scheduling weekly shift reminder:', error);
    }
  }

  async cancelWeeklyReminders(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const weeklyReminders = scheduledNotifications.filter(
        notification => notification.identifier.startsWith('weekly_reminder_')
      );

      for (const notification of weeklyReminders) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Error canceling weekly reminders:', error);
    }
  }

  async showAlarmNotification(alarmData: AlarmData): Promise<void> {
    try {
      await this.initialize();

      await Notifications.scheduleNotificationAsync({
        identifier: `alarm_${alarmData.id}`,
        content: {
          title: alarmData.title,
          body: alarmData.message,
          categoryIdentifier: alarmData.type === 'shift_reminder'
            ? NOTIFICATION_CATEGORIES.SHIFT_REMINDER
            : NOTIFICATION_CATEGORIES.NOTE_REMINDER,
          data: {
            type: 'alarm',
            alarmId: alarmData.id,
            relatedId: alarmData.relatedId,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing alarm notification:', error);
    }
  }

  private parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Add notification response listener
  addNotificationResponseListener(listener: (response: Notifications.NotificationResponse) => void): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Add notification received listener
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Check if notifications are fully supported
  async checkNotificationSupport(): Promise<{
    isSupported: boolean;
    isExpoGo: boolean;
    hasPermission: boolean;
    platform: string;
    message: string;
  }> {
    await this.initialize();

    if (!this.isAvailable) {
      return {
        isSupported: false,
        isExpoGo: false,
        hasPermission: false,
        platform: Platform.OS,
        message: 'Notifications không khả dụng trong môi trường này.'
      };
    }

    const isExpoGoRunning = isRunningInExpoGo();
    const platform = Platform.OS;
    const { status } = await Notifications.getPermissionsAsync();
    const hasPermission = status === 'granted';

    let isSupported = true;
    let message = 'Notifications được hỗ trợ đầy đủ';

    if (isExpoGoRunning && platform === 'android') {
      isSupported = false;
      message = 'Push notifications không được hỗ trợ trong Expo Go trên Android. Sử dụng development build để có đầy đủ tính năng.';
    } else if (isExpoGoRunning) {
      message = 'Một số tính năng notification có thể bị hạn chế trong Expo Go.';
    } else if (!hasPermission) {
      isSupported = false;
      message = 'Cần cấp quyền notification để sử dụng tính năng nhắc nhở.';
    }

    return {
      isSupported,
      isExpoGo: isExpoGoRunning,
      hasPermission,
      platform,
      message
    };
  }

  // Test notification functionality
  async testNotification(): Promise<void> {
    try {
      await this.initialize();

      await Notifications.scheduleNotificationAsync({
        identifier: 'test_notification',
        content: {
          title: '🧪 Test Notification',
          body: 'Workly notifications đang hoạt động bình thường!',
          data: { type: 'test' },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error testing notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
