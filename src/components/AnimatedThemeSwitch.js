import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';

export const AnimatedThemeSwitch = ({ themeMode, onToggle, theme, size = 'default' }) => {
  const isDark = themeMode === 'dark';
  const animValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isDark ? 1 : 0,
      tension: 68,
      friction: 10,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isDark, animValue]);

  const isSmall = size === 'small';
  const trackWidth = isSmall ? 48 : 70;
  const trackHeight = isSmall ? 24 : 32;
  const thumbSize = isSmall ? 20 : 26;
  const travelDistance = trackWidth - thumbSize - 4;

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, travelDistance],
  });

  const thumbRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const trackBg = isDark ? '#161b2e' : '#f1f5f9';
  const trackBorder = isDark ? 'rgba(234, 179, 8, 0.35)' : 'rgba(15, 23, 42, 0.15)';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onToggle}
      style={[
        styles.track,
        {
          width: trackWidth,
          height: trackHeight,
          borderRadius: trackHeight / 2,
          backgroundColor: trackBg,
          borderColor: trackBorder,
        },
      ]}
      accessibilityRole="switch"
      accessibilityLabel={`Current theme is ${themeMode}. Switch theme.`}
    >
      <View style={styles.iconsRow}>
        <Text style={[styles.iconText, { fontSize: isSmall ? 12 : 14, opacity: isDark ? 0.45 : 1 }]}>
          ☀️
        </Text>
        <Text style={[styles.iconText, { fontSize: isSmall ? 12 : 14, opacity: isDark ? 1 : 0.45 }]}>
          🌙
        </Text>
      </View>

      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            transform: [
              { translateX },
              { rotate: thumbRotate },
            ],
            backgroundColor: isDark ? '#f59e0b' : '#059669',
            shadowColor: isDark ? '#f59e0b' : '#059669',
          },
        ]}
      >
        <Text style={{ fontSize: isSmall ? 11 : 13 }}>
          {isDark ? '🌙' : '☀️'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    borderWidth: 1.5,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    alignItems: 'center',
    width: '100%',
  },
  iconText: {
    userSelect: 'none',
  },
  thumb: {
    position: 'absolute',
    top: 2,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
});
