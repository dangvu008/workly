import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ManualStatusUpdateModal } from '../components/ManualStatusUpdateModal';
import { TimeEditModal } from '../components/TimeEditModal';
import { workManager } from '../services/workManager';

// Mock dependencies
jest.mock('../services/workManager');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

const mockShift = {
  id: 'shift1',
  name: 'Ca Hành Chính',
  startTime: '08:00',
  endTime: '17:30',
  officeEndTime: '17:00',
  breakMinutes: 60,
  showPunch: false,
  departureTime: '07:30',
  isNightShift: false,
  workDays: [1, 2, 3, 4, 5],
};

const mockCurrentStatus = {
  status: 'completed' as const,
  standardHoursScheduled: 8,
  otHoursScheduled: 0,
  sundayHoursScheduled: 0,
  nightHoursScheduled: 0,
  totalHoursScheduled: 8,
  lateMinutes: 0,
  earlyMinutes: 0,
  isHolidayWork: false,
  vaoLogTime: '2025-05-28T08:00:00.000Z',
  raLogTime: '2025-05-28T17:00:00.000Z',
};

describe('ManualStatusUpdateModal', () => {
  const defaultProps = {
    visible: true,
    onDismiss: jest.fn(),
    date: '2025-05-28',
    currentStatus: mockCurrentStatus,
    shift: mockShift,
    onStatusUpdate: jest.fn(),
    onTimeEdit: jest.fn(),
    onRecalculateFromLogs: jest.fn(),
    onClearManualStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly for past date', () => {
    const { getByText } = render(<ManualStatusUpdateModal {...defaultProps} />);
    
    expect(getByText('Cập nhật trạng thái')).toBeTruthy();
    expect(getByText('Thứ Tư, 28/05/2025')).toBeTruthy();
    expect(getByText('Tính theo chấm công')).toBeTruthy();
    expect(getByText('Chỉnh sửa giờ chấm công')).toBeTruthy();
    expect(getByText('Nghỉ Phép')).toBeTruthy();
    expect(getByText('Nghỉ Bệnh')).toBeTruthy();
  });

  it('should handle status update correctly', async () => {
    const onStatusUpdate = jest.fn().mockResolvedValue(undefined);
    const { getByText } = render(
      <ManualStatusUpdateModal {...defaultProps} onStatusUpdate={onStatusUpdate} />
    );
    
    fireEvent.press(getByText('Nghỉ Phép'));
    
    await waitFor(() => {
      expect(onStatusUpdate).toHaveBeenCalledWith('NGHI_PHEP');
    });
  });

  it('should handle recalculate from logs', async () => {
    const onRecalculateFromLogs = jest.fn().mockResolvedValue(undefined);
    const { getByText } = render(
      <ManualStatusUpdateModal {...defaultProps} onRecalculateFromLogs={onRecalculateFromLogs} />
    );
    
    fireEvent.press(getByText('Tính theo chấm công'));
    
    await waitFor(() => {
      expect(onRecalculateFromLogs).toHaveBeenCalled();
    });
  });

  it('should show time edit modal when requested', () => {
    const { getByText, queryByText } = render(<ManualStatusUpdateModal {...defaultProps} />);
    
    fireEvent.press(getByText('Chỉnh sửa giờ chấm công'));
    
    // TimeEditModal should be rendered
    expect(queryByText('Chỉnh sửa giờ chấm công')).toBeTruthy();
  });

  it('should handle clear manual status with confirmation', async () => {
    const onClearManualStatus = jest.fn().mockResolvedValue(undefined);
    const mockAlert = Alert.alert as jest.Mock;
    
    const propsWithManualStatus = {
      ...defaultProps,
      currentStatus: { ...mockCurrentStatus, isManualOverride: true },
      onClearManualStatus,
    };
    
    const { getByText } = render(<ManualStatusUpdateModal {...propsWithManualStatus} />);
    
    fireEvent.press(getByText('Xóa trạng thái thủ công'));
    
    expect(mockAlert).toHaveBeenCalledWith(
      'Xác nhận',
      expect.stringContaining('Bạn có chắc muốn xóa trạng thái thủ công'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Hủy' }),
        expect.objectContaining({ text: 'Xóa' }),
      ])
    );
  });
});

