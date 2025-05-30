import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  List,
  Button,
  IconButton,
  useTheme,
  Chip,
  FAB,
  Menu,
  RadioButton,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { Shift } from '../types';
import { TabParamList, RootStackParamList } from '../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type ShiftManagementScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'ShiftsTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface ShiftManagementScreenProps {
  navigation: ShiftManagementScreenNavigationProp;
  route: {
    params?: {
      mode?: 'select_rotation';
    };
  };
}

export function ShiftManagementScreen({ navigation, route }: ShiftManagementScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [frequencyMenuVisible, setFrequencyMenuVisible] = useState(false);

  const isRotationMode = route.params?.mode === 'select_rotation';
  const settings = state.settings;

  // Initialize selected shifts for rotation mode
  React.useEffect(() => {
    if (isRotationMode && settings?.rotationConfig?.rotationShifts) {
      setSelectedShifts(settings.rotationConfig.rotationShifts);
    }
  }, [isRotationMode, settings?.rotationConfig?.rotationShifts]);

  const handleSelectShift = async (shiftId: string) => {
    if (isRotationMode) {
      // Multi-select for rotation
      setSelectedShifts(prev => {
        if (prev.includes(shiftId)) {
          return prev.filter(id => id !== shiftId);
        } else if (prev.length < 3) {
          return [...prev, shiftId];
        } else {
          Alert.alert('Thông báo', 'Chỉ có thể chọn tối đa 3 ca để xoay vòng.');
          return prev;
        }
      });
    } else {
      // Single select for active shift
      try {
        await actions.setActiveShift(shiftId);
        Alert.alert('Thành công', 'Đã chọn ca làm việc mới.');
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể chọn ca làm việc.');
      }
    }
  };

  const handleDeleteShift = (shift: Shift) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có muốn xóa ca "${shift.name}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await actions.deleteShift(shift.id);
              Alert.alert('Thành công', 'Đã xóa ca làm việc.');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa ca làm việc.');
            }
          }
        }
      ]
    );
  };

  const handleModeChange = async (mode: 'disabled' | 'ask_weekly' | 'rotate') => {
    try {
      if (mode === 'disabled') {
        await actions.updateSettings({
          changeShiftReminderMode: mode,
          rotationConfig: undefined,
        });
      } else {
        await actions.updateSettings({
          changeShiftReminderMode: mode,
        });
      }
      Alert.alert('Thành công', 'Đã cập nhật chế độ ca làm việc.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật chế độ ca.');
    }
  };

  const handleSelectRotationShifts = () => {
    navigation.navigate('ShiftManagement', { mode: 'select_rotation' });
  };

  const handleFrequencyChange = async (frequency: 'weekly' | 'biweekly' | 'triweekly' | 'monthly') => {
    try {
      const currentConfig = settings?.rotationConfig;
      await actions.updateSettings({
        rotationConfig: {
          rotationShifts: currentConfig?.rotationShifts || [],
          rotationFrequency: frequency,
          rotationLastAppliedDate: currentConfig?.rotationLastAppliedDate,
          currentRotationIndex: currentConfig?.currentRotationIndex || 0,
        }
      });
      setFrequencyMenuVisible(false);
      Alert.alert('Thành công', 'Đã cập nhật tần suất xoay ca.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật tần suất xoay ca.');
    }
  };

  const handleConfirmRotation = async () => {
    if (selectedShifts.length < 2) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 2 ca để xoay vòng.');
      return;
    }

    try {
      // Find current active shift index in selected shifts
      const currentActiveIndex = selectedShifts.findIndex(id => id === state.activeShift?.id);

      await actions.updateSettings({
        rotationConfig: {
          rotationShifts: selectedShifts,
          rotationFrequency: settings?.rotationConfig?.rotationFrequency || 'weekly',
          rotationLastAppliedDate: new Date().toISOString(),
          currentRotationIndex: currentActiveIndex >= 0 ? currentActiveIndex : 0,
        }
      });
      Alert.alert('Thành công', 'Đã cấu hình xoay ca thành công.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cấu hình xoay ca.');
    }
  };

  const formatWorkDays = (workDays: number[]): string => {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return workDays.map(day => dayNames[day]).join(', ');
  };

  const renderShiftItem = (shift: Shift) => {
    const isActive = state.activeShift?.id === shift.id;
    const isSelected = selectedShifts.includes(shift.id);

    return (
      <Card
        key={shift.id}
        style={[
          styles.shiftCard,
          { backgroundColor: theme.colors.surface },
          (isActive || isSelected) && {
            borderColor: theme.colors.primary,
            borderWidth: 2
          }
        ]}
      >
        <Card.Content>
          <View style={styles.shiftHeader}>
            <View style={styles.shiftInfo}>
              <Text style={[styles.shiftName, { color: theme.colors.onSurface }]}>
                {shift.name}
              </Text>
              {isActive && !isRotationMode && (
                <Chip
                  mode="flat"
                  style={[styles.activeChip, { backgroundColor: theme.colors.primaryContainer }]}
                  textStyle={{ color: theme.colors.onPrimaryContainer }}
                >
                  Đang sử dụng
                </Chip>
              )}
              {isSelected && isRotationMode && (
                <Chip
                  mode="flat"
                  style={[styles.selectedChip, { backgroundColor: theme.colors.secondaryContainer }]}
                  textStyle={{ color: theme.colors.onSecondaryContainer }}
                >
                  Đã chọn
                </Chip>
              )}
            </View>
            <View style={styles.shiftActions}>
              <IconButton
                icon="pencil"
                size={20}
                iconColor={theme.colors.primary}
                onPress={() => navigation.navigate('AddEditShift', { shiftId: shift.id })}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => handleDeleteShift(shift)}
              />
            </View>
          </View>

          <View style={styles.shiftDetails}>
            <Text style={[styles.shiftTime, { color: theme.colors.onSurface }]}>
              ⏰ {shift.startTime} - {shift.endTime}
            </Text>
            <Text style={[styles.shiftDays, { color: theme.colors.onSurfaceVariant }]}>
              📅 {formatWorkDays(shift.workDays)}
            </Text>
            {shift.isNightShift && (
              <Text style={[styles.nightShift, { color: theme.colors.tertiary }]}>
                🌙 Ca đêm
              </Text>
            )}
            {shift.showPunch && (
              <Text style={[styles.punchRequired, { color: theme.colors.secondary }]}>
                ✍️ Yêu cầu ký công
              </Text>
            )}
          </View>

          <Button
            mode={isActive || isSelected ? "contained" : "outlined"}
            onPress={() => handleSelectShift(shift.id)}
            style={styles.selectButton}
          >
            {isRotationMode
              ? (isSelected ? 'Đã chọn' : 'Chọn')
              : (isActive ? 'Đang sử dụng' : 'Chọn ca này')
            }
          </Button>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        {isRotationMode ? (
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
        ) : (
          <View style={{ width: 48 }} />
        )}
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {isRotationMode ? 'Chọn ca xoay vòng' : 'Quản lý ca'}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {isRotationMode && (
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content>
            <Text style={[styles.infoText, { color: theme.colors.onPrimaryContainer }]}>
              Chọn 2-3 ca để xoay vòng hàng tuần. Đã chọn: {selectedShifts.length}/3
            </Text>
          </Card.Content>
        </Card>
      )}

      <ScrollView style={styles.scrollView}>
        {/* Shift Mode Configuration - Only show in normal mode */}
        {!isRotationMode && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Chế độ Ca & Nhắc Đổi Ca
              </Text>

              {/* Mode Selection */}
              <View style={styles.modeSection}>
                <Text style={[styles.modeLabel, { color: theme.colors.onSurface }]}>
                  Chế độ chính:
                </Text>

                <RadioButton.Group
                  onValueChange={(value) => handleModeChange(value as any)}
                  value={settings?.changeShiftReminderMode || 'disabled'}
                >
                  <View style={styles.radioItem}>
                    <RadioButton value="disabled" />
                    <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
                      Tắt - Không có nhắc nhở hay tự động xoay ca
                    </Text>
                  </View>

                  <View style={styles.radioItem}>
                    <RadioButton value="ask_weekly" />
                    <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
                      Nhắc nhở hàng tuần - Nhắc kiểm tra và thay đổi ca cuối tuần
                    </Text>
                  </View>

                  <View style={styles.radioItem}>
                    <RadioButton value="rotate" />
                    <Text style={[styles.radioLabel, { color: theme.colors.onSurface }]}>
                      Tự động xoay ca - Tự động thay đổi ca theo tần suất
                    </Text>
                  </View>
                </RadioButton.Group>
              </View>

              {/* Rotation Configuration - Only show when rotate mode is selected */}
              {settings?.changeShiftReminderMode === 'rotate' && (
                <View style={styles.rotationConfig}>
                  <Divider style={styles.divider} />

                  <Text style={[styles.configTitle, { color: theme.colors.onSurface }]}>
                    Cấu hình xoay ca tự động:
                  </Text>

                  {/* Select Rotation Shifts Button */}
                  <Button
                    mode="outlined"
                    onPress={handleSelectRotationShifts}
                    style={styles.configButton}
                    icon="clock-outline"
                  >
                    Chọn Ca Xoay Vòng ({settings.rotationConfig?.rotationShifts?.length || 0}/3)
                  </Button>

                  {/* Show selected shifts */}
                  {settings.rotationConfig?.rotationShifts && settings.rotationConfig.rotationShifts.length > 0 && (
                    <View style={styles.selectedShifts}>
                      <Text style={[styles.selectedLabel, { color: theme.colors.onSurfaceVariant }]}>
                        Ca đã chọn:
                      </Text>
                      <View style={styles.shiftChips}>
                        {settings.rotationConfig.rotationShifts.map((shiftId, index) => {
                          const shift = state.shifts.find(s => s.id === shiftId);
                          const isActive = index === settings.rotationConfig?.currentRotationIndex;
                          return (
                            <Chip
                              key={shiftId}
                              mode={isActive ? "flat" : "outlined"}
                              style={[
                                styles.shiftChip,
                                isActive && { backgroundColor: theme.colors.primaryContainer }
                              ]}
                              textStyle={isActive ? { color: theme.colors.onPrimaryContainer } : undefined}
                            >
                              {shift?.name || 'Ca không tồn tại'}
                              {isActive && ' (Hiện tại)'}
                            </Chip>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Frequency Selection */}
                  <View style={styles.frequencySection}>
                    <Text style={[styles.frequencyLabel, { color: theme.colors.onSurface }]}>
                      Tần suất xoay ca:
                    </Text>
                    <Menu
                      visible={frequencyMenuVisible}
                      onDismiss={() => setFrequencyMenuVisible(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={() => setFrequencyMenuVisible(true)}
                          style={styles.frequencyButton}
                          icon="calendar"
                        >
                          {(() => {
                            switch (settings.rotationConfig?.rotationFrequency) {
                              case 'weekly': return 'Sau 1 tuần';
                              case 'biweekly': return 'Sau 2 tuần';
                              case 'triweekly': return 'Sau 3 tuần';
                              case 'monthly': return 'Sau 1 tháng';
                              default: return 'Chọn tần suất';
                            }
                          })()}
                        </Button>
                      }
                    >
                      <Menu.Item
                        onPress={() => handleFrequencyChange('weekly')}
                        title="Sau 1 tuần"
                      />
                      <Menu.Item
                        onPress={() => handleFrequencyChange('biweekly')}
                        title="Sau 2 tuần"
                      />
                      <Menu.Item
                        onPress={() => handleFrequencyChange('triweekly')}
                        title="Sau 3 tuần"
                      />
                      <Menu.Item
                        onPress={() => handleFrequencyChange('monthly')}
                        title="Sau 1 tháng"
                      />
                    </Menu>
                  </View>

                  {/* Last Applied Date Info */}
                  {settings.rotationConfig?.rotationLastAppliedDate && (
                    <Text style={[styles.lastAppliedText, { color: theme.colors.onSurfaceVariant }]}>
                      Lần xoay cuối: {new Date(settings.rotationConfig.rotationLastAppliedDate).toLocaleDateString('vi-VN')}
                    </Text>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Existing shift list */}
        {state.shifts.length > 0 ? (
          state.shifts.map(renderShiftItem)
        ) : (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                Chưa có ca làm việc nào. Hãy tạo ca đầu tiên!
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('AddEditShift')}
                style={styles.createFirstButton}
              >
                Tạo ca đầu tiên
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {isRotationMode && selectedShifts.length >= 2 && (
        <View style={styles.bottomActions}>
          <Button
            mode="contained"
            onPress={handleConfirmRotation}
            style={styles.confirmButton}
          >
            Xác nhận cấu hình xoay ca
          </Button>
        </View>
      )}

      {!isRotationMode && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('AddEditShift')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoCard: {
    margin: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  shiftCard: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activeChip: {
    alignSelf: 'flex-start',
  },
  selectedChip: {
    alignSelf: 'flex-start',
  },
  shiftActions: {
    flexDirection: 'row',
  },
  shiftDetails: {
    marginBottom: 16,
  },
  shiftTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  shiftDays: {
    fontSize: 12,
    marginBottom: 4,
  },
  nightShift: {
    fontSize: 12,
    marginBottom: 4,
  },
  punchRequired: {
    fontSize: 12,
    marginBottom: 4,
  },
  selectButton: {
    marginTop: 8,
  },
  emptyCard: {
    marginVertical: 32,
    borderRadius: 12,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  createFirstButton: {
    marginTop: 8,
  },
  bottomActions: {
    padding: 16,
  },
  confirmButton: {
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modeSection: {
    marginBottom: 16,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  rotationConfig: {
    marginTop: 16,
  },
  divider: {
    marginVertical: 16,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  configButton: {
    marginBottom: 12,
  },
  selectedShifts: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  shiftChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shiftChip: {
    marginBottom: 4,
  },
  frequencySection: {
    marginBottom: 12,
  },
  frequencyLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  frequencyButton: {
    alignSelf: 'flex-start',
  },
  lastAppliedText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
