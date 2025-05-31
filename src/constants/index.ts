// Storage keys
export const STORAGE_KEYS = {
  USER_SETTINGS: 'userSettings',
  SHIFT_LIST: 'shiftList',
  ACTIVE_SHIFT_ID: 'activeShiftId',
  ATTENDANCE_LOGS: 'attendanceLogs',
  DAILY_WORK_STATUS: 'dailyWorkStatus',
  NOTES: 'notes',
  LAST_AUTO_RESET_TIME: 'lastAutoResetTime',
  PUBLIC_HOLIDAYS: 'publicHolidays',
  WEATHER_CACHE: 'weatherCache',
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  language: 'vi',
  theme: 'light' as const,
  multiButtonMode: 'full' as const,
  alarmSoundEnabled: true,
  alarmVibrationEnabled: true,
  weatherWarningEnabled: true,
  weatherLocation: null,
  changeShiftReminderMode: 'ask_weekly' as const,
  timeFormat: '24h' as const,
  firstDayOfWeek: 'Mon' as const,
  lateThresholdMinutes: 5,
  rapidPressThresholdSeconds: 60, // Ngưỡng phát hiện "Bấm Nhanh" - mặc định 60 giây
  overtimeRates: {
    weekday: 150,
    saturday: 200,
    sunday: 300,
    holiday: 300,
  },
  notesDisplayCount: 3 as const,
  notesTimeWindow: 'always' as const,
  notesShowConflictWarning: true,
};

// Time constants
export const TIME_CONSTANTS = {
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  MILLISECONDS_PER_MINUTE: 60 * 1000,
  MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
} as const;

// Button states and their display info - Icons đồng bộ với ứng dụng
export const BUTTON_STATES = {
  go_work: {
    text: 'ĐI LÀM',
    icon: '🏃‍♂️',
    color: '#4CAF50',
  },
  awaiting_check_in: {
    text: 'CHỜ CHECK-IN',
    icon: '⏰',
    color: '#FF9800',
  },
  check_in: {
    text: 'CHẤM CÔNG VÀO',
    icon: '📥',
    color: '#2196F3',
  },
  working: {
    text: 'ĐANG LÀM VIỆC',
    icon: '💼',
    color: '#9C27B0',
  },
  awaiting_check_out: {
    text: 'CHỜ CHECK-OUT',
    icon: '⏰',
    color: '#FF9800',
  },
  check_out: {
    text: 'CHẤM CÔNG RA',
    icon: '📤',
    color: '#FF5722',
  },
  awaiting_complete: {
    text: 'CHỜ HOÀN TẤT',
    icon: '⏳',
    color: '#795548',
  },
  complete: {
    text: 'HOÀN TẤT',
    icon: '✅',
    color: '#4CAF50',
  },
  completed_day: {
    text: 'ĐÃ HOÀN TẤT',
    icon: '🎯',
    color: '#9E9E9E',
  },
} as const;

// Weekly status icons and colors
export const WEEKLY_STATUS = {
  completed: {
    icon: '✅',
    color: '#4CAF50',
    text: 'Hoàn thành',
  },
  late: {
    icon: '❗',
    color: '#FF9800',
    text: 'Đi muộn',
  },
  early: {
    icon: '⏰',
    color: '#2196F3',
    text: 'Về sớm',
  },
  absent: {
    icon: '❌',
    color: '#F44336',
    text: 'Vắng mặt',
  },
  manual_present: {
    icon: '📩',
    color: '#9C27B0',
    text: 'Có mặt (thủ công)',
  },
  manual_absent: {
    icon: '🛌',
    color: '#607D8B',
    text: 'Nghỉ (thủ công)',
  },
  manual_holiday: {
    icon: '🎌',
    color: '#E91E63',
    text: 'Nghỉ lễ (thủ công)',
  },
  manual_completed: {
    icon: '✅',
    color: '#4CAF50',
    text: 'Hoàn thành (thủ công)',
  },
  manual_review: {
    icon: 'RV',
    color: '#FF5722',
    text: 'Cần xem lại (thủ công)',
  },
  pending: {
    icon: '❓',
    color: '#9E9E9E',
    text: 'Chưa xác định',
  },
  review: {
    icon: 'RV',
    color: '#FF5722',
    text: 'Cần xem lại',
  },
  // Các trạng thái nghỉ mới theo yêu cầu
  NGHI_PHEP: {
    icon: '🏖️',
    color: '#00BCD4',
    text: 'Nghỉ Phép',
  },
  NGHI_BENH: {
    icon: '🏥',
    color: '#FF9800',
    text: 'Nghỉ Bệnh',
  },
  NGHI_LE: {
    icon: '🎌',
    color: '#E91E63',
    text: 'Nghỉ Lễ',
  },
  VANG_MAT: {
    icon: '❌',
    color: '#F44336',
    text: 'Vắng Mặt',
  },
  CONG_TAC: {
    icon: '✈️',
    color: '#673AB7',
    text: 'Công Tác',
  },
  DU_CONG: {
    icon: '✅',
    color: '#4CAF50',
    text: 'Đủ Công',
  },
  RV: {
    icon: 'RV',
    color: '#FF5722',
    text: 'Cần Xem Lại',
  },
  // Các trạng thái từ DailyWorkStatusNew
  DI_MUON: {
    icon: '⏰',
    color: '#FF9800',
    text: 'Đi Muộn',
  },
  VE_SOM: {
    icon: '🏃‍♂️',
    color: '#2196F3',
    text: 'Về Sớm',
  },
  DI_MUON_VE_SOM: {
    icon: '⚠️',
    color: '#FF5722',
    text: 'Đi Muộn & Về Sớm',
  },
  CHUA_DI: {
    icon: '🏠',
    color: '#9E9E9E',
    text: 'Chưa Đi',
  },
  DA_DI_CHUA_VAO: {
    icon: '🚶‍♂️',
    color: '#FFC107',
    text: 'Đã Đi Chưa Vào',
  },
  CHUA_RA: {
    icon: '💼',
    color: '#9C27B0',
    text: 'Chưa Ra',
  },
} as const;

