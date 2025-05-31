/**
 * Test cases cho logic "Bấm Nhanh" (Rapid Press) với Confirmation Dialog
 * Kiểm tra việc phát hiện và yêu cầu xác nhận từ người dùng khi bấm liên tục các nút trong chế độ Full
 */

import { workManager } from '../services/workManager';
import { storageService } from '../services/storage';
import { AttendanceLog, Shift, UserSettings, RapidPressDetectedException } from '../types';
import { parseISO, format } from 'date-fns';

// Mock data
const mockShift: Shift = {
  id: 'test_shift',
  name: 'Ca Test',
  startTime: '08:00',
  endTime: '17:00',
  officeEndTime: '17:00',
  breakMinutes: 60,
  showPunch: false,
  departureTime: '07:30',
  isNightShift: false,
  workDays: [1, 2, 3, 4, 5],
};

const mockSettings: UserSettings = {
  language: 'vi',
  theme: 'light',
  multiButtonMode: 'full',
  alarmSoundEnabled: true,
  alarmVibrationEnabled: true,
  weatherWarningEnabled: true,
  weatherLocation: null,
  changeShiftReminderMode: 'ask_weekly',
  timeFormat: '24h',
  firstDayOfWeek: 'Mon',
  lateThresholdMinutes: 15,
  rapidPressThresholdSeconds: 60, // 60 giây threshold
  overtimeRates: {
    weekday: 150,
    saturday: 200,
    sunday: 300,
    holiday: 300,
  },
  notesDisplayCount: 3,
  notesTimeWindow: 'always',
  notesShowConflictWarning: true,
};

