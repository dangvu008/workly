import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Modal, Text, Button, useTheme, Divider, IconButton, List } from 'react-native-paper';
import { format, parseISO, isFuture, isToday, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DailyWorkStatus, Shift } from '../types';
import { WEEKLY_STATUS, DAYS_OF_WEEK } from '../constants';
import { TimeEditModal } from './TimeEditModal';

interface ManualStatusUpdateModalProps {
  visible: boolean;
  onDismiss: () => void;
  date: string;
  currentStatus: DailyWorkStatus | null;
  shift: Shift | null;
  onStatusUpdate: (status: DailyWorkStatus['status']) => Promise<void>;
  onTimeEdit: (checkInTime: string, checkOutTime: string) => Promise<void>;
  onRecalculateFromLogs: () => Promise<void>;
  onClearManualStatus: () => Promise<void>;
}

export function ManualStatusUpdateModal({
  visible,
  onDismiss,
  date,
  currentStatus,
  shift,
  onStatusUpdate,
  onTimeEdit,
  onRecalculateFromLogs,
  onClearManualStatus,
}: ManualStatusUpdateModalProps) {
  const theme = useTheme();
  const [timeEditVisible, setTimeEditVisible] = useState(false);

  // Debug logs để kiểm tra
  console.log('🔍 ManualStatusUpdateModal props:', { visible, date, hasCurrentStatus: !!currentStatus, hasShift: !!shift });

  if (!visible) {
    console.log('❌ Modal not visible');
    return null;
  }

  if (!date) {
    console.log('❌ No date provided');
    return null;
  }

  let dateObj: Date;
  try {
    dateObj = parseISO(date);
    if (isNaN(dateObj.getTime())) {
      console.log('❌ Invalid date:', date);
      return null;
    }
  } catch (error) {
    console.log('❌ Error parsing date:', date, error);
    return null;
  }

  const dayOfWeek = DAYS_OF_WEEK.vi[dateObj.getDay()];
  const formattedDate = format(dateObj, 'dd/MM/yyyy', { locale: vi });

  console.log('✅ Modal rendering for:', formattedDate);

  const isDateFuture = isFuture(dateObj) && !isToday(dateObj);
  const isDatePastOrToday = isPast(dateObj) || isToday(dateObj);
  const hasManualStatus = currentStatus?.isManualOverride;

  // Các trạng thái nghỉ có thể chọn
  const leaveStatuses: Array<{
    status: DailyWorkStatus['status'];
    title: string;
    icon: string;
    description: string;
  }> = [
    {
      status: 'NGHI_PHEP',
      title: 'Nghỉ Phép',
      icon: 'beach',
      description: 'Nghỉ phép có kế hoạch',
    },
    {
      status: 'NGHI_BENH',
      title: 'Nghỉ Bệnh',
      icon: 'hospital-box',
      description: 'Nghỉ ốm, khám bệnh',
    },
    {
      status: 'NGHI_LE',
      title: 'Nghỉ Lễ',
      icon: 'flag',
      description: 'Nghỉ lễ, tết',
    },
    {
      status: 'VANG_MAT',
      title: 'Vắng Mặt',
      icon: 'account-remove',
      description: 'Vắng mặt không phép',
    },
    {
      status: 'CONG_TAC',
      title: 'Công Tác',
      icon: 'airplane',
      description: 'Đi công tác',
    },
  ];

  const handleStatusSelect = async (status: DailyWorkStatus['status']) => {
    try {
      await onStatusUpdate(status);
      onDismiss();

      const statusInfo = WEEKLY_STATUS[status];
      Alert.alert(
        'Thành công',
        `Đã cập nhật trạng thái ngày ${format(dateObj, 'dd/MM')} thành "${statusInfo?.text}"`
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const handleRecalculate = async () => {
    try {
      await onRecalculateFromLogs();
      onDismiss();
      Alert.alert(
        'Thành công',
        `Đã tính lại trạng thái cho ngày ${format(dateObj, 'dd/MM')} dựa trên chấm công`
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tính lại trạng thái. Vui lòng thử lại.');
    }
  };

  const handleClearManual = async () => {
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc muốn xóa trạng thái thủ công và tính lại cho ngày ${format(dateObj, 'dd/MM')}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await onClearManualStatus();
              onDismiss();
              Alert.alert('Thành công', 'Đã xóa trạng thái thủ công và tính lại');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa trạng thái. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const handleTimeEditSave = async (checkInTime: string, checkOutTime: string) => {
    try {
      await onTimeEdit(checkInTime, checkOutTime);
      setTimeEditVisible(false);
      onDismiss();
      Alert.alert('Thành công', 'Đã cập nhật giờ chấm công');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật giờ chấm công. Vui lòng thử lại.');
    }
  };

  console.log('🎯 About to render Modal with visible:', visible);

  return (
    <>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                Cập nhật trạng thái
              </Text>
              <IconButton
                icon="close"
                size={24}
                iconColor={theme.colors.onSurface}
                onPress={onDismiss}
              />
            </View>

            <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
              {dayOfWeek}, {formattedDate}
            </Text>

            {shift ? (
              <Text style={[styles.shiftText, { color: theme.colors.primary }]}>
                Ca: {shift.name} ({shift.startTime} - {shift.endTime})
              </Text>
            ) : (
              <Text style={[styles.shiftText, { color: theme.colors.error }]}>
                Chưa có ca làm việc được kích hoạt
              </Text>
            )}
          </View>

          <Divider style={{ marginVertical: 16 }} />

          {/* Các lựa chọn cho ngày quá khứ/hiện tại */}
          {isDatePastOrToday && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Tính toán từ chấm công
              </Text>

              <List.Item
                title="Tính theo chấm công"
                description="Tự động tính dựa trên log check-in/check-out"
                left={(props) => <List.Icon {...props} icon="calculator" />}
                onPress={handleRecalculate}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
              />

              <List.Item
                title="Chỉnh sửa giờ chấm công"
                description="Nhập/sửa giờ vào và giờ ra thủ công"
                left={(props) => <List.Icon {...props} icon="clock-edit" />}
                onPress={() => setTimeEditVisible(true)}
                style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
              />

              {hasManualStatus && (
                <List.Item
                  title="Xóa trạng thái thủ công"
                  description="Xóa trạng thái nghỉ và tính lại từ chấm công"
                  left={(props) => <List.Icon {...props} icon="delete" />}
                  onPress={handleClearManual}
                  style={[styles.listItem, { backgroundColor: theme.colors.errorContainer }]}
                  titleStyle={{ color: theme.colors.onErrorContainer }}
                  descriptionStyle={{ color: theme.colors.onErrorContainer }}
                />
              )}

              <Divider style={{ marginVertical: 16 }} />
            </>
          )}

          {/* Các trạng thái nghỉ */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Trạng thái nghỉ
          </Text>

          {leaveStatuses.map((item) => (
            <List.Item
              key={item.status}
              title={item.title}
              description={item.description}
              left={(props) => <List.Icon {...props} icon={item.icon} />}
              onPress={() => handleStatusSelect(item.status)}
              style={[styles.listItem, { backgroundColor: theme.colors.surfaceVariant }]}
            />
          ))}

          {/* Nút hủy */}
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.cancelButton}
          >
            Hủy
          </Button>
        </ScrollView>
      </Modal>

      {/* Time Edit Modal */}
      <TimeEditModal
        visible={timeEditVisible}
        onDismiss={() => setTimeEditVisible(false)}
        currentCheckInTime={currentStatus?.vaoLogTime}
        currentCheckOutTime={currentStatus?.raLogTime}
        shift={shift}
        onSave={handleTimeEditSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    marginTop: 4,
  },
  shiftText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  listItem: {
    borderRadius: 8,
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 16,
  },
});
