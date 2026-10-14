import React from 'react';
import { Image, Platform } from 'react-native';

/**
 * Official Telegram Vector Logo Component
 * Renders the crisp official Telegram circular badge or monochrome vector
 */
export const TelegramIcon = ({ size = 20, style, variant = 'circle' }) => {
  const isCircle = variant === 'circle';

  // SVG Data URI for cross-platform zero-dependency rendering
  const svgXml = isCircle
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><circle cx="12" cy="12" r="12" fill="%23229ED9"/><path d="M5.4 11.95L17.7 7.2c.57-.21 1.07.14.88.93l-2.1 9.9c-.15.7-.58.87-1.16.54l-3.23-2.38-1.56 1.5c-.17.17-.32.32-.66.32l.23-3.32 6.05-5.46c.26-.23-.06-.36-.4-.14l-7.48 4.71-3.22-1.01c-.7-.22-.72-.7.15-1.05z" fill="%23ffffff"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M2.5 11.4L21.2 3.5c.87-.33 1.63.22 1.34 1.42l-3.2 15.1c-.23 1.07-.88 1.33-1.77.83l-4.93-3.64-2.38 2.29c-.26.26-.49.49-1 .49l.35-5.07 9.23-8.33c.4-.35-.09-.55-.61-.21L6.99 13.06 2.08 11.52c-1.07-.34-1.1-1.07.23-1.6z" fill="%23229ED9"/></svg>`;

  const uri = `data:image/svg+xml;utf8,${svgXml}`;

  return (
    <Image
      source={{ uri }}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel="Telegram Logo"
    />
  );
};
