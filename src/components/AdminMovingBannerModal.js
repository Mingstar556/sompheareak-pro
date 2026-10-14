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
  Platform,
  useWindowDimensions,
} from 'react-native';
import { ApiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { BANNER_COLOR_THEMES } from './MovingBanner';

export const AdminMovingBannerModal = ({
  visible,
  currentText = '',
  currentColor = 'emerald',
  adminToken,
  theme,
  onClose,
  onSaved,
}) => {
  const { themeMode, lang, settings, refreshCatalog, showToast } = useApp();
  const { width } = useWindowDimensions();
  const isTablet = width > 500;
  const isDark = themeMode === 'dark';

  const [textVal, setTextVal] = useState(currentText);
  const [selectedColor, setSelectedColor] = useState(currentColor || 'emerald');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setTextVal(currentText || settings?.announcement || '');
      setSelectedColor(settings?.banner_color || currentColor || 'emerald');
    }
  }, [visible, currentText, currentColor, settings]);

  const activeColorTheme = BANNER_COLOR_THEMES[selectedColor] || BANNER_COLOR_THEMES.emerald;
  const colors = isDark ? activeColorTheme.dark : activeColorTheme.light;

  const presets = lang === 'km' ? [
    {
      title: '🚚 សេវាដឹក និងទូទាត់ COD',
      text: '🚚 សេវាដឹកជញ្ជូនរហ័ស ១-២ ថ្ងៃ រាជធានី & ខេត្ត • 💵 ទទួលទូទាត់ COD & ABA KHQR Bakong • ✈️ Telegram @Somphea_Reak',
    },
    {
      title: '💎 ខ្សែដៃអ៊ីតាលី 316L',
      text: '💎 ខ្សែដៃអ៊ីតាលី 316L Stainless Steel មិនច្រេះ មិនប្រែពណ៌ • 🔗 រចនាតាមចិត្ត ១៨ ប្រឡោះ • ⭐ សន្ំពិន្ទុរាល់ការទិញ',
    },
    {
      title: '🎉 ប្រូម៉ូសិនដឹកជញ្ជូនឥតគិតថ្លៃ',
      text: '🎉 កម្ម៉ង់ចាប់ពី $25 ដឹកជញ្ជូនឥតគិតថ្លៃ • 🎁 ថែមប្រអប់កាដូប្រណិត • 🎟️ ប័ណ្ណបញ្ចុះតម្លៃ ១០% ដល់ ២០%',
    },
    {
      title: '🧸 តុក្កតា Mini Figures & Toys',
      text: '🧸 តុក្កតា Mini Figures & Mecha Heroes កម្រ • 🪀 ប្រដាប់ក្មេងលេងប្រណិត • 💯 ធានាគុណភាពពិត ១០០%',
    },
  ] : [
    {
      title: '🚚 Fast Express Delivery & COD',
      text: '🚚 Fast Delivery 1-2 Days Nationwide • 💵 Cash on Delivery (COD) & ABA KHQR Accepted • ✈️ Live Telegram @Somphea_Reak',
    },
    {
      title: '💎 100% Stainless Italy Charms',
      text: '💎 100% Waterproof 316L Stainless Italy Charms • 🔗 Design Your Custom 18-Slot Story • ⭐ Earn Loyalty Points',
    },
    {
      title: '🎉 Free Shipping & Promo',
      text: '🎉 Free Express Shipping On Orders Over $25 • 🎁 Complimentary Luxury Gift Box • 🎟️ Redeem Up to 20% Off',
    },
    {
      title: '🧸 Collectible Minifigures & Toys',
      text: '🧸 Limited Collector Minifigures & Mechas • 🪀 Precision Die-Cast Toys • 💯 100% Verified Quality Guaranteed',
    },
  ];

  const handleSave = async () => {
    const trimmed = textVal.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Please enter some text for the moving banner.');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...(settings || {}),
      announcement: trimmed,
      banner_color: selectedColor,
    };

    const res = await ApiClient.updateSettings(payload, adminToken);
    setSubmitting(false);

    if (res.ok) {
      if (onSaved) onSaved(trimmed, selectedColor);
      await refreshCatalog();
      showToast('✓ Live moving banner updated with new colors!');
      onClose();
    } else {
      Alert.alert('Save Failed', res.error || 'Could not update moving banner');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme?.card || '#111827',
              borderColor: colors.border,
              maxWidth: isTablet ? 560 : 420,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme?.border || '#374151' }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.title, { color: theme?.text || '#ffffff' }]}>
                  📢 {lang === 'km' ? 'កែសម្រួលពណ៌ និងពាក្យរត់លើ Banner' : 'Edit Live Moving Banner & Color'}
                </Text>
                <View style={[styles.adminBadge, { backgroundColor: colors.badgeBg }]}>
                  <Text style={[styles.adminBadgeText, { color: colors.badgeText }]}>ADMIN</Text>
                </View>
              </View>
              <Text style={[styles.subtitle, { color: theme?.textMuted || '#9ca3af' }]}>
                {lang === 'km'
                  ? 'ពាក្យនេះនឹងរត់រំកិលបន្តបន្ទាប់គ្នាលើទំព័រមុខហាងអតិថិជន (Live Color Marquee)'
                  : 'Customize moving text & radiant color theme across the storefront'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={{ color: theme?.textMuted || '#9ca3af', fontSize: 16, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Live Preview Box */}
            <View style={styles.previewContainer}>
              <Text style={[styles.fieldLabel, { color: theme?.textMuted || '#9ca3af' }]}>
                👀 {lang === 'km' ? 'ទិដ្ឋភាពជាក់ស្តែង (Live Preview)' : 'Real-Time Customer Preview'}:
              </Text>
              <View
                style={[
                  styles.previewBox,
                  {
                    backgroundColor: colors.fallbackBg,
                    borderColor: colors.border,
                    ...(Platform.OS === 'web'
                      ? {
                          background: colors.gradient,
                          boxShadow: `0 2px 10px ${colors.shadowColor}44`,
                        }
                      : {}),
                  },
                ]}
              >
                <View style={[styles.previewTag, { backgroundColor: colors.badgeBg }]}>
                  <View style={[styles.livePulseDot, { backgroundColor: colors.badgeText }]} />
                  <Text style={[styles.previewTagText, { color: colors.badgeText }]}>LIVE</Text>
                </View>

                <View style={styles.previewTrackWrap}>
                  <View style={Platform.OS === 'web' ? { className: 'sr-moving-marquee-track' } : styles.previewTrackRow}>
                    <Text style={[styles.previewText, { color: colors.textColor }]}>
                      {textVal || (lang === 'km' ? 'សូមបញ្ចូលពាក្យរត់...' : 'Type your moving words...')}
                    </Text>
                    <Text style={[styles.previewSeparator, { color: colors.starColor }]}> ✦ </Text>
                    <Text style={[styles.previewText, { color: colors.textColor }]}>
                      {textVal || (lang === 'km' ? 'សូមបញ្ចូលពាក្យរត់...' : 'Type your moving words...')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Color Palette Selector */}
            <View style={styles.colorPickerSection}>
              <Text style={[styles.fieldLabel, { color: theme?.text || '#ffffff', marginBottom: 6 }]}>
                🎨 {lang === 'km' ? 'ជ្រើសរើសពណ៌ Banner (Bar Color)' : 'Select Bar Color'}:
              </Text>
              <View style={styles.colorPillsRow}>
                {Object.values(BANNER_COLOR_THEMES).map((c) => {
                  const isSelected = selectedColor === c.id;
                  const itemColor = isDark ? c.dark : c.light;

                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.colorPill,
                        isSelected && styles.colorPillSelected,
                        {
                          backgroundColor: itemColor.fallbackBg,
                          borderColor: isSelected ? itemColor.border : (theme?.border || '#374151'),
                        },
                      ]}
                      onPress={() => setSelectedColor(c.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 13 }}>{c.icon}</Text>
                      <Text
                        style={[
                          styles.colorPillText,
                          {
                            color: itemColor.textColor,
                            fontWeight: isSelected ? '900' : '700',
                          },
                        ]}
                      >
                        {c.name}
                      </Text>
                      {isSelected && (
                        <Text style={{ color: itemColor.border, fontWeight: '900', fontSize: 11 }}> ✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Input Field */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <Text style={[styles.fieldLabel, { color: theme?.text || '#ffffff' }]}>
                  {lang === 'km' ? 'អត្ថបទពាក្យរត់លើ Banner *' : 'Moving Banner Words Text *'}
                </Text>
                <Text style={{ fontSize: 10, color: theme?.textMuted || '#9ca3af' }}>
                  {textVal.length} chars
                </Text>
              </View>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme?.inputBg || '#1f2937',
                    borderColor: theme?.border || '#374151',
                    color: theme?.text || '#ffffff',
                  },
                ]}
                value={textVal}
                onChangeText={setTextVal}
                placeholder={lang === 'km' ? 'ឧ. ✨ សូមស្វាគមន៍មកកាន់ Somphea Reak • 🚚 ដឹកជញ្ជូនរហ័ស...' : 'e.g. ✨ Welcome to Somphea Reak • 🚚 Fast Express Delivery...'}
                placeholderTextColor={theme?.textMuted || '#6b7280'}
                multiline
                numberOfLines={3}
              />
              <Text style={{ fontSize: 10.5, color: theme?.textMuted || '#9ca3af', marginTop: 4 }}>
                💡 Tip: Use symbols like "•" or "✦" and emojis to separate multiple announcements cleanly.
              </Text>
            </View>

            {/* Quick Slogan Presets */}
            <View style={styles.presetsSection}>
              <Text style={[styles.fieldLabel, { color: theme?.textMuted || '#9ca3af', marginBottom: 8 }]}>
                ⚡ {lang === 'km' ? 'ជ្រើសរើសគំរូពាក្យរត់រហ័ស (Quick Presets)' : 'One-Tap Slogan Presets'}:
              </Text>
              <View style={styles.presetsList}>
                {presets.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.presetItem,
                      {
                        backgroundColor: theme?.inputBg || '#1f2937',
                        borderColor: theme?.border || '#374151',
                      },
                    ]}
                    onPress={() => setTextVal(p.text)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetTitle, { color: colors.border }]}>
                      {p.title}
                    </Text>
                    <Text style={[styles.presetText, { color: theme?.textMuted || '#9ca3af' }]} numberOfLines={2}>
                      {p.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footer, { borderTopColor: theme?.border || '#374151' }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme?.border || '#374151' }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={{ color: theme?.text || '#ffffff', fontWeight: '700', fontSize: 12 }}>
                {lang === 'km' ? 'បោះបង់' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.border }]}
              onPress={handleSave}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveBtnText, { color: colors.badgeText }]}>
                {submitting
                  ? (lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...')
                  : (lang === 'km' ? '💾 រក្សាទុក & ដាក់ផ្សាយផ្ទាល់' : '💾 Save & Publish Live')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  card: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  adminBadge: {
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 3.5,
    alignSelf: 'center',
  },
  adminBadgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    lineHeight: 9.5,
  },
  subtitle: {
    fontSize: 10.5,
    marginTop: 2,
    lineHeight: 14,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  scroll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    marginTop: 6,
    overflow: 'hidden',
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewTagText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  previewTrackWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  previewTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  previewSeparator: {
    fontSize: 12,
    fontWeight: '900',
    marginHorizontal: 8,
  },
  colorPickerSection: {
    marginBottom: 14,
  },
  colorPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 4,
  },
  colorPillSelected: {
    borderWidth: 2,
    elevation: 2,
  },
  colorPillText: {
    fontSize: 11,
  },
  formGroup: {
    marginBottom: 14,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    lineHeight: 18,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  presetsSection: {
    marginBottom: 10,
  },
  presetsList: {
    gap: 7,
  },
  presetItem: {
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  presetText: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
