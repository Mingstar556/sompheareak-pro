import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNavBar } from './components/BottomNavBar';
import { Toast } from './components/Toast';
import { AdminLiveToolbar } from './components/AdminLiveToolbar';
import { TelegramIcon } from './components/TelegramIcon';
import { CookieConsentBanner } from './components/CookieConsentBanner';

import { LoginGateScreen } from './screens/customer/LoginGateScreen';
import { StorefrontHomeScreen } from './screens/customer/StorefrontHomeScreen';
import { CustomBraceletScreen } from './screens/customer/CustomBraceletScreen';
import { CartScreen } from './screens/customer/CartScreen';
import { CheckoutScreen } from './screens/customer/CheckoutScreen';
import { OrdersScreen } from './screens/customer/OrdersScreen';
import { RewardsScreen } from './screens/customer/RewardsScreen';
import { ProfileScreen } from './screens/customer/ProfileScreen';

export const CustomerRoot = ({ adminMode = false, onReturnToAdmin }) => {
  const { user, isGuest, setIsGuest, theme, themeMode } = useApp();
  const [currentTab, setCurrentTab] = useState('home');
  const [tabParams, setTabParams] = useState({});
  const [adminTriggerAction, setAdminTriggerAction] = useState(null);
  const { width } = useWindowDimensions();
  const isPhone = width <= 500;

  // When entering storefront from admin desk, bypass any customer login prompts automatically
  useEffect(() => {
    if (adminMode && !user && !isGuest && setIsGuest) {
      setIsGuest(true);
    }
  }, [adminMode, user, isGuest, setIsGuest]);

  const handleTriggerAdminAction = (actionType) => {
    setCurrentTab('home');
    setAdminTriggerAction({ type: actionType, ts: Date.now() });
  };

  const handleNavigate = (tab, params = {}) => {
    if (tab === 'admin') {
      if (adminMode && onReturnToAdmin) {
        onReturnToAdmin();
      }
      return;
    }
    setTabParams(params || {});
    setCurrentTab(tab);
  };

  if (!adminMode && !user && !isGuest) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: isPhone
              ? theme.bg
              : (themeMode === 'dark' ? '#07090e' : '#f1f5f9'),
          },
        ]}
      >
        <StatusBar
          barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.bg}
        />
        <View style={styles.appShellWrapper}>
          <View
            style={[
              styles.mobileContainer,
              isPhone && styles.phoneContainer,
              {
                backgroundColor: theme.bg,
                borderColor: isPhone
                  ? 'transparent'
                  : (themeMode === 'dark' ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0, 0, 0, 0.12)'),
              },
              !isPhone && styles.desktopPhoneShadow,
            ]}
          >
            <LoginGateScreen />
          </View>
        </View>
        <CookieConsentBanner />
        <Toast />
      </SafeAreaView>
    );
  }

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'cart':
        return <CartScreen onNavigate={handleNavigate} />;
      case 'custom-bracelet':
        return <CustomBraceletScreen onNavigate={handleNavigate} initialStyleId={tabParams?.initialStyleId} />;
      case 'checkout':
        return <CheckoutScreen onNavigate={handleNavigate} />;
      case 'orders':
        return <OrdersScreen />;
      case 'rewards':
        return <RewardsScreen onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} />;
      case 'home':
      default:
        return (
          <StorefrontHomeScreen
            onNavigate={handleNavigate}
            isAdminMode={adminMode}
            onAdminEditCategories={adminMode ? onReturnToAdmin : undefined}
            adminTriggerAction={adminTriggerAction}
            onAdminTriggerHandled={() => setAdminTriggerAction(null)}
          />
        );
    }
  };

  const handleOpenTelegramCS = () => {
    Linking.openURL('https://t.me/Somphea_Reak');
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: isPhone
            ? theme.bg
            : (themeMode === 'dark' ? '#07090e' : '#f1f5f9'),
        },
      ]}
    >
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.card}
      />

      {/* Mobile-First App Shell Wrapper */}
      <View style={styles.appShellWrapper}>
        <View
          style={[
            styles.mobileContainer,
            isPhone && styles.phoneContainer,
            {
              backgroundColor: theme.bg,
              borderColor: isPhone
                ? 'transparent'
                : (themeMode === 'dark' ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0, 0, 0, 0.12)'),
            },
            !isPhone && styles.desktopPhoneShadow,
          ]}
        >
          {/* Live Admin Mode Toolbar (Only rendered if store owner opened storefront from Admin Desk) */}
          {adminMode && (
            <AdminLiveToolbar
              onReturnToAdmin={onReturnToAdmin}
              onOpenQuickAdd={() => handleTriggerAdminAction('add-product')}
              onOpenAddCategory={() => handleTriggerAdminAction('add-category')}
              onOpenQuickSettings={() => handleTriggerAdminAction('edit-settings')}
              onOpenManageFilters={() => handleTriggerAdminAction('manage-filters')}
            />
          )}

          {/* Mobile-Optimized Header */}
          <Header
            onNavigate={handleNavigate}
            currentTab={currentTab}
          />

          {/* Main Mobile Screen View */}
          <View style={styles.content}>
            {renderCurrentView()}
          </View>

          {/* Floating Customer Service Telegram Button - Sleek Mobile Circular FAB */}
          <TouchableOpacity
            style={styles.floatingTelegramFab}
            onPress={handleOpenTelegramCS}
            activeOpacity={0.85}
            accessibilityLabel="Customer Support via Telegram @Somphea_Reak"
            title="Customer Support via Telegram @Somphea_Reak"
          >
            <TelegramIcon size={20} variant="circle" />
            <View style={styles.fabPulseDot} />
          </TouchableOpacity>

          {/* Mobile Bottom Dock Navigation Bar */}
          <BottomNavBar currentTab={currentTab} onSelectTab={setCurrentTab} />
        </View>
      </View>

      <CookieConsentBanner />
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  appShellWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 820, // Max tablet width; strictly mobile and tablet only
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  phoneContainer: {
    maxWidth: '100%',
  },
  desktopPhoneShadow: {
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 16,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  floatingTelegramFab: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 'calc(64px + env(safe-area-inset-bottom, 0px))' : (Platform.OS === 'ios' ? 76 : 64),
    right: 12,
    zIndex: 999,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#229ED9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 158, 217, 0.65)',
  },
  fabPulseDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
});
