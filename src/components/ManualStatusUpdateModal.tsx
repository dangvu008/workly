import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Modal, Text, Button, useTheme, Divider, IconButton, List, Menu, TouchableRipple } from 'react-native-paper';
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
  
  // Dropdown states
  const [attendanceMenuVisible, setAttendanceMenuVisible] = useState(false);
  const [leaveMenuVisible, setLeaveMenuVisible] = useState(false);
  const [selectedAttendanceAction, setSelectedAttendanceAction] = useState<string>('');
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState<DailyWorkStatus['status'] | ''>('');

  if (!visible) {
    return null;
  }

  if (!date) {
    return null;
  }

  let dateObj: Date;
  try {
    dateObj = parseISO(date);
    if (isNaN(dateObj.getTime())) {
      return null;
    }
  } catch (error) {
    return null;
  }

  const dayOfWeek = DAYS_OF_WEEK.vi[dateObj.getDay()];
  const formattedDate = format(dateObj, 'dd/MM/yyyy', { locale: vi });

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

  // Dropdown handlers
  const handleAttendanceActionSelect = (action: string) => {
    setSelectedAttendanceAction(action);
    setAttendanceMenuVisible(false);
    
    // Execute action immediately
    switch (action) {
      case 'recalculate':
        handleRecalculate();
        break;
      case 'edit_time':
        setTimeEditVisible(true);
        break;
      case 'clear_manual':
        handleClearManual();
        break;
    }
  };

  const handleLeaveStatusSelect = (status: DailyWorkStatus['status']) => {
    setSelectedLeaveStatus(status);
    setLeaveMenuVisible(false);
    
    // Execute action immediately
    handleStatusSelect(status);
  };

  // Attendance actions for dropdown
  const attendanceActions = [
    {
      key: 'recalculate',
      title: 'Tính theo chấm công',
      description: 'Tự động tính dựa trên log check-in/check-out',
      icon: 'calculator',
    },
    {
      key: 'edit_time',
      title: 'Chỉnh sửa giờ chấm công',
      description: 'Nhập/sửa giờ vào và giờ ra thủ công',
      icon: 'clock-edit',
    },
    ...(hasManualStatus ? [{
      key: 'clear_manual',
      title: 'Xóa trạng thái thủ công',
      description: 'Xóa trạng thái nghỉ và tính lại từ chấm công',
      icon: 'delete',
    }] : []),
  ];

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

          {/* Dropdown cho ngày quá khứ/hiện tại */}
          {isDatePastOrToday && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                📊 Tính toán từ chấm công
              </Text>

              <Text style={[styles.dropdownLabel, { color: theme.colors.onSurfaceVariant }]}>
                Chọn hành động:
              </Text>

              <Menu
                visible={attendanceMenuVisible}
                onDismiss={() => setAttendanceMenuVisible(false)}
                anchor={
                  <TouchableRipple
                    onPress={() => setAttendanceMenuVisible(true)}
                    style={[
                      styles.dropdownButton,
                      { 
                        backgroundColor: theme.colors.surfaceVariant,
                        borderColor: theme.colors.outline,
                      }
                    ]}
                  >
                    <View style={styles.dropdownContent}>
                      <List.Icon icon="calculator" color={theme.colors.onSurfaceVariant} />
                      <View style={styles.dropdownTextContainer}>
                        <Text style={[styles.dropdownText, { color: theme.colors.onSurface }]}>
                          {selectedAttendanceAction ? 
                            attendanceActions.find(a => a.key === selectedAttendanceAction)?.title :
                            'Chọn hành động...'
                          }
                        </Text>
                      </View>
                      <List.Icon icon="chevron-down" color={theme.colors.onSurfaceVariant} />
                    </View>
                  </TouchableRipple>
                }
              >
                {attendanceActions.map((action) => (
                  <Menu.Item
                    key={action.key}
                    onPress={() => handleAttendanceActionSelect(action.key)}
                    title={action.title}
                    leadingIcon={action.icon}
                    titleStyle={{ color: action.key === 'clear_manual' ? theme.colors.error : theme.colors.onSurface }}
                  />
                ))}
              </Menu>

              <Divider style={{ marginVertical: 16 }} />
            </>
          )}

          {/* Dropdown cho trạng thái nghỉ */}
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {isDatePastOrToday ? '🏖️ Cập nhật trạng thái nghỉ' : '📝 Đăng ký trạng thái nghỉ'}
          </Text>

          <Text style={[styles.dropdownLabel, { color: theme.colors.onSurfaceVariant }]}>
            Chọn trạng thái mới:
          </Text>

          <Menu
            visible={leaveMenuVisible}
            onDismiss={() => setLeaveMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={() => setLeaveMenuVisible(true)}
                style={[
                  styles.dropdownButton,
                  { 
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.outline,
                  }
                ]}
              >
                <View style={styles.dropdownContent}>
                  <List.Icon 
                    icon={selectedLeaveStatus ? 
                      leaveStatuses.find(s => s.status === selectedLeaveStatus)?.icon || 'calendar' :
                      currentStatus?.status ?
                        (leaveStatuses.find(s => s.status === currentStatus.status)?.icon || 'calendar') :
                        'calendar'
                    } 
                    color={theme.colors.onSurfaceVariant} 
                  />
                  <View style={styles.dropdownTextContainer}>
                    <Text style={[styles.dropdownText, { color: theme.colors.onSurface }]}>
                      {selectedLeaveStatus ? 
                        leaveStatuses.find(s => s.status === selectedLeaveStatus)?.title :
                        currentStatus?.status ? 
                          (WEEKLY_STATUS[currentStatus.status]?.text || 'Chọn trạng thái...') :
                          'Chọn trạng thái...'
                      }
                    </Text>
                    {(selectedLeaveStatus || currentStatus?.status) && (
                      <Text style={[styles.dropdownDescription, { color: theme.colors.onSurfaceVariant }]}>
                        {selectedLeaveStatus ? 
                          leaveStatuses.find(s => s.status === selectedLeaveStatus)?.description :
                          currentStatus?.status ?
                            leaveStatuses.find(s => s.status === currentStatus.status)?.description || 'Trạng thái hiện tại' :
                            ''
                        }
                      </Text>
                    )}
                  </View>
                  <List.Icon icon="chevron-down" color={theme.colors.onSurfaceVariant} />
                </View>
              </TouchableRipple>
            }
          >
            {leaveStatuses.map((item) => (
              <Menu.Item
                key={item.status}
                onPress={() => handleLeaveStatusSelect(item.status)}
                title={item.title}
                leadingIcon={item.icon}
                titleStyle={{ color: theme.colors.onSurface }}
              />
            ))}
          </Menu>

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
  cancelButton: {
    marginTop: 16,
  },
  // Dropdown styles
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 56,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownDescription: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
