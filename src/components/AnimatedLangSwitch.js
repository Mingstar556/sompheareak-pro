import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';

export const AnimatedLangSwitch = ({ lang, onToggle, theme, size = 'default' }) => {
  const isKhmer = lang === 'km';
  const animValue = useRef(new Animated.Value(isKhmer ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isKhmer ? 0 : 1,
      tension: 100,
      friction: 12,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isKhmer, animValue]);

  // Clean, small, centered toggle (not oversized, neat and simple)
  const isSmall = size === 'small';
  const trackWidth = isSmall ? 48 : 58;
  const trackHeight = isSmall ? 24 : 26;
  const thumbWidth = isSmall ? 23 : 27;
  const thumbHeight = isSmall ? 20 : 22;
  const travel = trackWidth - thumbWidth - 4;

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, travel],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      style={[
        styles.track,
        {
          width: trackWidth,
          height: trackHeight,
          borderRadius: trackHeight / 2,
          backgroundColor: theme?.inputBg || 'rgba(255, 255, 255, 0.08)',
          borderColor: theme?.border || 'rgba(255, 255, 255, 0.15)',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Current language is ${isKhmer ? 'Khmer' : 'English'}. Tap to switch.`}
    >
      {/* Sliding Active Pill */}
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbWidth,
            height: thumbHeight,
            borderRadius: thumbHeight / 2,
            backgroundColor: theme?.primary || '#10b981',
            transform: [{ translateX }],
          },
        ]}
      />

      {/* Centered Labels */}
      <View style={styles.labelsRow}>
        <View style={styles.labelSlot}>
          <Text
            style={[
              styles.labelText,
              {
                color: isKhmer ? '#ffffff' : (theme?.textMuted || '#94a3b8'),
                fontWeight: isKhmer ? '800' : '600',
              },
            ]}
          >
            🇰🇭
          </Text>
        </View>
        <View style={styles.labelSlot}>
          <Text
            style={[
              styles.labelText,
              {
                color: !isKhmer ? '#ffffff' : (theme?.textMuted || '#94a3b8'),
                fontWeight: !isKhmer ? '800' : '600',
              },
            ]}
          >
            🇬🇧
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 2,
  },
  labelSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 10.5,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
