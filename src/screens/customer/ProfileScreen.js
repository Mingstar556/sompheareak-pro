import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../api/client';
import { AnimatedThemeSwitch } from '../../components/AnimatedThemeSwitch';
import { AnimatedLangSwitch } from '../../components/AnimatedLangSwitch';
import { TelegramIcon } from '../../components/TelegramIcon';
import { TelegramAvatar } from '../../components/TelegramAvatar';

export const ProfileScreen = ({ onOpenAdmin, onNavigate }) => {
  const {
    theme,
    themeMode,
    toggleTheme,
    lang,
    setLang,
    t,
    user,
    setIsGuest,
    setAuthGateTab,
    logoutCustomer,
    userOrders,
    refreshUser,
    showToast,
  } = useApp();

  const handleLogout = () => {
    Alert.alert(
      t('logoutBtn'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logoutBtn'), style: 'destructive', onPress: logoutCustomer },
      ]
    );
  };

  const activeVouchersCount = Array.isArray(user?.vouchers)
    ? user.vouchers.filter((v) => !v.used).length
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centeredWrapper}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TelegramAvatar
            size={64}
            style={{ marginBottom: 10 }}
            ringColor="#229ED9"
            showBadge={Boolean(user)}
          />
          <Text style={[styles.username, { color: theme.text }]}>
            {user?.username ? `@${user.username}` : (lang === 'km' ? 'ភ្ញៀវ (Guest Explorer)' : 'Guest Explorer')}
          </Text>
          <Text style={[styles.phone, { color: theme.textMuted }]}>
            {user?.phone || (lang === 'km' ? 'មិនទាន់ភ្ជាប់គណនី Telegram' : 'Account not linked')}
          </Text>
          {!user && (
            <TouchableOpacity
              style={{ marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#0284c7', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => setIsGuest(false)}
              activeOpacity={0.8}
            >
              <TelegramIcon size={16} variant="circle" />
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                {lang === 'km' ? 'ភ្ជាប់ Telegram ដើម្បីសន្ំពិន្ទុ' : 'Link Telegram Account'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: theme.gold }]}>
                {user?.points || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                {t('pointsBalanceLabel')}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: theme.primary }]}>
                {userOrders.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                {t('totalOrdersLabel')}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: theme.rose }]}>
                {activeVouchersCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                {t('vouchersAvailable')}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Service Telegram Card */}
        <TouchableOpacity
          style={[styles.csCard, { backgroundColor: 'rgba(34, 158, 217, 0.08)', borderColor: 'rgba(34, 158, 217, 0.35)' }]}
          onPress={() => Linking.openURL('https://t.me/Somphea_Reak')}
          activeOpacity={0.8}
        >
          <TelegramIcon size={28} variant="circle" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#229ED9' }}>
              Customer Service Telegram: @Somphea_Reak
            </Text>
            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
              Need assistance with an order, custom charms, or delivery status? Chat with us live!
            </Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#229ED9' }}>Chat ↗</Text>
        </TouchableOpacity>

        {/* Settings Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            ⚙️ {t('settingsTitle')}
          </Text>

          {/* Language */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('langTitle')}</Text>
            <AnimatedLangSwitch
              lang={lang}
              onToggle={() => setLang(lang === 'km' ? 'en' : 'km')}
              theme={theme}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Theme */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Theme / ផ្ទៃកម្មវិធី</Text>
            <AnimatedThemeSwitch
              themeMode={themeMode}
              onToggle={toggleTheme}
              theme={theme}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsBox}>

          <TouchableOpacity
            style={[styles.bonusBtn, { borderColor: theme.secondaryBorder || 'rgba(16, 185, 129, 0.3)', backgroundColor: theme.secondaryBg || 'rgba(16, 185, 129, 0.1)' }]}
            onPress={() => {
              setAuthGateTab('recover');
              logoutCustomer();
            }}
          >
            <Text style={{ color: theme.secondary || '#10b981', fontWeight: '700', fontSize: 13 }}>
              🔑 {lang === 'km' ? 'ភ្លេច ឬផ្លាស់ប្តូរលេខសម្ងាត់ (Reset Password)' : 'Reset / Recover Password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bonusBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => {
              setAuthGateTab('login');
              logoutCustomer();
            }}
          >
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
              🔄 {lang === 'km' ? 'ប្តូរគណនី / ចូលគណនីផ្សេង' : 'Switch Account / Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
            onPress={handleLogout}
          >
            <Text style={{ color: theme.error, fontWeight: '700', fontSize: 13 }}>
              ⏻ {t('logoutBtn')}
            </Text>
          </TouchableOpacity>

          {/* Ownership & Legal Notice */}
          <View style={{ marginTop: 24, paddingVertical: 12, alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.gold }}>
              សម្ភារៈ • Somphea Reak Studio
            </Text>
            <Text style={{ fontSize: 10, color: theme.textMuted }}>
              Cambodia Kingdom of Wonder • Boutique Commerce Engine
            </Text>
            <Text style={{ fontSize: 9.5, color: theme.textMuted }}>
              © 2026 Somphea Reak Studio. All Rights Reserved.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 10,
    paddingBottom: 80,
  },
  centeredWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 10,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '800',
  },
  phone: {
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 9.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
  },
  csCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3.5,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  actionsBox: {
    gap: 8,
    marginTop: 4,
  },
  bonusBtn: {
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutBtn: {
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
  },
});
