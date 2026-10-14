import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

/**
 * Official Telegram App Photo / Avatar Component
 * Displays the crisp, official Telegram app photo on customer & admin profiles.
 */
export const TelegramAvatar = ({
  size = 48,
  style,
  imageStyle,
  ring = true,
  ringColor = '#229ED9',
  showBadge = false,
}) => {
  const radius = size / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        ring && {
          borderWidth: Math.max(1.5, Math.round(size * 0.04)),
          borderColor: ringColor,
          padding: 1.5,
        },
        style,
      ]}
    >
      <Image
        source={require('../../assets/telegram_app.png')}
        style={[
          styles.image,
          {
            width: '100%',
            height: '100%',
            borderRadius: radius,
          },
          imageStyle,
        ]}
        resizeMode="cover"
        accessibilityLabel="Telegram App Profile Photo"
      />
      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              width: Math.max(10, Math.round(size * 0.28)),
              height: Math.max(10, Math.round(size * 0.28)),
              borderRadius: size,
              borderWidth: 1.5,
              borderColor: '#ffffff',
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  image: {
    backgroundColor: '#229ED9',
  },
  badge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#10b981',
  },
});

export default TelegramAvatar;
