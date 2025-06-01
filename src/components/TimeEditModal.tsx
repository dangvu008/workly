import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Modal, Text, Button, useTheme, IconButton, TextInput } from 'react-native-paper';
import { format, parseISO, isValid, addMinutes, differenceInMinutes } from 'date-fns';
import { Shift } from '../types';

interface TimeEditModalProps {
  visible: boolean;
  onDismiss: () => void;
  currentCheckInTime?: string; // HH:MM format
  currentCheckOutTime?: string; // HH:MM format
  shift: Shift | null;
  onSave: (checkInTime: string, checkOutTime: string) => void; // Returns HH:MM format
}

export function TimeEditModal({
  visible,
  onDismiss,
  currentCheckInTime,
  currentCheckOutTime,
  shift,
  onSave,
}: TimeEditModalProps) {
  const theme = useTheme();
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [errors, setErrors] = useState<{
    checkIn?: string;
    checkOut?: string;
    general?: string;
  }>({});

  // Khởi tạo giá trị mặc định khi modal mở
  useEffect(() => {
    if (visible) {
      // Nếu có giờ hiện tại (đã ở format HH:MM), sử dụng chúng
      if (currentCheckInTime) {
        setCheckInTime(currentCheckInTime);
      } else if (shift) {
        // Nếu không có, sử dụng giờ ca làm việc
        setCheckInTime(shift.startTime);
      } else {
        setCheckInTime('08:00');
      }

      if (currentCheckOutTime) {
        setCheckOutTime(currentCheckOutTime);
      } else if (shift) {
        setCheckOutTime(shift.officeEndTime);
      } else {
        setCheckOutTime('17:00');
      }

      setErrors({});
    }
  }, [visible, currentCheckInTime, currentCheckOutTime, shift]);

  const validateTime = (timeString: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  };

  const parseTimeToDate = (timeString: string, baseDate: Date = new Date()): Date | null => {
    if (!validateTime(timeString)) return null;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const validateInputs = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate check-in time
    if (!checkInTime.trim()) {
      newErrors.checkIn = 'Vui lòng nhập giờ vào';
    } else if (!validateTime(checkInTime)) {
      newErrors.checkIn = 'Định dạng giờ không hợp lệ (HH:MM)';
    }

    // Validate check-out time
    if (!checkOutTime.trim()) {
      newErrors.checkOut = 'Vui lòng nhập giờ ra';
    } else if (!validateTime(checkOutTime)) {
      newErrors.checkOut = 'Định dạng giờ không hợp lệ (HH:MM)';
    }

    // Validate time logic
    if (!newErrors.checkIn && !newErrors.checkOut) {
      const checkInDate = parseTimeToDate(checkInTime);
      const checkOutDate = parseTimeToDate(checkOutTime);

      if (checkInDate && checkOutDate) {
        // Xử lý ca đêm (check-out có thể là ngày hôm sau)
        if (shift?.isNightShift && checkOutDate <= checkInDate) {
          // Thêm 1 ngày cho check-out time
          checkOutDate.setDate(checkOutDate.getDate() + 1);
        }

        if (checkOutDate <= checkInDate && !shift?.isNightShift) {
          newErrors.general = 'Giờ ra phải sau giờ vào';
        } else {
          const workDuration = differenceInMinutes(checkOutDate, checkInDate);
          if (workDuration > 24 * 60) {
            newErrors.general = 'Thời gian làm việc không thể vượt quá 24 giờ';
          } else if (workDuration < 30) {
            newErrors.general = 'Thời gian làm việc tối thiểu là 30 phút';
          }
        }

        // Cảnh báo nếu giờ quá lệch so với ca chuẩn
        if (shift && !newErrors.general) {
          const shiftStartTime = parseTimeToDate(shift.startTime);
          const shiftEndTime = parseTimeToDate(shift.officeEndTime);
          
          if (shiftStartTime && shiftEndTime) {
            const checkInDiff = Math.abs(differenceInMinutes(checkInDate, shiftStartTime));
            const checkOutDiff = Math.abs(differenceInMinutes(checkOutDate, shiftEndTime));
            
            if (checkInDiff > 120 || checkOutDiff > 120) {
              newErrors.general = 'Cảnh báo: Giờ chấm công lệch nhiều so với ca làm việc chuẩn';
            }
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      const today = new Date();
      const checkInDate = parseTimeToDate(checkInTime, today);
      const checkOutDate = parseTimeToDate(checkOutTime, today);

      if (!checkInDate || !checkOutDate) {
        Alert.alert('Lỗi', 'Không thể xử lý thời gian đã nhập');
        return;
      }

      // Xử lý ca đêm
      if (shift?.isNightShift && checkOutDate <= checkInDate) {
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }

      // Xác nhận nếu có cảnh báo
      if (errors.general && errors.general.includes('Cảnh báo')) {
        Alert.alert(
          'Xác nhận',
          `${errors.general}\n\nBạn có muốn tiếp tục không?`,
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Tiếp tục',
              onPress: () => {
                onSave(checkInTime, checkOutTime); // Return HH:MM format
              },
            },
          ]
        );
      } else {
        onSave(checkInTime, checkOutTime); // Return HH:MM format
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu thời gian chấm công');
    }
  };

  const formatShiftInfo = () => {
    if (!shift) return '';
    return `Ca ${shift.name}: ${shift.startTime} - ${shift.endTime}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.surface }
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Chỉnh sửa giờ chấm công
        </Text>
        <IconButton
          icon="close"
          size={24}
          iconColor={theme.colors.onSurface}
          onPress={onDismiss}
        />
      </View>

      {shift && (
        <Text style={[styles.shiftInfo, { color: theme.colors.onSurfaceVariant }]}>
          {formatShiftInfo()}
        </Text>
      )}

      <View style={styles.content}>
        {/* Check-in Time */}
        <TextInput
          label="Giờ vào"
          value={checkInTime}
          onChangeText={setCheckInTime}
          placeholder="HH:MM"
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          error={!!errors.checkIn}
          left={<TextInput.Icon icon="login" />}
        />
        {errors.checkIn && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.checkIn}
          </Text>
        )}

        {/* Check-out Time */}
        <TextInput
          label="Giờ ra"
          value={checkOutTime}
          onChangeText={setCheckOutTime}
          placeholder="HH:MM"
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          error={!!errors.checkOut}
          left={<TextInput.Icon icon="logout" />}
        />
        {errors.checkOut && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.checkOut}
          </Text>
        )}

        {/* General Error */}
        {errors.general && (
          <Text style={[
            styles.errorText,
            { 
              color: errors.general.includes('Cảnh báo') 
                ? theme.colors.primary 
                : theme.colors.error 
            }
          ]}>
            {errors.general}
          </Text>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.button}
          >
            Hủy
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
          >
            Lưu
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shiftInfo: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  content: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});
