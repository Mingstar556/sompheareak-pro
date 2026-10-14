import React, { useRef } from 'react';
import { Animated, Pressable, Platform } from 'react-native';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export const AnimatedPressable = ({
  children,
  onPress,
  disabled = false,
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e) => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: scaleTo,
      tension: 120,
      friction: 10,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e) => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    if (onPressOut) onPressOut(e);
  };

  return (
    <AnimatedPressableBase
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        Platform.OS === 'web' && { cursor: disabled ? 'default' : 'pointer', touchAction: 'manipulation' },
        style,
        { transform: [{ scale }] },
      ]}
      {...props}
    >
      {children}
    </AnimatedPressableBase>
  );
};