describe('Logic Bấm Nhanh (Rapid Press) với Confirmation', () => {
  beforeEach(() => {
    // Mock storage service
    jest.spyOn(storageService, 'getUserSettings').mockResolvedValue(mockSettings);
    jest.spyOn(storageService, 'getPublicHolidays').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Throw RapidPressDetectedException khi check-in và check-out trong vòng 30 giây', async () => {
    const testDate = '2025-01-15';
    const baseTime = parseISO(`${testDate}T08:00:00.000Z`);

    // Tạo logs với khoảng cách 30 giây
    const logs: AttendanceLog[] = [
      {
        type: 'go_work',
        time: baseTime.toISOString(),
      },
      {
        type: 'check_in',
        time: baseTime.toISOString(),
      },
      {
        type: 'check_out',
        time: new Date(baseTime.getTime() + 30 * 1000).toISOString(), // +30 giây
      },
    ];

    // Expect exception to be thrown
    await expect(
      workManager.calculateDailyWorkStatusNew(testDate, logs, mockShift)
    ).rejects.toThrow(RapidPressDetectedException);

    try {
      await workManager.calculateDailyWorkStatusNew(testDate, logs, mockShift);
    } catch (error) {
      expect(error).toBeInstanceOf(RapidPressDetectedException);
      expect((error as RapidPressDetectedException).actualDurationSeconds).toBe(30);
      expect((error as RapidPressDetectedException).thresholdSeconds).toBe(60);
    }
  });

  test('Xử lý xác nhận "Bấm Nhanh" - tính đủ công theo lịch trình', async () => {
    const testDate = '2025-01-15';
    const baseTime = parseISO(`${testDate}T08:00:00.000Z`);
    const checkOutTime = new Date(baseTime.getTime() + 45 * 1000).toISOString();

    // Tạo logs với khoảng cách 45 giây
    const logs: AttendanceLog[] = [
      {
        type: 'check_in',
        time: baseTime.toISOString(),
      },
      {
        type: 'check_out',
        time: checkOutTime,
      },
    ];

    // Test method xử lý confirmation
    const result = await workManager.calculateDailyWorkStatusWithRapidPressConfirmed(
      testDate,
      logs,
      mockShift,
      baseTime.toISOString(),
      checkOutTime
    );

    expect(result.status).toBe('DU_CONG');
    expect(result.standardHours).toBe(8); // 8 giờ theo lịch trình ca (9h - 1h break)
    expect(result.otHours).toBe(0);
    expect(result.totalHours).toBe(8);
    expect(result.vaoLogTime).toBe(baseTime.toISOString());
    expect(result.raLogTime).toBe(checkOutTime);
    expect(result.notes).toBe('Xác nhận bấm nhanh - Tính theo lịch trình ca');
  });

  test('KHÔNG phát hiện "Bấm Nhanh" khi check-in và check-out cách nhau 90 giây', async () => {
    const testDate = '2025-01-15';
    const baseTime = parseISO(`${testDate}T08:00:00.000Z`);

    // Tạo logs với khoảng cách 90 giây (vượt threshold 60s)
    const logs: AttendanceLog[] = [
      {
        type: 'check_in',
        time: baseTime.toISOString(),
      },
      {
        type: 'check_out',
        time: new Date(baseTime.getTime() + 90 * 1000).toISOString(), // +90 giây
      },
    ];

    const result = await workManager.calculateDailyWorkStatusNew(testDate, logs, mockShift);

    // Sẽ áp dụng logic bình thường, không phải "Bấm Nhanh"
    expect(result.status).toBe('DU_CONG'); // Vẫn đủ công vì không muộn/sớm
    // Nhưng giờ công sẽ được tính theo thời gian thực tế (rất ít)
    expect(result.totalHours).toBeLessThan(1); // Chỉ làm 90 giây = 0.025 giờ
  });

  test('Cấu hình threshold tùy chỉnh - 120 giây', async () => {
    // Mock settings với threshold 120 giây
    const customSettings = { ...mockSettings, rapidPressThresholdSeconds: 120 };
    jest.spyOn(storageService, 'getUserSettings').mockResolvedValue(customSettings);

    const testDate = '2025-01-15';
    const baseTime = parseISO(`${testDate}T08:00:00.000Z`);

    // Tạo logs với khoảng cách 90 giây (dưới threshold 120s)
    const logs: AttendanceLog[] = [
      {
        type: 'check_in',
        time: baseTime.toISOString(),
      },
      {
        type: 'check_out',
        time: new Date(baseTime.getTime() + 90 * 1000).toISOString(), // +90 giây
      },
    ];

    const result = await workManager.calculateDailyWorkStatusNew(testDate, logs, mockShift);

    expect(result.status).toBe('DU_CONG');
    expect(result.standardHours).toBe(8); // Tính theo lịch trình ca
  });

  test('Trường hợp có complete log - không áp dụng logic "Bấm Nhanh"', async () => {
    const testDate = '2025-01-15';
    const baseTime = parseISO(`${testDate}T08:00:00.000Z`);

    // Tạo logs với complete log
    const logs: AttendanceLog[] = [
      {
        type: 'check_in',
        time: baseTime.toISOString(),
      },
      {
        type: 'check_out',
        time: new Date(baseTime.getTime() + 30 * 1000).toISOString(), // +30 giây
      },
      {
        type: 'complete',
        time: new Date(baseTime.getTime() + 60 * 1000).toISOString(), // +60 giây
      },
    ];

    const result = await workManager.calculateDailyWorkStatusNew(testDate, logs, mockShift);

    // Complete log có ưu tiên cao nhất
    expect(result.status).toBe('DU_CONG');
    expect(result.standardHours).toBe(8); // Tính theo lịch trình ca
  });

  test('Trường hợp chỉ có check-in - không áp dụng logic "Bấm Nhanh"', async () => {
    const testDate = '2025-01-15';
    const baseTime = parseISO(`${testDate}T08:00:00.000Z`);

    // Chỉ có check-in log
    const logs: AttendanceLog[] = [
      {
        type: 'check_in',
        time: baseTime.toISOString(),
      },
    ];

    const result = await workManager.calculateDailyWorkStatusNew(testDate, logs, mockShift);

    expect(result.status).toBe('CHUA_RA');
    expect(result.vaoLogTime).toBe(baseTime.toISOString());
    expect(result.raLogTime).toBeNull();
  });
});
