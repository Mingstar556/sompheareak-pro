import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { AdminMovingBannerModal } from './AdminMovingBannerModal';

export const BANNER_COLOR_THEMES = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    icon: '🟢',
    dark: {
      gradient: 'linear-gradient(90deg, #022c22 0%, #064e3b 45%, #0f766e 85%, #083344 100%)',
      fallbackBg: '#064e3b',
      border: '#10b981',
      badgeBg: '#10b981',
      badgeText: '#ffffff',
      textColor: '#ecfdf5',
      starColor: '#fbbf24',
      shadowColor: '#10b981',
    },
    light: {
      gradient: 'linear-gradient(90deg, #ecfdf5 0%, #d1fae5 45%, #ccfbf1 85%, #e0f2fe 100%)',
      fallbackBg: '#d1fae5',
      border: '#059669',
      badgeBg: '#059669',
      badgeText: '#ffffff',
      textColor: '#064e3b',
      starColor: '#d97706',
      shadowColor: '#059669',
    },
  },
  gold: {
    id: 'gold',
    name: 'Royal Gold',
    icon: '🟡',
    dark: {
      gradient: 'linear-gradient(90deg, #351a02 0%, #78350f 45%, #b45309 80%, #451a03 100%)',
      fallbackBg: '#78350f',
      border: '#f59e0b',
      badgeBg: '#f59e0b',
      badgeText: '#000000',
      textColor: '#fffbeb',
      starColor: '#fde047',
      shadowColor: '#f59e0b',
    },
    light: {
      gradient: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 45%, #fde68a 80%, #fef9c3 100%)',
      fallbackBg: '#fef3c7',
      border: '#d97706',
      badgeBg: '#d97706',
      badgeText: '#ffffff',
      textColor: '#78350f',
      starColor: '#b45309',
      shadowColor: '#d97706',
    },
  },
  blue: {
    id: 'blue',
    name: 'Ocean Sapphire',
    icon: '🔵',
    dark: {
      gradient: 'linear-gradient(90deg, #082f49 0%, #0369a1 45%, #0284c7 80%, #1e1b4b 100%)',
      fallbackBg: '#0369a1',
      border: '#38bdf8',
      badgeBg: '#0284c7',
      badgeText: '#ffffff',
      textColor: '#f0f9ff',
      starColor: '#38bdf8',
      shadowColor: '#0284c7',
    },
    light: {
      gradient: 'linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 45%, #bae6fd 80%, #e0e7ff 100%)',
      fallbackBg: '#e0f2fe',
      border: '#0284c7',
      badgeBg: '#0284c7',
      badgeText: '#ffffff',
      textColor: '#075985',
      starColor: '#0284c7',
      shadowColor: '#0284c7',
    },
  },
  purple: {
    id: 'purple',
    name: 'Cyber Violet',
    icon: '🟣',
    dark: {
      gradient: 'linear-gradient(90deg, #2e1065 0%, #581c87 45%, #7e22ce 80%, #4a044e 100%)',
      fallbackBg: '#581c87',
      border: '#c084fc',
      badgeBg: '#9333ea',
      badgeText: '#ffffff',
      textColor: '#faf5ff',
      starColor: '#f472b6',
      shadowColor: '#9333ea',
    },
    light: {
      gradient: 'linear-gradient(90deg, #faf5ff 0%, #f3e8ff 45%, #e9d5ff 80%, #fdf2f8 100%)',
      fallbackBg: '#f3e8ff',
      border: '#7e22ce',
      badgeBg: '#7e22ce',
      badgeText: '#ffffff',
      textColor: '#581c87',
      starColor: '#9333ea',
      shadowColor: '#7e22ce',
    },
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby Crimson',
    icon: '🔴',
    dark: {
      gradient: 'linear-gradient(90deg, #4c0519 0%, #881337 45%, #be123c 80%, #3b0764 100%)',
      fallbackBg: '#881337',
      border: '#fb7185',
      badgeBg: '#e11d48',
      badgeText: '#ffffff',
      textColor: '#fff1f2',
      starColor: '#fde047',
      shadowColor: '#e11d48',
    },
    light: {
      gradient: 'linear-gradient(90deg, #fff1f2 0%, #ffe4e6 45%, #fecdd3 80%, #fae8ff 100%)',
      fallbackBg: '#ffe4e6',
      border: '#e11d48',
      badgeBg: '#e11d48',
      badgeText: '#ffffff',
      textColor: '#881337',
      starColor: '#e11d48',
      shadowColor: '#e11d48',
    },
  },
};