// Weather warning types
export const WEATHER_WARNINGS = {
  rain: {
    icon: '🌧️',
    color: '#2196F3',
    threshold: 0.5, // mm/h
  },
  heat: {
    icon: '🌡️',
    color: '#FF5722',
    threshold: 35, // °C
  },
  cold: {
    icon: '❄️',
    color: '#00BCD4',
    threshold: 10, // °C
  },
  storm: {
    icon: '⛈️',
    color: '#9C27B0',
    threshold: 50, // km/h wind speed
  },
  snow: {
    icon: '🌨️',
    color: '#607D8B',
    threshold: 0.1, // mm/h
  },
} as const;

// Languages
export const LANGUAGES = {
  vi: 'Tiếng Việt',
  en: 'English',
} as const;

// Days of week
export const DAYS_OF_WEEK = {
  vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
} as const;

// Months
export const MONTHS = {
  vi: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],
  en: [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ],
} as const;

// API endpoints (for weather and holidays)
export const API_ENDPOINTS = {
  WEATHER: 'https://api.openweathermap.org/data/2.5',
  HOLIDAYS: 'https://date.nager.at/api/v3',
} as const;

// Notification categories
export const NOTIFICATION_CATEGORIES = {
  SHIFT_REMINDER: 'shift_reminder',
  NOTE_REMINDER: 'note_reminder',
  WEATHER_WARNING: 'weather_warning',
  SHIFT_ROTATION: 'shift_rotation',
} as const;

// Default shifts (for initial setup)
export const DEFAULT_SHIFTS = [
  {
    id: 'shift_morning',
    name: 'Ca Sáng',
    startTime: '08:00',
    endTime: '17:00',
    officeEndTime: '17:00',
    breakMinutes: 60,
    showPunch: false,
    departureTime: '07:30',
    isNightShift: false,
    workDays: [1, 2, 3, 4, 5], // Monday to Friday
  },
  {
    id: 'shift_afternoon',
    name: 'Ca Chiều',
    startTime: '14:00',
    endTime: '22:00',
    officeEndTime: '22:00',
    breakMinutes: 30,
    showPunch: false,
    departureTime: '13:30',
    isNightShift: false,
    workDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'shift_night',
    name: 'Ca Đêm',
    startTime: '22:00',
    endTime: '06:00',
    officeEndTime: '06:00',
    breakMinutes: 30,
    showPunch: false,
    departureTime: '21:30',
    isNightShift: true,
    workDays: [1, 2, 3, 4, 5],
  },
];

// Vietnamese public holidays (sample)
export const DEFAULT_HOLIDAYS = [
  { date: '2025-01-01', name: 'Tết Dương lịch', type: 'national' },
  { date: '2025-01-28', name: 'Tết Nguyên đán (29 Tết)', type: 'national' },
  { date: '2025-01-29', name: 'Tết Nguyên đán (30 Tết)', type: 'national' },
  { date: '2025-01-30', name: 'Tết Nguyên đán (Mùng 1)', type: 'national' },
  { date: '2025-01-31', name: 'Tết Nguyên đán (Mùng 2)', type: 'national' },
  { date: '2025-02-01', name: 'Tết Nguyên đán (Mùng 3)', type: 'national' },
  { date: '2025-04-30', name: 'Ngày Giải phóng miền Nam', type: 'national' },
  { date: '2025-05-01', name: 'Ngày Quốc tế Lao động', type: 'national' },
  { date: '2025-09-02', name: 'Ngày Quốc khánh', type: 'national' },
] as const;
