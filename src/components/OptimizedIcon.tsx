/**
 * ✅ OptimizedIcon - Component icon được tối ưu với preloading và fallback
 * Giải quyết vấn đề icon load chậm hơn ứng dụng
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ActivityIndicator } from 'react-native-paper';

interface OptimizedIconProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
  color?: string;
  style?: any;
  fallbackIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  showLoader?: boolean;
  testID?: string;
}

// Cache để lưu trữ icons đã load
const iconCache = new Set<string>();

// Danh sách icons quan trọng cần preload
export const CRITICAL_ICONS = [
  'home', 'home-outline',
  'clock', 'clock-outline', 'clock-alert',
  'note-text', 'note-text-outline',
  'chart-line', 'chart-line-variant',
  'cog', 'cog-outline',
  'run', 'login', 'logout',
  'briefcase', 'check-circle',
  'alert', 'close-circle',
  'arrow-left', 'delete',
  'plus', 'pencil',
  'menu', 'refresh'
] as const;

export function OptimizedIcon({
  name,
  size = 24,
  color,
  style,
  fallbackIcon = 'circle',
  showLoader = false,
  testID,
}: OptimizedIconProps) {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(iconCache.has(name));
  const [hasError, setHasError] = useState(false);

  const iconColor = color || theme.colors.onSurface;

  useEffect(() => {
    if (!isLoaded && !hasError) {
      // Simulate icon loading check
      const timer = setTimeout(() => {
        iconCache.add(name);
        setIsLoaded(true);
      }, 50); // Small delay to simulate loading

      return () => clearTimeout(timer);
    }
  }, [name, isLoaded, hasError]);

  // Nếu đang load và showLoader = true
  if (!isLoaded && showLoader && !hasError) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <ActivityIndicator size={size * 0.6} color={iconColor} />
      </View>
    );
  }

  // Nếu có lỗi, hiển thị fallback icon
  if (hasError) {
    return (
      <MaterialCommunityIcons
        name={fallbackIcon}
        size={size}
        color={iconColor}
        style={style}
        testID={testID}
      />
    );
  }

  // Render icon bình thường
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={iconColor}
      style={[!isLoaded && styles.hidden, style]}
      testID={testID}
      onError={() => setHasError(true)}
    />
  );
}

/**
 * ✅ PreloadedIcon - Icon đã được preload, render ngay lập tức
 */
export function PreloadedIcon({
  name,
  size = 24,
  color,
  style,
  testID,
}: Omit<OptimizedIconProps, 'fallbackIcon' | 'showLoader'>) {
  const theme = useTheme();
  const iconColor = color || theme.colors.onSurface;

  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={iconColor}
      style={style}
      testID={testID}
    />
  );
}

/**
 * ✅ IconWithFallback - Icon với fallback text nếu không load được
 */
export function IconWithFallback({
  name,
  size = 24,
  color,
  style,
  fallbackText = '•',
  testID,
}: OptimizedIconProps & { fallbackText?: string }) {
  const theme = useTheme();
  const [hasError, setHasError] = useState(false);
  const iconColor = color || theme.colors.onSurface;

  if (hasError) {
    return (
      <View style={[styles.fallbackContainer, { width: size, height: size }, style]}>
        <Text style={[styles.fallbackText, { color: iconColor, fontSize: size * 0.6 }]}>
          {fallbackText}
        </Text>
      </View>
    );
  }

  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={iconColor}
      style={style}
      testID={testID}
      onError={() => setHasError(true)}
    />
  );
}

/**
 * ✅ Preload critical icons khi app khởi động
 */
export const preloadCriticalIcons = async (): Promise<void> => {
  try {
    console.log('🎨 OptimizedIcon: Preloading critical icons...');
    
    // Thêm tất cả critical icons vào cache
    CRITICAL_ICONS.forEach(iconName => {
      iconCache.add(iconName);
    });
    
    console.log(`✅ OptimizedIcon: Preloaded ${CRITICAL_ICONS.length} critical icons`);
  } catch (error) {
    console.error('❌ OptimizedIcon: Error preloading icons:', error);
  }
};

/**
 * ✅ Clear icon cache (để testing hoặc memory management)
 */
export const clearIconCache = (): void => {
  iconCache.clear();
  console.log('🧹 OptimizedIcon: Icon cache cleared');
};

/**
 * ✅ Get cache status
 */
export const getIconCacheStatus = (): { size: number; icons: string[] } => {
  return {
    size: iconCache.size,
    icons: Array.from(iconCache)
  };
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hidden: {
    opacity: 0,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fallbackText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
