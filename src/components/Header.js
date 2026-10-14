import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, Linking, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { AnimatedThemeSwitch } from './AnimatedThemeSwitch';
import { AnimatedLangSwitch } from './AnimatedLangSwitch';
import { AnimatedPressable } from './AnimatedPressable';
import { TelegramIcon } from './TelegramIcon';
import { TelegramAvatar } from './TelegramAvatar';

export const Header = ({ onNavigate, currentTab, onOpenAdmin }) => {
  const {
    theme,
    themeMode,
    toggleTheme,
    lang,
    setLang,
    user,
    cartCount,
    settings,
  } = useApp();

  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const isCompact = width < 420;

  return (
    <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <View style={styles.headerInner}>
        {/* Brand Pill */}
        <AnimatedPressable
          style={styles.brandRow}
          onPress={() => onNavigate && onNavigate('home')}
        >
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.logo}
            resizeMode="cover"
          />
          <View style={styles.brandTexts}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {settings.site_title || 'Somphea Reak'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.primary }]}>
              {settings.subtitle || 'PREMIUM STUDIO'}
            </Text>
          </View>
        </AnimatedPressable>

        {/* Right Controls - Mobile Optimized */}
        <View style={styles.controls}>
          {/* Points Pill (if logged in) */}
          {user && (
            <TouchableOpacity
              style={[
                styles.pointsPill,
                { backgroundColor: 'rgba(234, 179, 8, 0.15)', borderColor: 'rgba(234, 179, 8, 0.3)' },
              ]}
              onPress={() => onNavigate && onNavigate('rewards')}
              activeOpacity={0.7}
            >
              <Text style={styles.pointsText}>⭐ {user.points || 0}</Text>
            </TouchableOpacity>
          )}

          {/* Customer Telegram Profile Avatar (if logged in) */}
          {user && (
            <AnimatedPressable
              style={{ padding: 1 }}
              onPress={() => onNavigate && onNavigate('profile')}
              accessibilityLabel="Telegram Profile"
            >
              <TelegramAvatar size={24} ringColor="#229ED9" showBadge={true} />
            </AnimatedPressable>
          )}

          {/* Animated Language Switch */}
          <AnimatedLangSwitch
            lang={lang}
            onToggle={() => setLang(lang === 'km' ? 'en' : 'km')}
            theme={theme}
            size="small"
          />

          {/* Animated Theme Switch */}
          <AnimatedThemeSwitch
            themeMode={themeMode}
            onToggle={toggleTheme}
            theme={theme}
            size="small"
          />

          {/* Compact Cart Icon if items in cart */}
          {cartCount > 0 && (
            <AnimatedPressable
              style={[styles.cartIconButton, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
              onPress={() => onNavigate && onNavigate('cart')}
            >
              <Text style={{ fontSize: 14 }}>🛒</Text>
              <View style={[styles.cartBadge, { backgroundColor: theme.secondary || '#10b981' }]}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            </AnimatedPressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    paddingTop: Platform.OS === 'web' ? 'max(6px, env(safe-area-inset-top, 0px))' : (Platform.OS === 'ios' ? 44 : 6),
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 4,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: '#eab308',
  },
  brandTexts: {
    flexShrink: 1,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  pointsPill: {
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  pointsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#eab308',
  },
  cartIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
});
