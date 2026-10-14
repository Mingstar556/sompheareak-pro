import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';

// Global trigger reference so any theme switch can invoke the circular wipe
let globalTriggerThemeRipple = null;

export const triggerThemeRipple = (nextMode, onMidpoint) => {
  if (globalTriggerThemeRipple) {
    globalTriggerThemeRipple(nextMode, onMidpoint);
    return true;
  }
  return false;
};

export const ThemeTransitionOverlay = () => {
  const [animating, setAnimating] = useState(false);
  const [targetColor, setTargetColor] = useState('#f8fafc');
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const executeTransition = useCallback((nextMode, onMidpoint) => {
    const isNextDark = nextMode === 'dark';
    const color = isNextDark ? '#0c0e17' : '#f8fafc';
    setTargetColor(color);
    setAnimating(true);
    scaleAnim.setValue(0);
    opacityAnim.setValue(1);

    // Expand circle rapidly to consume page (350ms)
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 360,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      // Fade out once page is fully transformed (180ms)
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setAnimating(false);
      });
    });

    // Trigger state change right as the circle covers the screen
    setTimeout(() => {
      if (onMidpoint) onMidpoint();
    }, 220);
  }, [scaleAnim, opacityAnim]);

  useEffect(() => {
    globalTriggerThemeRipple = executeTransition;
    return () => {
      globalTriggerThemeRipple = null;
    };
  }, [executeTransition]);

  if (!animating) return null;

  const { width, height } = Dimensions.get('window');
  const maxDimension = Math.max(width || 800, height || 1200);
  const baseSize = 40;
  // Calculate scale required for a 40px circle at top-right to cover the farthest corner
  const scaleFactor = (maxDimension / (baseSize / 2)) * 1.8;

  const interpolatedScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scaleFactor],
  });

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.rippleCircle,
          {
            backgroundColor: targetColor,
            width: baseSize,
            height: baseSize,
            borderRadius: baseSize / 2,
            opacity: opacityAnim,
            transform: [{ scale: interpolatedScale }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    overflow: 'hidden',
  },
  rippleCircle: {
    position: 'absolute',
    top: 20,
    right: 70, // Aligns with the Theme Toggle location in Header
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 25,
  },
});
