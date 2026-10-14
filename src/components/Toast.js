import React from 'react';
import { StyleSheet, Text, Animated, View } from 'react-native';
import { useApp } from '../context/AppContext';

export const Toast = () => {
  const { toastMessage, theme } = useApp();

  if (!toastMessage) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.bubble, { backgroundColor: theme.primary, borderColor: theme.border }]}>
        <Text style={styles.text}>{toastMessage}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  bubble: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
  },
  text: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
});
