import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
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
      Alert.alert('Sao lưu dữ liệu', 'Tính năng sao lưu sẽ được triển khai trong phiên bản tiếp theo.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể sao lưu dữ liệu.');
    }
  };

  const handleRestoreData = async () => {
    try {
      Alert.alert('Phục hồi dữ liệu', 'Tính năng phục hồi sẽ được triển khai trong phiên bản tiếp theo.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể phục hồi dữ liệu.');
    }
  };

  const handleResetWeatherLocation = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có muốn xóa vị trí đã lưu? Ứng dụng sẽ yêu cầu xác định vị trí lại khi bạn sử dụng tính năng chấm công.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await actions.updateSettings({ weatherLocation: null });
              Alert.alert('Thành công', 'Đã xóa vị trí đã lưu.');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa vị trí.');
            }
          }
        }
      ]
    );
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
});
