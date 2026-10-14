import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, Platform, Animated } from 'react-native';
import { useApp } from '../context/AppContext';
import { AnimatedPressable } from './AnimatedPressable';
import { TelegramAvatar } from './TelegramAvatar';

export const BottomNavBar = ({ currentTab, onSelectTab }) => {
  const { theme, t, lang, cartCount, refreshCatalog, refreshOrders, showToast, user } = useApp();
  const spinAnim = useRef(new Animated.Value(0)).current;

  const handleRefresh = () => {
    // 360-degree logo spin animation on tap
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      spinAnim.setValue(0);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.reload();
      } else {
        if (refreshCatalog) refreshCatalog();
        if (refreshOrders) refreshOrders();
        showToast(lang === 'km' ? '🔄 កំពុងផ្ទុកឡើងវិញ...' : '🔄 Refreshing page...');
      }
    });
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const tabs = [
    { id: 'home', icon: '🏠', label: t('navHome') },
    { id: 'cart', icon: '🛒', label: t('navCart'), badge: cartCount },
    { id: 'refresh', isLogo: true, isCenter: true, label: lang === 'km' ? 'ផ្ទុកឡើងវិញ' : 'Refresh' },
    { id: 'orders', icon: '📦', label: t('navOrders') },
    { id: 'profile', icon: '👤', label: t('navProfile') },
  ];

  return (
    <View style={[styles.dockContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      <View style={styles.dockInner}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;

          if (tab.isCenter) {
            return (
              <AnimatedPressable
                key={tab.id}
                style={[
                  styles.centerBtn,
                  { backgroundColor: theme.card, borderColor: theme.gold || '#f59e0b' },
                ]}
                onPress={handleRefresh}
                scaleTo={0.88}
                accessibilityRole="button"
                accessibilityLabel="Refresh page"
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Image
                    source={require('../../assets/logo.jpg')}
                    style={styles.centerLogo}
                    resizeMode="cover"
                  />
                </Animated.View>
              </AnimatedPressable>
            );
          }

          return (
            <AnimatedPressable
              key={tab.id}
              style={styles.tabItem}
              onPress={() => onSelectTab(tab.id)}
              scaleTo={0.94}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
            >
              <View style={styles.iconWrap}>
                {tab.id === 'profile' ? (
                  <TelegramAvatar
                    size={22}
                    ring={isActive}
                    ringColor={isActive ? (theme.secondary || '#10b981') : '#229ED9'}
                    showBadge={Boolean(user)}
                  />
                ) : (
                  <Text style={[styles.tabIcon, { opacity: isActive ? 1 : 0.6 }]}>
                    {tab.icon}
                  </Text>
                )}
                {tab.badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.secondary || '#10b981' }]}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? (theme.secondary || '#10b981') : theme.textMuted, fontWeight: isActive ? '800' : '600' },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    height: Platform.OS === 'web' ? 'calc(54px + env(safe-area-inset-bottom, 0px))' : (Platform.OS === 'ios' ? 72 : 60),
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'web' ? 'max(6px, env(safe-area-inset-bottom, 0px))' : (Platform.OS === 'ios' ? 14 : 3),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 6,
  },
  dockInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: '100%',
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  iconWrap: {
    position: 'relative',
  },
  tabIcon: {
    fontSize: 19,
    marginBottom: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 9.5,
    textAlign: 'center',
  },
  centerBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginTop: -15,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  centerLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
});
