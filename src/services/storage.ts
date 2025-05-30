import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  UserSettings, 
  Shift, 
  AttendanceLog, 
  DailyWorkStatus, 
  Note, 
  PublicHoliday,
  WeatherData 
} from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_SHIFTS, DEFAULT_HOLIDAYS } from '../constants';

class StorageService {
  // Generic storage methods
  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }

  private async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return defaultValue;
    }
  }

  private async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  // User Settings
  async getUserSettings(): Promise<UserSettings> {
    return this.getItem(STORAGE_KEYS.USER_SETTINGS, DEFAULT_SETTINGS);
  }

  async setUserSettings(settings: UserSettings): Promise<void> {
    return this.setItem(STORAGE_KEYS.USER_SETTINGS, settings);
  }

  async updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const currentSettings = await this.getUserSettings();
    const newSettings = { ...currentSettings, ...updates };
    await this.setUserSettings(newSettings);
    return newSettings;
  }

  // Shifts
  async getShiftList(): Promise<Shift[]> {
    return this.getItem(STORAGE_KEYS.SHIFT_LIST, DEFAULT_SHIFTS);
  }

  async setShiftList(shifts: Shift[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.SHIFT_LIST, shifts);
  }

  async addShift(shift: Shift): Promise<void> {
    const shifts = await this.getShiftList();
    shifts.push(shift);
    return this.setShiftList(shifts);
  }

  async updateShift(shiftId: string, updates: Partial<Shift>): Promise<void> {
    const shifts = await this.getShiftList();
    const index = shifts.findIndex(s => s.id === shiftId);
    if (index !== -1) {
      shifts[index] = { ...shifts[index], ...updates };
      return this.setShiftList(shifts);
    }
    throw new Error(`Shift with id ${shiftId} not found`);
  }

  async deleteShift(shiftId: string): Promise<void> {
    const shifts = await this.getShiftList();
    const filteredShifts = shifts.filter(s => s.id !== shiftId);
    return this.setShiftList(filteredShifts);
  }

  // Active Shift
  async getActiveShiftId(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.ACTIVE_SHIFT_ID, null);
  }

  async setActiveShiftId(shiftId: string | null): Promise<void> {
    return this.setItem(STORAGE_KEYS.ACTIVE_SHIFT_ID, shiftId);
  }

  async getActiveShift(): Promise<Shift | null> {
    const activeShiftId = await this.getActiveShiftId();
    if (!activeShiftId) return null;
    
    const shifts = await this.getShiftList();
    return shifts.find(s => s.id === activeShiftId) || null;
  }

  // Attendance Logs
  async getAttendanceLogs(): Promise<Record<string, AttendanceLog[]>> {
    return this.getItem(STORAGE_KEYS.ATTENDANCE_LOGS, {});
  }

  async setAttendanceLogs(logs: Record<string, AttendanceLog[]>): Promise<void> {
    return this.setItem(STORAGE_KEYS.ATTENDANCE_LOGS, logs);
  }

  async getAttendanceLogsForDate(date: string): Promise<AttendanceLog[]> {
    const allLogs = await this.getAttendanceLogs();
    return allLogs[date] || [];
  }

  async addAttendanceLog(date: string, log: AttendanceLog): Promise<void> {
    const allLogs = await this.getAttendanceLogs();
    if (!allLogs[date]) {
      allLogs[date] = [];
    }
    allLogs[date].push(log);
    return this.setAttendanceLogs(allLogs);
  }

  async clearAttendanceLogsForDate(date: string): Promise<void> {
    const allLogs = await this.getAttendanceLogs();
    delete allLogs[date];
    return this.setAttendanceLogs(allLogs);
  }

  // Daily Work Status
  async getDailyWorkStatus(): Promise<Record<string, DailyWorkStatus>> {
    return this.getItem(STORAGE_KEYS.DAILY_WORK_STATUS, {});
  }

  async setDailyWorkStatus(status: Record<string, DailyWorkStatus>): Promise<void> {
    return this.setItem(STORAGE_KEYS.DAILY_WORK_STATUS, status);
  }

  async getDailyWorkStatusForDate(date: string): Promise<DailyWorkStatus | null> {
    const allStatus = await this.getDailyWorkStatus();
    return allStatus[date] || null;
  }

  async setDailyWorkStatusForDate(date: string, status: DailyWorkStatus): Promise<void> {
    const allStatus = await this.getDailyWorkStatus();
    allStatus[date] = status;
    return this.setDailyWorkStatus(allStatus);
  }

  // Notes
  async getNotes(): Promise<Note[]> {
    return this.getItem(STORAGE_KEYS.NOTES, []);
  }

  async setNotes(notes: Note[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.NOTES, notes);
  }

  async addNote(note: Note): Promise<void> {
    const notes = await this.getNotes();
    notes.push(note);
    return this.setNotes(notes);
  }

  async updateNote(noteId: string, updates: Partial<Note>): Promise<void> {
    const notes = await this.getNotes();
    const index = notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...updates, updatedAt: new Date().toISOString() };
      return this.setNotes(notes);
    }
    throw new Error(`Note with id ${noteId} not found`);
  }

  async deleteNote(noteId: string): Promise<void> {
    const notes = await this.getNotes();
    const filteredNotes = notes.filter(n => n.id !== noteId);
    return this.setNotes(filteredNotes);
  }

  // Public Holidays
  async getPublicHolidays(): Promise<PublicHoliday[]> {
    return this.getItem(STORAGE_KEYS.PUBLIC_HOLIDAYS, DEFAULT_HOLIDAYS);
  }

  async setPublicHolidays(holidays: PublicHoliday[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.PUBLIC_HOLIDAYS, holidays);
  }

  // Weather Cache
  async getWeatherCache(): Promise<WeatherData | null> {
    return this.getItem(STORAGE_KEYS.WEATHER_CACHE, null);
  }

  async setWeatherCache(weather: WeatherData): Promise<void> {
    return this.setItem(STORAGE_KEYS.WEATHER_CACHE, weather);
  }

  // Last Auto Reset Time
  async getLastAutoResetTime(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.LAST_AUTO_RESET_TIME, null);
  }

  async setLastAutoResetTime(time: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.LAST_AUTO_RESET_TIME, time);
  }

  // Backup and Restore
  async exportData(): Promise<string> {
    try {
      const data = {
        userSettings: await this.getUserSettings(),
        shiftList: await this.getShiftList(),
        activeShiftId: await this.getActiveShiftId(),
        attendanceLogs: await this.getAttendanceLogs(),
        dailyWorkStatus: await this.getDailyWorkStatus(),
        notes: await this.getNotes(),
        publicHolidays: await this.getPublicHolidays(),
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!data.version || !data.exportDate) {
        throw new Error('Invalid backup file format');
      }

      // Import data
      if (data.userSettings) await this.setUserSettings(data.userSettings);
      if (data.shiftList) await this.setShiftList(data.shiftList);
      if (data.activeShiftId !== undefined) await this.setActiveShiftId(data.activeShiftId);
      if (data.attendanceLogs) await this.setAttendanceLogs(data.attendanceLogs);
      if (data.dailyWorkStatus) await this.setDailyWorkStatus(data.dailyWorkStatus);
      if (data.notes) await this.setNotes(data.notes);
      if (data.publicHolidays) await this.setPublicHolidays(data.publicHolidays);
      
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