describe('TimeEditModal', () => {
  const defaultProps = {
    visible: true,
    onDismiss: jest.fn(),
    currentCheckInTime: '2025-05-28T08:00:00.000Z',
    currentCheckOutTime: '2025-05-28T17:00:00.000Z',
    shift: mockShift,
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with current times', () => {
    const { getByDisplayValue } = render(<TimeEditModal {...defaultProps} />);
    
    expect(getByDisplayValue('08:00')).toBeTruthy();
    expect(getByDisplayValue('17:00')).toBeTruthy();
  });

  it('should validate time format', () => {
    const { getByDisplayValue, getByText } = render(<TimeEditModal {...defaultProps} />);
    
    const checkInInput = getByDisplayValue('08:00');
    fireEvent.changeText(checkInInput, 'invalid');
    
    fireEvent.press(getByText('Lưu'));
    
    expect(getByText('Định dạng giờ không hợp lệ (HH:MM)')).toBeTruthy();
  });

  it('should validate check-out after check-in', () => {
    const { getByDisplayValue, getByText } = render(<TimeEditModal {...defaultProps} />);
    
    const checkInInput = getByDisplayValue('08:00');
    const checkOutInput = getByDisplayValue('17:00');
    
    fireEvent.changeText(checkInInput, '18:00');
    fireEvent.changeText(checkOutInput, '17:00');
    
    fireEvent.press(getByText('Lưu'));
    
    expect(getByText('Giờ ra phải sau giờ vào')).toBeTruthy();
  });

  it('should handle night shift correctly', () => {
    const nightShift = { ...mockShift, isNightShift: true };
    const { getByDisplayValue, getByText } = render(
      <TimeEditModal {...defaultProps} shift={nightShift} />
    );
    
    const checkInInput = getByDisplayValue('08:00');
    const checkOutInput = getByDisplayValue('17:00');
    
    fireEvent.changeText(checkInInput, '22:00');
    fireEvent.changeText(checkOutInput, '06:00');
    
    fireEvent.press(getByText('Lưu'));
    
    // Should not show error for night shift
    expect(() => getByText('Giờ ra phải sau giờ vào')).toThrow();
  });

  it('should call onSave with correct ISO timestamps', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByText } = render(<TimeEditModal {...defaultProps} onSave={onSave} />);
    
    fireEvent.press(getByText('Lưu'));
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T08:00:00\.\d{3}Z$/),
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T17:00:00\.\d{3}Z$/)
      );
    });
  });
});

describe('WorkManager Manual Status Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set manual work status correctly', async () => {
    const mockSetDailyWorkStatusForDate = jest.fn();
    (workManager as any).setDailyWorkStatusForDate = mockSetDailyWorkStatusForDate;
    
    await workManager.setManualWorkStatus('2025-05-28', 'NGHI_PHEP');
    
    expect(mockSetDailyWorkStatusForDate).toHaveBeenCalledWith(
      '2025-05-28',
      expect.objectContaining({
        status: 'NGHI_PHEP',
        isManualOverride: true,
        standardHoursScheduled: 0,
        totalHoursScheduled: 0,
      })
    );
  });

  it('should update attendance time correctly', async () => {
    const mockClearAttendanceLogsForDate = jest.fn();
    const mockAddAttendanceLog = jest.fn();
    
    (workManager as any).clearAttendanceLogsForDate = mockClearAttendanceLogsForDate;
    (workManager as any).addAttendanceLog = mockAddAttendanceLog;
    
    await workManager.updateAttendanceTime(
      '2025-05-28',
      '2025-05-28T08:30:00.000Z',
      '2025-05-28T17:30:00.000Z'
    );
    
    expect(mockClearAttendanceLogsForDate).toHaveBeenCalledWith('2025-05-28');
    expect(mockAddAttendanceLog).toHaveBeenCalledTimes(2);
    expect(mockAddAttendanceLog).toHaveBeenCalledWith('2025-05-28', {
      type: 'check_in',
      time: '2025-05-28T08:30:00.000Z',
    });
    expect(mockAddAttendanceLog).toHaveBeenCalledWith('2025-05-28', {
      type: 'check_out',
      time: '2025-05-28T17:30:00.000Z',
    });
  });
});
