import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Card,
  List,
  Switch,
  Button,
  Divider,
  useTheme,
  Menu,
  IconButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { LANGUAGES } from '../constants';
import { TabParamList, RootStackParamList } from '../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'SettingsTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  const [modeMenuVisible, setModeMenuVisible] = useState(false);

  // Status messages
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | '';
    message: string;
  }>({ type: '', message: '' });

  // Confirmation states
  const [confirmStates, setConfirmStates] = useState({
    resetWeatherLocation: false,
    resetSampleNotes: false,
    clearAllNotes: false,
  });

  const settings = state.settings;

  if (!settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Đang tải cài đặt...</Text>
      </SafeAreaView>
    );
  }

  const handleBackupData = async () => {
    try {
      setStatusMessage({
        type: 'info',
        message: 'ℹ️ Tính năng sao lưu sẽ được triển khai trong phiên bản tiếp theo.'
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: '❌ Không thể sao lưu dữ liệu.'
      });
    }
  };

  const handleRestoreData = async () => {
    try {
      setStatusMessage({
        type: 'info',
        message: 'ℹ️ Tính năng phục hồi sẽ được triển khai trong phiên bản tiếp theo.'
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: '❌ Không thể phục hồi dữ liệu.'
      });
    }
  };

  const handleResetWeatherLocation = () => {
    setConfirmStates(prev => ({ ...prev, resetWeatherLocation: true }));
  };

  const confirmResetWeatherLocation = async () => {
    try {
      setStatusMessage({ type: '', message: '' });
      await actions.updateSettings({ weatherLocation: null });
      setStatusMessage({
        type: 'success',
        message: '✅ Đã xóa vị trí đã lưu thành công!'
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: '❌ Không thể xóa vị trí. Vui lòng thử lại.'
      });
    }
    setConfirmStates(prev => ({ ...prev, resetWeatherLocation: false }));
  };

  const handleResetSampleNotes = () => {
    setConfirmStates(prev => ({ ...prev, resetSampleNotes: true }));
  };

  const confirmResetSampleNotes = async () => {
    try {
      setStatusMessage({ type: '', message: '' });
      const { resetWithSampleNotes } = await import('../services/sampleData');
      await resetWithSampleNotes();
      setStatusMessage({
        type: 'success',
        message: '✅ Đã thay thế bằng dữ liệu mẫu thành công! Vui lòng khởi động lại ứng dụng để thấy thay đổi.'
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: '❌ Không thể thay thế dữ liệu. Vui lòng thử lại.'
      });
    }
    setConfirmStates(prev => ({ ...prev, resetSampleNotes: false }));
  };

  const handleClearAllNotes = () => {
    setConfirmStates(prev => ({ ...prev, clearAllNotes: true }));
  };

  const confirmClearAllNotes = async () => {
    try {
      setStatusMessage({ type: '', message: '' });
      const { clearAllNotes } = await import('../services/sampleData');
      await clearAllNotes();
      setStatusMessage({
        type: 'success',
        message: '✅ Đã xóa tất cả ghi chú thành công! Vui lòng khởi động lại ứng dụng để thấy thay đổi.'
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: '❌ Không thể xóa ghi chú. Vui lòng thử lại.'
      });
    }
    setConfirmStates(prev => ({ ...prev, clearAllNotes: false }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={{ width: 48 }} />
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          Cài đặt
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* General Settings */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Cài đặt chung
            </Text>

            <List.Item
              title="Ngôn ngữ"
              description={LANGUAGES[settings.language as keyof typeof LANGUAGES]}
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={() => (
                <Menu
                  visible={languageMenuVisible}
                  onDismiss={() => setLanguageMenuVisible(false)}
                  anchor={
                    <IconButton
                      icon="chevron-down"
                      onPress={() => setLanguageMenuVisible(true)}
                    />
                  }
                >
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <Menu.Item
                      key={code}
                      onPress={() => {
                        actions.updateSettings({ language: code });
                        setLanguageMenuVisible(false);
                      }}
                      title={name}
                    />
                  ))}
                </Menu>
              )}
            />

            <List.Item
              title="Giao diện"
              description={settings.theme === 'dark' ? 'Tối' : 'Sáng'}
              left={(props) => <List.Icon {...props} icon="palette" />}
              right={() => (
                <Switch
                  value={settings.theme === 'dark'}
                  onValueChange={(value) =>
                    actions.updateSettings({ theme: value ? 'dark' : 'light' })
                  }
                />
              )}
            />

            <List.Item
              title="Chế độ nút đa năng"
              description={settings.multiButtonMode === 'full' ? 'Đầy đủ' : 'Đơn giản'}
              left={(props) => <List.Icon {...props} icon="gesture-tap-button" />}
              right={() => (
                <Menu
                  visible={modeMenuVisible}
                  onDismiss={() => setModeMenuVisible(false)}
                  anchor={
                    <IconButton
                      icon="chevron-down"
                      onPress={() => setModeMenuVisible(true)}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      actions.updateSettings({ multiButtonMode: 'full' });
                      setModeMenuVisible(false);
                    }}
                    title="Đầy đủ"
                  />
                  <Menu.Item
                    onPress={() => {
                      actions.updateSettings({ multiButtonMode: 'simple' });
                      setModeMenuVisible(false);
                    }}
                    title="Đơn giản"
                  />
                </Menu>
              )}
            />
          </Card.Content>
        </Card>

        {/* Shift Management */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Quản lý ca làm việc
            </Text>

            <List.Item
              title="Quản lý ca"
              description={`Ca hiện tại: ${state.activeShift?.name || 'Chưa chọn'}`}
              left={(props) => <List.Icon {...props} icon="clock-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('ShiftsTab')}
            />
          </Card.Content>
        </Card>

        {/* Notifications */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Nhắc nhở & Báo thức
            </Text>

            <List.Item
              title="Âm thanh báo thức"
              left={(props) => <List.Icon {...props} icon="volume-high" />}
              right={() => (
                <Switch
                  value={settings.alarmSoundEnabled}
                  onValueChange={(value) =>
                    actions.updateSettings({ alarmSoundEnabled: value })
                  }
                />
              )}
            />

            <List.Item
              title="Rung báo thức"
              left={(props) => <List.Icon {...props} icon="vibrate" />}
              right={() => (
                <Switch
                  value={settings.alarmVibrationEnabled}
                  onValueChange={(value) =>
                    actions.updateSettings({ alarmVibrationEnabled: value })
                  }
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Weather */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Thời tiết
            </Text>

            <List.Item
              title="Cảnh báo thời tiết"
              left={(props) => <List.Icon {...props} icon="weather-partly-cloudy" />}
              right={() => (
                <Switch
                  value={settings.weatherWarningEnabled}
                  onValueChange={(value) =>
                    actions.updateSettings({ weatherWarningEnabled: value })
                  }
                />
              )}
            />

            {settings.weatherLocation && (
              <List.Item
                title="Quản lý vị trí"
                description={`Đã lưu ${settings.weatherLocation.home ? 'vị trí nhà' : ''}${settings.weatherLocation.home && settings.weatherLocation.work ? ' và ' : ''}${settings.weatherLocation.work ? 'vị trí công ty' : ''}`}
                left={(props) => <List.Icon {...props} icon="map-marker" />}
                right={(props) => <List.Icon {...props} icon="delete" />}
                onPress={handleResetWeatherLocation}
              />
            )}
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Quản lý dữ liệu
            </Text>

            <List.Item
              title="Sao lưu dữ liệu"
              left={(props) => <List.Icon {...props} icon="backup-restore" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleBackupData}
            />

            <List.Item
              title="Phục hồi dữ liệu"
              left={(props) => <List.Icon {...props} icon="restore" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleRestoreData}
            />
          </Card.Content>
        </Card>

        {/* Developer/Debug */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Dữ liệu mẫu (Debug)
            </Text>

            <List.Item
              title="Thay thế bằng dữ liệu mẫu"
              description={`Hiện có ${state.notes.length} ghi chú`}
              left={(props) => <List.Icon {...props} icon="database-refresh" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleResetSampleNotes}
            />

            <List.Item
              title="Xóa tất cả ghi chú"
              description="Xóa toàn bộ dữ liệu ghi chú"
              left={(props) => <List.Icon {...props} icon="delete-sweep" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleClearAllNotes}
            />
          </Card.Content>
        </Card>

        {/* Other */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Khác
            </Text>

            <List.Item
              title="Thống kê"
              left={(props) => <List.Icon {...props} icon="chart-line" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('StatisticsTab')}
            />

            <List.Item
              title="Thông tin ứng dụng"
              description="Phiên bản 1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
          </Card.Content>
        </Card>

        {/* Status Messages */}
        {statusMessage.message && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[
                styles.statusMessage,
                {
                  color: statusMessage.type === 'success'
                    ? theme.colors.primary
                    : statusMessage.type === 'error'
                    ? theme.colors.error
                    : theme.colors.onSurface
                }
              ]}>
                {statusMessage.message}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Confirmation Dialogs */}
        {confirmStates.resetWeatherLocation && (
          <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={[styles.confirmTitle, { color: theme.colors.onErrorContainer }]}>
                ⚠️ Xác nhận xóa vị trí
              </Text>
              <Text style={[styles.confirmMessage, { color: theme.colors.onErrorContainer }]}>
                Bạn có muốn xóa vị trí đã lưu không?
                {'\n'}Ứng dụng sẽ yêu cầu xác định vị trí lại khi bạn sử dụng tính năng chấm công.
              </Text>
              <View style={styles.confirmActions}>
                <Button
                  mode="outlined"
                  onPress={() => setConfirmStates(prev => ({ ...prev, resetWeatherLocation: false }))}
                  style={styles.cancelButton}
                  textColor={theme.colors.onErrorContainer}
                >
                  Hủy
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmResetWeatherLocation}
                  style={[styles.confirmButton, { backgroundColor: theme.colors.error }]}
                  textColor={theme.colors.onError}
                >
                  Xóa
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {confirmStates.resetSampleNotes && (
          <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={[styles.confirmTitle, { color: theme.colors.onErrorContainer }]}>
                ⚠️ Xác nhận thay thế dữ liệu
              </Text>
              <Text style={[styles.confirmMessage, { color: theme.colors.onErrorContainer }]}>
                Bạn có muốn thay thế tất cả ghi chú hiện tại bằng dữ liệu mẫu không?
                {'\n'}Hành động này không thể hoàn tác.
              </Text>
              <View style={styles.confirmActions}>
                <Button
                  mode="outlined"
                  onPress={() => setConfirmStates(prev => ({ ...prev, resetSampleNotes: false }))}
                  style={styles.cancelButton}
                  textColor={theme.colors.onErrorContainer}
                >
                  Hủy
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmResetSampleNotes}
                  style={[styles.confirmButton, { backgroundColor: theme.colors.error }]}
                  textColor={theme.colors.onError}
                >
                  Thay thế
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {confirmStates.clearAllNotes && (
          <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={[styles.confirmTitle, { color: theme.colors.onErrorContainer }]}>
                ⚠️ Xác nhận xóa tất cả
              </Text>
              <Text style={[styles.confirmMessage, { color: theme.colors.onErrorContainer }]}>
                Bạn có muốn xóa tất cả ghi chú không?
                {'\n'}Hành động này không thể hoàn tác.
              </Text>
              <View style={styles.confirmActions}>
                <Button
                  mode="outlined"
                  onPress={() => setConfirmStates(prev => ({ ...prev, clearAllNotes: false }))}
                  style={styles.cancelButton}
                  textColor={theme.colors.onErrorContainer}
                >
                  Hủy
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmClearAllNotes}
                  style={[styles.confirmButton, { backgroundColor: theme.colors.error }]}
                  textColor={theme.colors.onError}
                >
                  Xóa tất cả
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: 'transparent',
  },
  confirmButton: {
    flex: 1,
  },
});
