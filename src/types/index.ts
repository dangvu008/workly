// Workly App Types
export interface UserSettings {
  language: string;
  theme: 'light' | 'dark';
  multiButtonMode: 'full' | 'simple';
  alarmSoundEnabled: boolean;
  alarmVibrationEnabled: boolean;
  weatherWarningEnabled: boolean;
  weatherLocation: WeatherLocation | null;
  changeShiftReminderMode: 'ask_weekly' | 'rotate' | 'disabled';
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 'Mon' | 'Sun';
  lateThresholdMinutes: number;
  overtimeRates: {
    weekday: number;
    saturday: number;
    sunday: number;
    holiday: number;
  };
  notesDisplayCount: 2 | 3 | 5;
  rotationConfig?: {
    shiftIds: string[];
    frequency: 'weekly' | 'biweekly' | 'monthly';
    lastAppliedDate?: string;
  };
}

export interface WeatherLocation {
  home: { lat: number; lon: number } | null;
  work: { lat: number; lon: number } | null;
  useSingleLocation: boolean;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  officeEndTime: string; // HH:MM format
  breakMinutes: number;
  showPunch: boolean;
  departureTime: string; // HH:MM format
  isNightShift: boolean;
  workDays: number[]; // 0-6 (Sunday-Saturday)
}

export interface AttendanceLog {
  type: 'go_work' | 'check_in' | 'punch' | 'check_out' | 'complete';
  time: string; // ISO 8601 timestamp
}

export interface DailyWorkStatus {
  status: 'completed' | 'late' | 'early' | 'absent' | 'manual_present' | 'manual_absent' | 'manual_holiday' | 'pending';
  vaoLogTime?: string; // ISO 8601 timestamp
  raLogTime?: string; // ISO 8601 timestamp
  standardHoursScheduled: number;
  otHoursScheduled: number;
  sundayHoursScheduled: number;
  nightHoursScheduled: number;
  totalHoursScheduled: number;
  lateMinutes: number;
  earlyMinutes: number;
  isHolidayWork: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isPriority: boolean;
  reminderDateTime?: string; // ISO 8601 timestamp
  associatedShiftIds?: string[];
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface WeatherData {
  current: {
    temperature: number;
    description: string;
    icon: string;
    location: string;
  };
  forecast: Array<{
    time: string;
    temperature: number;
    description: string;
    icon: string;
  }>;
  warnings?: Array<{
    type: 'rain' | 'heat' | 'cold' | 'storm' | 'snow';
    message: string;
    location: 'home' | 'work';
    time: string;
  }>;
  lastUpdated: string;
}

export interface PublicHoliday {
  date: string; // YYYY-MM-DD format
  name: string;
  type: 'national' | 'regional';
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  ShiftManagement: { mode?: 'select_rotation' };
  AddEditShift: { shiftId?: string; applyImmediately?: boolean };
  Notes: undefined;
  NoteDetail: { noteId?: string };
  Statistics: undefined;
  WeatherDetail: undefined;
};

// Multi-function button states
export type ButtonState = 
  | 'go_work'
  | 'waiting_checkin'
  | 'check_in'
  | 'working'
  | 'check_out'
  | 'ready_complete'
  | 'complete'
  | 'completed';

// Weekly status icons
export type WeeklyStatusIcon = 
  | '✅' // completed
  | '❗' // late
  | '⏰' // early
  | '❌' // absent
  | '📩' // manual_present
  | '🛌' // manual_absent
  | '🎌' // manual_holiday
  | '❓' // pending/future
  | 'RV'; // review needed

export interface AlarmData {
  id: string;
  title: string;
  message: string;
  scheduledTime: string; // ISO 8601 timestamp
  type: 'shift_reminder' | 'note_reminder';
  relatedId?: string; // shift ID or note ID
}
