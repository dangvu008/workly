import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Card, Text, Button, useTheme, IconButton, Chip } from 'react-native-paper';
import { notificationService } from '../services/notifications';

interface NotificationStatusCardProps {
  onDismiss?: () => void;
  showTestButton?: boolean;
}

export function NotificationStatusCard({ onDismiss, showTestButton = true }: NotificationStatusCardProps) {
  const theme = useTheme();
  const [status, setStatus] = useState<{
    isSupported: boolean;
    isExpoGo: boolean;
    hasPermission: boolean;
    platform: string;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      setIsLoading(true);
      const notificationStatus = await notificationService.checkNotificationSupport();
      setStatus(notificationStatus);
    } catch (error) {
      console.error('Error checking notification status:', error);
      setStatus({
        isSupported: false,
        isExpoGo: false,
        hasPermission: false,
        platform: 'unknown',
        message: 'Không thể kiểm tra trạng thái notifications'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setIsTestingNotification(true);
      await notificationService.testNotification();
    } catch (error) {
      console.error('Error testing notification:', error);
    } finally {
      setIsTestingNotification(false);
    }
  };

  const openDevelopmentBuildGuide = () => {
    Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/');
  };

  const openNotificationSettings = () => {
    if (status?.platform === 'android') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openURL('app-settings:');
    }
  };

  if (isLoading) {
    return (
      <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={{ color: theme.colors.onSurface }}>
            Đang kiểm tra trạng thái notifications...
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusColor = () => {
    if (status.isSupported && status.hasPermission) {
      return theme.colors.primary;
    } else if (status.isExpoGo) {
      return theme.colors.tertiary;
    } else {
      return theme.colors.error;
    }
  };

  const getStatusIcon = () => {
    if (status.isSupported && status.hasPermission) {
      return 'check-circle';
    } else if (status.isExpoGo) {
      return 'information';
    } else {
      return 'alert-circle';
    }
  };

  const getStatusText = () => {
    if (status.isSupported && status.hasPermission) {
      return 'Hoạt động tốt';
    } else if (status.isExpoGo) {
      return 'Hạn chế trong Expo Go';
    } else {
      return 'Cần cấu hình';
    }
  };

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Trạng thái Notifications
            </Text>
            <Chip
              icon={getStatusIcon()}
              style={[styles.statusChip, { backgroundColor: getStatusColor() + '20' }]}
              textStyle={{ color: getStatusColor(), fontSize: 12 }}
            >
              {getStatusText()}
            </Chip>
          </View>
          {onDismiss && (
            <IconButton
              icon="close"
              size={20}
              onPress={onDismiss}
            />
          )}
        </View>

        <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
          {status.message}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              Platform:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              {status.platform.toUpperCase()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              Môi trường:
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              {status.isExpoGo ? 'Expo Go' : 'Development Build'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              Quyền:
            </Text>
            <Text style={[styles.detailValue, { color: status.hasPermission ? theme.colors.primary : theme.colors.error }]}>
              {status.hasPermission ? 'Đã cấp' : 'Chưa cấp'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {/* Nút Test Notification */}
          {showTestButton && status.isSupported && (
            <Button
              mode="outlined"
              onPress={handleTestNotification}
              loading={isTestingNotification}
              disabled={isTestingNotification}
              style={styles.actionButton}
            >
              Test Notification
            </Button>
          )}

          {/* Nút mở Settings nếu chưa có quyền */}
          {!status.hasPermission && (
            <Button
              mode="contained"
              onPress={openNotificationSettings}
              style={styles.actionButton}
            >
              Mở Cài đặt
            </Button>
          )}

          {/* Nút hướng dẫn Development Build nếu đang dùng Expo Go */}
          {status.isExpoGo && status.platform === 'android' && (
            <Button
              mode="contained"
              onPress={openDevelopmentBuildGuide}
              style={styles.actionButton}
            >
              Hướng dẫn Dev Build
            </Button>
          )}

          {/* Nút refresh status */}
          <Button
            mode="text"
            onPress={checkNotificationStatus}
            style={styles.actionButton}
          >
            Kiểm tra lại
          </Button>
        </View>

        {/* Thông tin bổ sung cho Expo Go */}
        {status.isExpoGo && (
          <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.onSurfaceVariant }]}>
              💡 Lưu ý về Expo Go:
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
              • Local notifications vẫn hoạt động bình thường{'\n'}
              • Push notifications bị hạn chế trên Android{'\n'}
              • Để có đầy đủ tính năng, hãy sử dụng development build
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusChip: {
    height: 24,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
