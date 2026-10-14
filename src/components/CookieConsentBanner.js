import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';

const STORAGE_KEY = 'sr_cookie_consent_v1';

export const CookieConsentBanner = () => {
  const { theme, lang } = useApp();
  const [visible, setVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) {
        // Small delay to ensure smooth first impression
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    }).catch(() => {});
  }, []);

  const handleAcceptAll = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ type: 'all', timestamp: Date.now() }));
    } catch (e) {}
    setVisible(false);
  };

  const handleAcceptEssential = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ type: 'essential', timestamp: Date.now() }));
    } catch (e) {}
    setVisible(false);
  };

  if (!visible) return null;

  const isKm = lang === 'km';

  return (
    <>
      <View
        style={[
          styles.floatingBanner,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: theme.shadow || '#000',
          },
        ]}
      >
        <View style={styles.bannerHeader}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>🍪</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>
              {isKm
                ? 'សេចក្តីជូនដំណឹងអំពី Cookies & ការរក្សាការសម្ងាត់'
                : 'Cookie & Privacy Preferences'}
            </Text>
            <Text style={[styles.bannerText, { color: theme.textMuted }]}>
              {isKm
                ? 'Somphea Reak Studio ប្រើប្រាស់ Cookies និង Local Storage ចាំបាច់ដើម្បីរក្សាកន្ត្រកទំនិញ ធានាសុវត្ថិភាពគណនី និងផ្តល់បទពិសោធន៍ទិញទំនិញល្អបំផុត។'
                : 'Somphea Reak Studio uses essential cookies and local storage to secure your session, manage your cart, and deliver an optimal luxury shopping experience.'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btnOutline, { borderColor: theme.border }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.btnOutlineText, { color: theme.textMuted }]}>
              {isKm ? 'ℹ️ ព័ត៌មានលម្អិត' : 'ℹ️ Details'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSecondary, { borderColor: theme.border }]}
            onPress={handleAcceptEssential}
            activeOpacity={0.7}
          >
            <Text style={[styles.btnSecondaryText, { color: theme.text }]}>
              {isKm ? 'ចាំបាច់ប៉ុណ្ណោះ' : 'Essential Only'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: theme.primary }]}
            onPress={handleAcceptAll}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>
              {isKm ? '✓ យល់ព្រមទាំងអស់' : '✓ Accept All'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cookie & Privacy Policy Details Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isKm ? '🍪 គោលការណ៍ Cookies & សុវត្ថិភាពទិន្នន័យ' : '🍪 Cookie & Data Security Policy'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={{ fontSize: 18, color: theme.textMuted, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: theme.gold }]}>
                {isKm ? '១. Cookies និង Storage ដែលចាំបាច់ (Strictly Necessary)' : '1. Strictly Necessary Storage'}
              </Text>
              <Text style={[styles.policyText, { color: theme.text }]}>
                {isKm
                  ? '• កន្ត្រកទំនិញ (Cart): រក្សាទំនិញ និងម៉ូតខ្សែដៃអ៊ីតាលីដែលអ្នកបានរចនា។\n• ការចូលគណនី (Authentication): រក្សា token សុវត្ថិភាពសម្រាប់ការទូទាត់ និងសន្ំពិន្ទុ។\n• ចំណូលចិត្ត (Preferences): ចងចាំភាសា (ខ្មែរ/English) និង Theme (Light/Dark)។'
                  : '• Cart Storage: Persists your selected products and custom Italian charm bracelet design.\n• Secure Authentication: Maintains encrypted session token for checkout & loyalty stars.\n• Display Preferences: Remembers your selected language (Khmer/English) and theme.'}
              </Text>

              <Text style={[styles.sectionTitle, { color: theme.gold, marginTop: 14 }]}>
                {isKm ? '២. សុវត្ថិភាព និងការការពារសិទ្ធិឯកជន (Privacy & Protection)' : '2. Privacy & Data Integrity'}
              </Text>
              <Text style={[styles.policyText, { color: theme.text }]}>
                {isKm
                  ? '• យើងមិនដែលលក់ ឬចែករំលែកទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នកទៅកាន់ភាគីទីបីណាមួយឡើយ។\n• រាល់ការកម្ម៉ង់ត្រូវបានបញ្ជាក់ដោយផ្ទាល់តាមរយៈ Telegram Concierge ផ្លូវការ។\n• អ្នកអាចសម្អាតទិន្នន័យក្នុងឧបករណ៍របស់អ្នកគ្រប់ពេលវេលាតាមរយៈទំព័រ Profile។'
                  : '• We never sell or share your personal data with third-party advertisers.\n• Order receipts are verified directly through official Telegram concierge (@Somphea_Reak).\n• You can clear your local storage at any time via your Profile settings.'}
              </Text>

              <Text style={[styles.sectionTitle, { color: theme.gold, marginTop: 14 }]}>
                {isKm ? '៣. កម្មសិទ្ធិបញ្ញា និងអាជ្ញាប័ណ្ណ (Ownership & License)' : '3. Ownership & Legal Notice'}
              </Text>
              <Text style={[styles.policyText, { color: theme.text }]}>
                {isKm
                  ? '© ២០២៦ សម្ភារៈ - Somphea Reak Studio. រក្សាសិទ្ធិគ្រប់យ៉ាង។ ផលិត និងគ្រប់គ្រងក្រោមស្តង់ដារគុណភាពខ្ពស់បំផុតក្នុងព្រះរាជាណាចក្រកម្ពុជា។'
                  : '© 2026 Somphea Reak Studio. All Rights Reserved. Manufactured and operated under sovereign ownership in Phnom Penh, Kingdom of Cambodia.'}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalAcceptBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                setModalVisible(false);
                handleAcceptAll();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalAcceptText}>
                {isKm ? 'យល់ព្រម និងបន្តការទិញទំនិញ →' : 'Accept & Continue Shopping →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingBanner: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 'calc(68px + env(safe-area-inset-bottom, 0px))' : 72,
    left: 12,
    right: 12,
    maxWidth: 580,
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    zIndex: 9999,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  bannerText: {
    fontSize: 11,
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  btnOutline: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnOutlineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 5,
  },
  policyText: {
    fontSize: 11.5,
    lineHeight: 18,
    opacity: 0.9,
  },
  modalAcceptBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAcceptText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
