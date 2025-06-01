import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Vibration } from 'react-native';
import { Button, Text, IconButton, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../contexts/AppContext';
import { BUTTON_STATES } from '../constants';
import { storageService } from '../services/storage';
import { LoadingOverlay } from './LoadingOverlay';
import { SPACING, BORDER_RADIUS, SCREEN_DIMENSIONS } from '../constants/themes';

interface MultiFunctionButtonProps {
  onPress?: () => void;
}

export function MultiFunctionButton({ onPress }: MultiFunctionButtonProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [isPressed, setIsPressed] = useState(false);
  const [hasTodayLogs, setHasTodayLogs] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const buttonConfig = BUTTON_STATES[state.currentButtonState];

  // Logic disabled theo thiết kế mới - Chỉ disabled khi processing hoặc đã hoàn tất
  const isDisabled = isProcessing || state.currentButtonState === 'completed_day';

  // Check if there are attendance logs for today
  useEffect(() => {
    checkTodayLogs();
  }, [state.currentButtonState]);

  const checkTodayLogs = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logs = await storageService.getAttendanceLogsForDate(today);
      setHasTodayLogs(logs.length > 0);
    } catch (error) {
      console.error('Error checking today logs:', error);
      setHasTodayLogs(false);
    }
  };

  // Kiểm tra xem có cần xác nhận không (bấm không đúng thời gian)
  const checkIfNeedsConfirmation = async (): Promise<boolean> => {
    if (!state.activeShift) return false;

    const now = new Date();
    const currentState = state.currentButtonState;

    // Chỉ cần xác nhận cho một số trạng thái nhất định
    if (currentState === 'go_work' || currentState === 'check_in' || currentState === 'check_out') {
      // Logic kiểm tra thời gian phù hợp
      const shift = state.activeShift;
      const startTime = new Date();
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date();
      const [endHour, endMinute] = shift.endTime.split(':').map(Number);
      endTime.setHours(endHour, endMinute, 0, 0);

      // Xử lý ca đêm
      if (shift.isNightShift && endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const timeDiffFromStart = Math.abs(now.getTime() - startTime.getTime()) / (1000 * 60); // phút
      const timeDiffFromEnd = Math.abs(now.getTime() - endTime.getTime()) / (1000 * 60); // phút

      // Cần xác nhận nếu:
      // - Bấm "Đi làm" hoặc "Check-in" quá sớm (>2 giờ trước ca)
      // - Bấm "Check-out" quá sớm (>2 giờ trước kết thúc ca)
      if (currentState === 'go_work' || currentState === 'check_in') {
        return timeDiffFromStart > 120; // 2 giờ
      }

      if (currentState === 'check_out') {
        return timeDiffFromEnd > 120; // 2 giờ
      }
    }

    return false;
  };

  // Hiển thị dialog xác nhận
  const showConfirmationDialog = () => {
    const actionText: Record<string, string> = {
      'go_work': 'đi làm',
      'check_in': 'chấm công vào',
      'check_out': 'chấm công ra',
      'complete': 'hoàn tất',
    };

    const text = actionText[state.currentButtonState] || 'thực hiện hành động';

    Alert.alert(
      '⚠️ Xác nhận hành động',
      `Bạn đang ${text} không đúng thời gian dự kiến. Bạn có chắc chắn muốn tiếp tục không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => {
            setIsPressed(false);
            setIsProcessing(false);
          }
        },
        {
          text: 'Tiếp tục',
          style: 'default',
          onPress: async () => {
            try {
              await actions.handleButtonPress();
              await checkTodayLogs();
              onPress?.();
            } catch (error) {
              console.error('Error in confirmed button press:', error);
              Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
            } finally {
              setIsPressed(false);
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handlePress = async () => {
    if (isDisabled) return;

    try {
      setIsPressed(true);
      setIsProcessing(true);

      // Vibrate if enabled
      if (state.settings?.alarmVibrationEnabled) {
        Vibration.vibrate(100);
      }

      // Kiểm tra xem có phải bấm không đúng thời gian không
      const shouldConfirm = await checkIfNeedsConfirmation();

      if (shouldConfirm) {
        showConfirmationDialog();
        return;
      }

      await actions.handleButtonPress();

      // Refresh logs status after successful button press
      await checkTodayLogs();

      onPress?.();
    } catch (error) {
      console.error('Error in button press:', error);

      // Kiểm tra nếu là RapidPressDetectedException
      if (error instanceof Error && error.name === 'RapidPressDetectedException') {
        const rapidError = error as any; // Type assertion để truy cập properties
        const durationText = rapidError.actualDurationSeconds < 60
          ? `${Math.round(rapidError.actualDurationSeconds)} giây`
          : `${Math.round(rapidError.actualDurationSeconds / 60 * 10) / 10} phút`;

        Alert.alert(
          '⚡ Phát hiện "Bấm Nhanh"',
          `Bạn đã thực hiện check-in và check-out trong thời gian rất ngắn (${durationText}).\n\n` +
          'Bạn có muốn xác nhận và tính đủ công theo lịch trình ca không?',
          [
            {
              text: 'Hủy',
              style: 'cancel',
              onPress: () => {
                console.log('❌ Người dùng hủy xác nhận bấm nhanh');
              }
            },
            {
              text: 'Xác nhận',
              style: 'default',
              onPress: async () => {
                try {
                  await actions.handleRapidPressConfirmed(
                    rapidError.checkInTime,
                    rapidError.checkOutTime
                  );

                  // Refresh logs status after confirmation
                  await checkTodayLogs();

                  Alert.alert(
                    'Thành công',
                    'Đã xác nhận và tính đủ công theo lịch trình ca.',
                    [{ text: 'OK' }]
                  );

                  onPress?.();
                } catch (confirmError) {
                  console.error('Error confirming rapid press:', confirmError);
                  Alert.alert(
                    'Lỗi',
                    'Không thể xác nhận. Vui lòng thử lại.',
                    [{ text: 'OK' }]
                  );
                }
              }
            }
          ]
        );
      } else {
        // Lỗi khác
        Alert.alert(
          'Lỗi',
          'Có lỗi xảy ra khi thực hiện thao tác. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsPressed(false);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Xác nhận Reset',
      'Bạn có muốn reset lại trạng thái chấm công hôm nay không? Mọi dữ liệu bấm nút hôm nay sẽ bị xóa.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 MultiFunctionButton: Starting manual reset');

              // Thực hiện reset
              await actions.resetDailyStatus();

              // Đợi một chút để đảm bảo reset hoàn tất
              await new Promise(resolve => setTimeout(resolve, 200));

              console.log('🔄 MultiFunctionButton: Refreshing all states after reset');

              // Refresh tất cả state liên quan - tuần tự để đảm bảo
              await checkTodayLogs();
              await actions.refreshButtonState();
              await actions.refreshWeeklyStatus();
              await actions.refreshTimeDisplayInfo();

              // Đợi thêm một chút để UI cập nhật
              await new Promise(resolve => setTimeout(resolve, 100));

              console.log(`✅ MultiFunctionButton: Manual reset completed, current button state: ${state.currentButtonState}`);
              Alert.alert('Thành công', 'Đã reset trạng thái chấm công hôm nay.');
            } catch (error) {
              console.error('❌ MultiFunctionButton: Reset failed:', error);
              Alert.alert('Lỗi', 'Không thể reset trạng thái. Vui lòng thử lại.');
            }
          }
        },
      ]
    );
  };

  const getGradientColors = (): [string, string] => {
    const baseColor = buttonConfig.color;
    if (isDisabled) {
      return [theme.colors.surfaceDisabled, theme.colors.surfaceDisabled];
    }
    if (isPressed) {
      return [baseColor, theme.colors.primary];
    }
    return [baseColor, baseColor + '80'];
  };

  // Show reset button theo thiết kế mới: khi đã hoàn tất hoặc có logs
  const showResetButton = state.currentButtonState === 'completed_day' || hasTodayLogs;

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <LinearGradient
          colors={getGradientColors()}
          style={[
            styles.gradient,
            isPressed && styles.pressed,
            isDisabled && styles.disabled,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Button
            mode="contained"
            onPress={handlePress}
            disabled={isDisabled}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={[
              styles.buttonText,
              { color: isDisabled ? theme.colors.onSurfaceDisabled : '#FFFFFF' }
            ]}
          >
            <View style={styles.buttonInner}>
              <MaterialCommunityIcons
                name={buttonConfig.icon as any}
                size={SCREEN_DIMENSIONS.isSmallScreen ? 24 : 28}
                color={isDisabled ? theme.colors.onSurfaceDisabled : '#FFFFFF'}
                style={styles.buttonIcon}
              />
              <Text style={[
                styles.buttonLabel,
                { color: isDisabled ? theme.colors.onSurfaceDisabled : '#FFFFFF' }
              ]}>
                {buttonConfig.text}
              </Text>
            </View>
          </Button>
        </LinearGradient>

        {showResetButton && (
          <IconButton
            icon="restart"
            size={20}
            iconColor={theme.colors.primary}
            style={styles.resetButton}
            onPress={handleReset}
          />
        )}
      </View>

      {/* Punch button theo thiết kế mới: chỉ khi đã check-in và chưa check-out */}
      {state.activeShift?.showPunch &&
       (state.currentButtonState === 'working' || state.currentButtonState === 'awaiting_check_out') && (
        <Button
          mode="outlined"
          onPress={async () => {
            try {
              // Handle punch action
              const today = new Date().toISOString().split('T')[0];
              await storageService.addAttendanceLog(today, {
                type: 'punch',
                time: new Date().toISOString(),
              });

              Alert.alert('Thành công', 'Đã ký công thành công!');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể ký công. Vui lòng thử lại.');
            }
          }}
          style={styles.punchButton}
          contentStyle={styles.punchButtonContent}
          icon="pencil"
        >
          Ký Công
        </Button>
      )}

      {/* Loading overlay for processing state */}
      <LoadingOverlay
        visible={isProcessing}
        message="Đang xử lý chấm công..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  gradient: {
    borderRadius: SCREEN_DIMENSIONS.isSmallScreen ? 50 : 60,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  button: {
    width: SCREEN_DIMENSIONS.isSmallScreen ? 100 : 120,
    height: SCREEN_DIMENSIONS.isSmallScreen ? 100 : 120,
    borderRadius: SCREEN_DIMENSIONS.isSmallScreen ? 50 : 60,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  buttonContent: {
    width: SCREEN_DIMENSIONS.isSmallScreen ? 100 : 120,
    height: SCREEN_DIMENSIONS.isSmallScreen ? 100 : 120,
    borderRadius: SCREEN_DIMENSIONS.isSmallScreen ? 50 : 60,
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonIcon: {
    marginBottom: SPACING.xs,
  },
  buttonLabel: {
    fontSize: SCREEN_DIMENSIONS.isSmallScreen ? 10 : 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonText: {
    fontSize: SCREEN_DIMENSIONS.isSmallScreen ? 10 : 12,
    fontWeight: 'bold',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  disabled: {
    opacity: 0.6,
  },
  resetButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  punchButton: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  punchButtonContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
});

// Simple mode button (just shows "Đi Làm")
export function SimpleMultiFunctionButton({ onPress }: MultiFunctionButtonProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = async () => {
    // Trong mode simple, chỉ cho phép bấm khi trạng thái là 'go_work'
    if (state.currentButtonState !== 'go_work') return;

    try {
      setIsPressed(true);

      if (state.settings?.alarmVibrationEnabled) {
        Vibration.vibrate(100);
      }

      await actions.handleButtonPress();
      onPress?.();
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsPressed(false);
    }
  };

  // Trong mode simple: disabled khi đã bấm (không phải go_work)
  const isDisabled = state.currentButtonState !== 'go_work';
  const buttonConfig = BUTTON_STATES.go_work;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDisabled ?
          [theme.colors.surfaceDisabled, theme.colors.surfaceDisabled] :
          [buttonConfig.color, buttonConfig.color + '80']
        }
        style={[
          styles.gradient,
          isPressed && styles.pressed,
          isDisabled && styles.disabled,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Button
          mode="contained"
          onPress={handlePress}
          disabled={isDisabled}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={[
            styles.buttonText,
            { color: isDisabled ? theme.colors.onSurfaceDisabled : '#FFFFFF' }
          ]}
        >
          <View style={styles.buttonInner}>
            <MaterialCommunityIcons
              name={buttonConfig.icon as any}
              size={SCREEN_DIMENSIONS.isSmallScreen ? 24 : 28}
              color={isDisabled ? theme.colors.onSurfaceDisabled : '#FFFFFF'}
              style={styles.buttonIcon}
            />
            <Text style={[
              styles.buttonLabel,
              { color: isDisabled ? theme.colors.onSurfaceDisabled : '#FFFFFF' }
            ]}>
              {isDisabled ? 'ĐÃ XÁC NHẬN ĐI LÀM' : buttonConfig.text}
            </Text>
          </View>
        </Button>
      </LinearGradient>
    </View>
  );
}
