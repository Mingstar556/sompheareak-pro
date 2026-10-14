import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ApiClient } from '../api/client';

export const AdminQuickSettingsModal = ({
  visible,
  settings,
  adminToken,
  onClose,
  onSaved,
  theme,
}) => {
  const [siteTitle, setSiteTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [sellerTelegram, setSellerTelegram] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (settings) {
      setSiteTitle(settings.site_title || '');
      setSubtitle(settings.subtitle || '');
      setAnnouncement(settings.announcement || '');
      setSellerTelegram(settings.seller_telegram || '');
    }
  }, [settings, visible]);

  const handleSave = async () => {
    setSubmitting(true);
    const payload = {
      ...(settings || {}),
      site_title: siteTitle.trim(),
      subtitle: subtitle.trim(),
      announcement: announcement.trim(),
      seller_telegram: sellerTelegram.trim(),
    };

    const res = await ApiClient.updateSettings(payload, adminToken);
    setSubmitting(false);

    if (res.ok) {
      if (onSaved) onSaved(payload);
      onClose();
    } else {
      Alert.alert('Save Failed', res.error || 'Could not update settings');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme?.card || '#161b2e', borderColor: theme?.border || '#334155' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.title, { color: theme?.text || '#f8fafc' }]}>
              ⚙️ Quick Edit Store Identity
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: theme?.textMuted || '#94a3b8', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>Store Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }]}
              value={siteTitle}
              onChangeText={setSiteTitle}
            />

            <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>Subtitle</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }]}
              value={subtitle}
              onChangeText={setSubtitle}
            />

            <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>
              📢 Live Moving Word Banner (Customer Front)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }]}
              value={announcement}
              onChangeText={setAnnouncement}
              placeholder="e.g. ✨ Welcome to Somphea Reak • 🚚 Fast Express Delivery • 💎 100% Stainless Steel"
              placeholderTextColor={theme?.textMuted}
            />

            <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>Seller Telegram Account</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }]}
              value={sellerTelegram}
              onChangeText={setSellerTelegram}
              placeholder="@username"
              placeholderTextColor={theme?.textMuted}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme?.primary || '#10b981' }]}
              onPress={handleSave}
              disabled={submitting}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                {submitting ? 'Saving...' : '💾 Save Settings'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  scroll: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  saveBtn: {
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
});
