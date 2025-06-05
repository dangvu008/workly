/**
 * ✅ IconLoadingFallback - Component fallback khi icons đang load
 * Cung cấp trải nghiệm mượt mà khi icons chưa sẵn sàng
 */

import React from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { useTheme } from 'react-native-paper';

interface IconLoadingFallbackProps {
  size?: number;
  color?: string;
  style?: any;
  animated?: boolean;
}

export function IconLoadingFallback({
  size = 24,
  color,
  style,
  animated = true,
}: IconLoadingFallbackProps) {
  const theme = useTheme();
  const fallbackColor = color || theme.colors.onSurfaceDisabled;
  
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      animation.start();
      
      return () => animation.stop();
    }
  }, [animated, animatedValue]);

  const opacity = animated ? animatedValue : 1;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          opacity,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.placeholder,
          {
            width: size * 0.8,
            height: size * 0.8,
            backgroundColor: fallbackColor,
            borderRadius: size * 0.1,
          },
        ]}
      />
    </Animated.View>
  );
}

/**
 * ✅ SimpleIconFallback - Fallback đơn giản không animation
 */
export function SimpleIconFallback({
  size = 24,
  color,
  style,
}: Omit<IconLoadingFallbackProps, 'animated'>) {
  const theme = useTheme();
  const fallbackColor = color || theme.colors.onSurfaceDisabled;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.simplePlaceholder,
          {
            width: size * 0.6,
            height: size * 0.6,
            backgroundColor: fallbackColor,
            borderRadius: size * 0.3,
          },
        ]}
      />
    </View>
  );
}

/**
 * ✅ TextIconFallback - Fallback với text
 */
export function TextIconFallback({
  size = 24,
  color,
  style,
  text = '•',
}: IconLoadingFallbackProps & { text?: string }) {
  const theme = useTheme();
  const fallbackColor = color || theme.colors.onSurfaceDisabled;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.fallbackText,
          {
            fontSize: size * 0.6,
            color: fallbackColor,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

/**
 * ✅ SkeletonIcon - Skeleton loading cho icon
 */
export function SkeletonIcon({
  size = 24,
  style,
}: Pick<IconLoadingFallbackProps, 'size' | 'style'>) {
  const theme = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    
    animation.start();
    
    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surfaceVariant, theme.colors.outline],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor,
          borderRadius: size * 0.2,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    // Basic placeholder styles
  },
  simplePlaceholder: {
    // Simple placeholder styles
  },
  fallbackText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
