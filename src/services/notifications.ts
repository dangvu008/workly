import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AlarmData, Shift, Note } from '../types';
import { NOTIFICATION_CATEGORIES } from '../constants';
import { storageService } from './storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Notification permission not granted');
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
      throw error;
    }
  }

  async scheduleShiftReminders(shift: Shift): Promise<void> {
    try {
      await this.initialize();
      
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

  async scheduleNoteReminder(note: Note): Promise<void> {
    try {
      await this.initialize();

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
}

export const notificationService = new NotificationService();
