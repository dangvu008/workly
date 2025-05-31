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
    console.log('❌ No date provided, using today as fallback');
    // Fallback to today's date if no date provided
    const fallbackDate = format(new Date(), 'yyyy-MM-dd');
    console.log('📅 Using fallback date:', fallbackDate);

    // Don't return null, use fallback date instead
    let dateObj: Date;
    try {
      dateObj = new Date();
    } catch (error) {
      console.log('❌ Error creating fallback date:', error);
      return null;
    }

    const dayOfWeek = DAYS_OF_WEEK.vi[dateObj.getDay()];
    const formattedDate = format(dateObj, 'dd/MM/yyyy', { locale: vi });

    console.log('✅ Modal rendering with fallback date:', formattedDate);

    // Continue with fallback date...
    const isDatePastOrToday = true; // Today is always past or today
    const hasManualStatus = false; // No status for fallback

    // Use simplified rendering for fallback
    return renderSimpleModal(dateObj, dayOfWeek, formattedDate, true, false);
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

  // Helper function for simplified modal rendering
  function renderSimpleModal(dateObj: Date, dayOfWeek: string, formattedDate: string, isDatePastOrToday: boolean, hasManualStatus: boolean) {
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

            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.cancelButton}
            >
              Đóng
            </Button>
          </ScrollView>
        </Modal>
      </>
    );
  }

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
      description: isDatePastOrToday ? 'Nghỉ phép có lương, đã được duyệt' : 'Đăng ký nghỉ phép cho ngày này',
    },
    {
      status: 'NGHI_BENH',
      title: 'Nghỉ Bệnh',
      icon: 'hospital-box',
      description: isDatePastOrToday ? 'Nghỉ ốm, bệnh tật có giấy tờ' : 'Đăng ký nghỉ bệnh cho ngày này',
    },
    {
      status: 'NGHI_LE',
      title: 'Nghỉ Lễ',
      icon: 'flag',
      description: isDatePastOrToday ? 'Nghỉ lễ, tết, ngày nghỉ chính thức' : 'Đánh dấu nghỉ lễ cho ngày này',
    },
    {
      status: 'VANG_MAT',
      title: 'Vắng Mặt',
      icon: 'account-remove',
      description: isDatePastOrToday ? 'Vắng mặt không phép, không báo trước' : 'Đăng ký vắng mặt cho ngày này',
    },
    {
      status: 'CONG_TAC',
      title: 'Công Tác',
      icon: 'airplane',
      description: isDatePastOrToday ? 'Đi công tác, làm việc tại địa điểm khác' : 'Đăng ký công tác cho ngày này',
    },
  ];

  const handleStatusSelect = async (status: DailyWorkStatus['status']) => {
    try {
      await onStatusUpdate(status);
      onDismiss();

      const statusInfo = WEEKLY_STATUS[status];
      const actionType = isDatePastOrToday ? 'cập nhật' : 'đăng ký';
      const dateType = isToday(dateObj) ? 'hôm nay' :
                      isPast(dateObj) ? `ngày ${format(dateObj, 'dd/MM')}` :
                      `ngày ${format(dateObj, 'dd/MM')} (tương lai)`;

      Alert.alert(
        '✅ Thành công',
        `Đã ${actionType} trạng thái ${dateType} thành "${statusInfo?.text || status}"`
      );
    } catch (error) {
      Alert.alert('❌ Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const handleRecalculate = async () => {
    try {
      await onRecalculateFromLogs();
      onDismiss();

      const dateType = isToday(dateObj) ? 'hôm nay' : `ngày ${format(dateObj, 'dd/MM')}`;
      Alert.alert(
        '🔄 Thành công',
        `Đã tính lại trạng thái cho ${dateType} dựa trên dữ liệu chấm công thực tế`
      );
    } catch (error) {
      Alert.alert('❌ Lỗi', 'Không thể tính lại trạng thái. Vui lòng thử lại.');
    }
  };

  const handleClearManual = async () => {
    const dateType = isToday(dateObj) ? 'hôm nay' : `ngày ${format(dateObj, 'dd/MM')}`;

    Alert.alert(
      '⚠️ Xác nhận xóa',
      `Bạn có chắc muốn xóa trạng thái thủ công và tính lại cho ${dateType}?\n\nHệ thống sẽ tự động tính toán lại dựa trên dữ liệu chấm công thực tế.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa và tính lại',
          style: 'destructive',
          onPress: async () => {
            try {
              await onClearManualStatus();
              onDismiss();
              Alert.alert('🗑️ Thành công', `Đã xóa trạng thái thủ công cho ${dateType} và tính lại từ chấm công`);
            } catch (error) {
              Alert.alert('❌ Lỗi', 'Không thể xóa trạng thái. Vui lòng thử lại.');
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

      const dateType = isToday(dateObj) ? 'hôm nay' : `ngày ${format(dateObj, 'dd/MM')}`;
      Alert.alert(
        '🕐 Thành công',
        `Đã cập nhật giờ chấm công cho ${dateType}\nVào: ${checkInTime}\nRa: ${checkOutTime}`
      );
    } catch (error) {
      Alert.alert('❌ Lỗi', 'Không thể cập nhật giờ chấm công. Vui lòng thử lại.');
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

            {/* Hiển thị loại ngày */}
            <View style={styles.dateTypeContainer}>
              <Text style={[
                styles.dateTypeText,
                {
                  color: isDatePastOrToday
                    ? (isToday(dateObj) ? theme.colors.primary : theme.colors.onSurfaceVariant)
                    : theme.colors.secondary,
                  backgroundColor: isDatePastOrToday
                    ? (isToday(dateObj) ? theme.colors.primaryContainer : theme.colors.surfaceVariant)
                    : theme.colors.secondaryContainer,
                }
              ]}>
                {isToday(dateObj) ? '📅 Hôm nay' :
                 isPast(dateObj) ? '⏪ Quá khứ' :
                 '⏩ Tương lai'}
              </Text>
            </View>

            {shift ? (
              <Text style={[styles.shiftText, { color: theme.colors.primary }]}>
                Ca: {shift.name} ({shift.startTime} - {shift.endTime})
              </Text>
            ) : (
              <Text style={[styles.shiftText, { color: theme.colors.error }]}>
                ⚠️ Chưa có ca làm việc được kích hoạt
              </Text>
            )}

            {/* Hiển thị trạng thái hiện tại nếu có */}
            {currentStatus && (
              <Text style={[styles.currentStatusText, { color: theme.colors.outline }]}>
                Trạng thái hiện tại: {WEEKLY_STATUS[currentStatus.status]?.text || currentStatus.status}
                {hasManualStatus && ' (Thủ công)'}
              </Text>
            )}
          </View>

          <Divider style={{ marginVertical: 16 }} />

          {/* Các lựa chọn cho ngày quá khứ/hiện tại */}
          {isDatePastOrToday && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                📊 Tính toán từ chấm công
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
            {isDatePastOrToday ? '🏖️ Cập nhật trạng thái nghỉ' : '📝 Đăng ký trạng thái nghỉ'}
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
  dateTypeContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  dateTypeText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  currentStatusText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
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