export const MovingBanner = ({
  isAdminMode = false,
  onAdminEditSettings,
}) => {
  const { theme, themeMode, lang, settings, adminToken } = useApp();
  const { width } = useWindowDimensions();

  // Active theme mode
  const isDark = themeMode === 'dark';

  // Selected banner color (default to vibrant emerald)
  const colorKey = settings?.banner_color || 'emerald';
  const activeColorTheme = BANNER_COLOR_THEMES[colorKey] || BANNER_COLOR_THEMES.emerald;
  const colors = isDark ? activeColorTheme.dark : activeColorTheme.light;

  // Admin In-Place Edit Modal
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Marquee scroll animation for React Native non-web runtimes
  const scrollAnim = useRef(new Animated.Value(0)).current;

  // Active moving banner text
  const defaultText = lang === 'km'
    ? '✨ សូមស្វាគមន៍មកកាន់ Somphea Reak Studio • 🚚 សេវាដឹកជញ្ជូនរហ័ស ១-២ ថ្ងៃ • 💎 ខ្សែដៃអ៊ីតាលី 316L Stainless Steel • ✈️ កម្ម៉ង់ផ្ទាល់តាម Telegram @Somphea_Reak'
    : '✨ Welcome to Somphea Reak Studio • 🚚 Fast Express Delivery 1-2 Days • 💎 100% 316L Stainless Steel Italy Charms • ✈️ Instant Orders via Telegram @Somphea_Reak';

  const bannerText = (settings?.announcement || '').trim() || defaultText;

  // Native smooth loop (for iOS / Android native engines)
  useEffect(() => {
    if (Platform.OS === 'web') return; // Web uses GPU-accelerated CSS keyframes

    scrollAnim.setValue(0);
    const animation = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: -width * 2,
        duration: 26000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [bannerText, width, scrollAnim]);

  // Repeated segments so the moving words flow seamlessly without any gaps
  const repeatedSegments = [bannerText, bannerText, bannerText];

  return (
    <>
      <View
        style={[
          styles.bannerStrip,
          {
            backgroundColor: colors.fallbackBg,
            borderColor: colors.border,
            shadowColor: colors.shadowColor,
            ...(Platform.OS === 'web'
              ? {
                  background: colors.gradient,
                  boxShadow: `0 2px 10px ${colors.shadowColor}33`,
                }
              : {}),
          },
        ]}
      >
        {/* Left Glowing Live Indicator Badge */}
        <View style={[styles.liveBadge, { backgroundColor: colors.badgeBg }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.badgeText }]} />
          <Text style={[styles.liveText, { color: colors.badgeText }]}>
            LIVE
          </Text>
        </View>

        {/* Marquee Window (Words smoothly glide across horizontally) */}
        <View style={styles.marqueeWindow}>
          {Platform.OS === 'web' ? (
            <div className="sr-moving-marquee-track">
              {repeatedSegments.map((seg, idx) => (
                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: colors.textColor,
                      letterSpacing: '0.2px',
                    }}
                  >
                    {seg}
                  </span>
                  <span
                    style={{
                      color: colors.starColor,
                      fontWeight: 900,
                      fontSize: '12px',
                      margin: '0 18px',
                    }}
                  >
                    ✦
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <Animated.View
              style={[
                styles.nativeTrack,
                {
                  transform: [{ translateX: scrollAnim }],
                },
              ]}
            >
              {repeatedSegments.map((seg, idx) => (
                <View key={idx} style={styles.segmentWrap}>
                  <Text style={[styles.movingText, { color: colors.textColor }]}>
                    {seg}
                  </Text>
                  <Text style={[styles.separator, { color: colors.starColor }]}>
                    ✦
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}
        </View>

        {/* Right Admin Edit Action (Only visible when admin is logged in) */}
        {isAdminMode && (
          <TouchableOpacity
            style={[
              styles.adminEditBtn,
              {
                backgroundColor: colors.badgeBg,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setEditModalVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Edit Moving Banner"
          >
            <Text style={[styles.adminEditBtnText, { color: colors.badgeText }]}>✏️ Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Quick Editor Modal for Moving Banner */}
      {isAdminMode && (
        <AdminMovingBannerModal
          visible={editModalVisible}
          currentText={bannerText}
          currentColor={colorKey}
          adminToken={adminToken}
          theme={theme}
          onClose={() => setEditModalVisible(false)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  bannerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 11,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    marginBottom: 8,
    marginTop: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
    zIndex: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  marqueeWindow: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    height: '100%',
  },
  nativeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '300%',
  },
  segmentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  movingText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  separator: {
    fontSize: 12,
    fontWeight: '900',
    marginHorizontal: 16,
  },
  adminEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  adminEditBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
});
