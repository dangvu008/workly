/**
 * ✅ OptimizedIconButton - IconButton được tối ưu với preloaded icons
 * Thay thế cho react-native-paper IconButton để cải thiện performance
 */

import React, { memo } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { OptimizedIcon, PreloadedIcon, CRITICAL_ICONS } from './OptimizedIcon';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface OptimizedIconButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
  iconColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  delayPressIn?: number;
  delayPressOut?: number;
}

export const OptimizedIconButton = memo<OptimizedIconButtonProps>(({
  icon,
  size = 24,
  iconColor,
  onPress,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
  delayPressIn = 0,
  delayPressOut = 100,
}) => {
  const theme = useTheme();
  
  const buttonSize = size + 16; // Padding around icon
  const finalIconColor = iconColor || (disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface);
  
  // Sử dụng PreloadedIcon cho critical icons, OptimizedIcon cho các icon khác
  const isCriticalIcon = CRITICAL_ICONS.includes(icon as any);
  
  const IconComponent = isCriticalIcon ? PreloadedIcon : OptimizedIcon;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: buttonSize,
          height: buttonSize,
          backgroundColor: disabled ? 'transparent' : 'transparent',
        },
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      delayPressIn={delayPressIn}
      delayPressOut={delayPressOut}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <IconComponent
        name={icon}
        size={size}
        color={finalIconColor}
        style={styles.icon}
      />
    </TouchableOpacity>
  );
});

OptimizedIconButton.displayName = 'OptimizedIconButton';

/**
 * ✅ FastIconButton - Icon button với minimal overhead cho critical actions
 */
export const FastIconButton = memo<OptimizedIconButtonProps>(({
  icon,
  size = 24,
  iconColor,
  onPress,
  disabled = false,
  style,
  testID,
}) => {
  const theme = useTheme();
  const buttonSize = size + 12; // Smaller padding for fast button
  const finalIconColor = iconColor || (disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface);

  return (
    <TouchableOpacity
      style={[
        styles.fastButton,
        {
          width: buttonSize,
          height: buttonSize,
        },
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      testID={testID}
      activeOpacity={disabled ? 1 : 0.8}
    >
      <PreloadedIcon
        name={icon}
        size={size}
        color={finalIconColor}
      />
    </TouchableOpacity>
  );
});

FastIconButton.displayName = 'FastIconButton';

/**
 * ✅ TabBarIcon - Optimized icon cho tab navigation
 */
export const TabBarIcon = memo<{
  focused: boolean;
  color: string;
  size: number;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
}>(({ focused, color, size, iconName }) => {
  return (
    <PreloadedIcon
      name={iconName}
      size={size}
      color={color}
      style={[
        styles.tabIcon,
        focused && styles.tabIconFocused
      ]}
    />
  );
});

TabBarIcon.displayName = 'TabBarIcon';

/**
 * ✅ StatusIcon - Icon cho status display với color coding
 */
export const StatusIcon = memo<{
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  size?: number;
  style?: ViewStyle;
}>(({ icon, color, size = 20, style }) => {
  return (
    <PreloadedIcon
      name={icon}
      size={size}
      color={color}
      style={[styles.statusIcon, style]}
    />
  );
});

StatusIcon.displayName = 'StatusIcon';

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  fastButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  icon: {
    // Icon styles if needed
  },
  tabIcon: {
    // Tab icon styles
  },
  tabIconFocused: {
    // Focused tab icon styles
    transform: [{ scale: 1.1 }],
  },
  statusIcon: {
    // Status icon styles
  },
});
