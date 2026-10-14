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
} from 'react-native';
import { ApiClient } from '../api/client';
import { useApp } from '../context/AppContext';

const EMOJI_PRESETS = [
  '🛍️', '✨', '🇮🇹', '🧸', '🪀', '💎', '⌚', '👒',
  '🕶️', '💍', '🎁', '🎒', '🌸', '⚡', '👑', '🏷️',
  '📦', '🎀', '🪄', '💖', '🧸', '🚀', '🎨', '🌟',
];

export const AdminQuickCategoryModal = ({
  visible,
  category,
  categories = [],
  adminToken,
  onClose,
  onSaved,
  theme,
}) => {
  const { themeMode, lang } = useApp() || {};
  const isDark = themeMode === 'dark';

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formKh, setFormKh] = useState('');
  const [formIcon, setFormIcon] = useState('🛍️');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(category && category.id);

  useEffect(() => {
    if (category) {
      setFormId(category.id || '');
      setFormName(category.name || category.en || '');
      setFormKh(category.kh || '');
      setFormIcon(category.icon || '🛍️');
    } else {
      setFormId('');
      setFormName('');
      setFormKh('');
      setFormIcon('🛍️');
    }
  }, [category, visible]);

  // Auto-generate slug ID when typing English name if creating new
  const handleNameChange = (text) => {
    setFormName(text);
    if (!isEditing) {
      const slug = text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormId(slug);
    }
  };

  const handleSave = async () => {
    if (!formName.trim() && !formKh.trim()) {
      Alert.alert('Validation Error', 'Please enter at least an English or Khmer category name.');
      return;
    }

    const cleanId = (formId || '').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    if (!cleanId) {
      Alert.alert('Validation Error', 'Please provide a valid Category ID (e.g., watches, toys).');
      return;
    }

    // Check duplicate if creating new
    if (!isEditing && categories.some((c) => c.id === cleanId)) {
      Alert.alert('Duplicate Category ID', `A category with ID "${cleanId}" already exists. Please pick a unique ID.`);
      return;
    }

    setSubmitting(true);
    const payload = {
      id: cleanId,
      name: formName.trim() || formKh.trim(),
      en: formName.trim() || formKh.trim(),
      kh: formKh.trim() || formName.trim(),
      icon: formIcon.trim() || '🛍️',
      grad: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
      sort_order: category?.sort_order !== undefined ? category.sort_order : categories.length + 1,
    };

    const res = await ApiClient.createCategory(payload, adminToken);
    setSubmitting(false);

    if (res.ok) {
      if (onSaved) onSaved(payload, false);
      onClose();
    } else {
      Alert.alert('Save Failed', res.error || 'Could not save category');
    }
  };

  const handleDelete = () => {
    if (!category || !category.id) return;
    if (category.id === 'all') {
      Alert.alert('Action Restricted', 'The "All Products" collection cannot be removed.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name || category.id}"? Products in this category will not be deleted but won\'t have this category tag.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            const res = await ApiClient.deleteCategory(category.id, adminToken);
            setSubmitting(false);
            if (res.ok) {
              if (onSaved) onSaved(category, true);
              onClose();
            } else {
              Alert.alert('Delete Failed', res.error || 'Could not delete category');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme?.card || '#161b2e',
              borderColor: theme?.border || '#334155',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.modalTitle, { color: theme?.text || '#ffffff' }]}>
                  {isEditing ? '✏️ Edit Category' : '🏷️ Add New Category'}
                </Text>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE SYNC</Text>
                </View>
              </View>
              <Text style={[styles.modalSub, { color: theme?.textMuted || '#94a3b8' }]}>
                Changes update immediately on the customer storefront
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={{ color: theme?.textMuted || '#94a3b8', fontSize: 18, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Live Box Preview */}
            <View style={styles.previewSection}>
              <Text style={[styles.previewSectionTitle, { color: theme?.textMuted || '#94a3b8' }]}>
                👀 LIVE STOREFRONT CARD PREVIEW
              </Text>
              <View style={styles.previewBoxWrapper}>
                <View
                  style={[
                    styles.previewBox,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: theme?.primary || '#10b981',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.previewTopHalf,
                      { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)' },
                    ]}
                  />
                  <View style={styles.previewIconCircle}>
                    <Text style={{ fontSize: 18 }}>{formIcon || '🛍️'}</Text>
                  </View>
                  <View style={styles.previewBottomHalf}>
                    <Text
                      style={[styles.previewName, { color: theme?.text || '#ffffff' }]}
                      numberOfLines={1}
                    >
                      {formName || formKh || 'Category Name'}
                    </Text>
                    {formKh ? (
                      <Text style={[styles.previewKhName, { color: theme?.textMuted || '#94a3b8' }]} numberOfLines={1}>
                        {formKh}
                      </Text>
                    ) : null}
                    <View style={styles.previewCountBadge}>
                      <Text style={{ fontSize: 9.5, color: theme?.primary || '#10b981', fontWeight: '700' }}>
                        Live Catalog Item
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Category Name (English) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>
                Category Name (English) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme?.inputBg || '#0f172a',
                    borderColor: theme?.inputBorder || '#334155',
                    color: theme?.text || '#ffffff',
                  },
                ]}
                placeholder="e.g. Luxury Watches, Italian Charms"
                placeholderTextColor={theme?.textMuted || '#64748b'}
                value={formName}
                onChangeText={handleNameChange}
              />
            </View>

            {/* Category Name (Khmer) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>
                ឈ្មោះជាភាសាខ្មែរ (Khmer Name)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme?.inputBg || '#0f172a',
                    borderColor: theme?.inputBorder || '#334155',
                    color: theme?.text || '#ffffff',
                  },
                ]}
                placeholder="e.g. នាឡិកាដៃប្រណិត, ខ្សែដៃអុីតាលី"
                placeholderTextColor={theme?.textMuted || '#64748b'}
                value={formKh}
                onChangeText={setFormKh}
              />
            </View>

            {/* Category ID (Slug) */}
            <View style={styles.fieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>
                  Category Identifier / Slug *
                </Text>
                {isEditing && (
                  <Text style={{ fontSize: 10, color: '#eab308', fontWeight: '700' }}>
                    KEY IDENTIFIER
                  </Text>
                )}
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme?.inputBg || '#0f172a',
                    borderColor: theme?.inputBorder || '#334155',
                    color: theme?.text || '#ffffff',
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  },
                ]}
                placeholder="e.g. watches, italy-charms"
                placeholderTextColor={theme?.textMuted || '#64748b'}
                value={formId}
                onChangeText={setFormId}
                autoCapitalize="none"
                editable={!isEditing} // keep stable when editing existing
              />
              <Text style={{ fontSize: 10.5, color: theme?.textMuted || '#64748b', marginTop: 3 }}>
                Used in product grouping and URL navigation (lowercase, hyphens only).
              </Text>
            </View>

            {/* Emoji / Icon Selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>
                Category Icon / Emoji
              </Text>

              {/* Preset Emoji Grid */}
              <View style={styles.emojiGrid}>
                {EMOJI_PRESETS.map((emoji) => {
                  const isSelected = formIcon === emoji;
                  return (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiPill,
                        {
                          backgroundColor: isSelected
                            ? (theme?.primary || '#10b981') + '33'
                            : (isDark ? '#0f172a' : '#f1f5f9'),
                          borderColor: isSelected
                            ? (theme?.primary || '#10b981')
                            : (isDark ? '#334155' : '#e2e8f0'),
                        },
                      ]}
                      onPress={() => setFormIcon(emoji)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 17 }}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Emoji / Text Input */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Text style={{ fontSize: 11, color: theme?.textMuted || '#94a3b8' }}>Custom:</Text>
                <TextInput
                  style={[
                    styles.customEmojiInput,
                    {
                      backgroundColor: theme?.inputBg || '#0f172a',
                      borderColor: theme?.inputBorder || '#334155',
                      color: theme?.text || '#ffffff',
                    },
                  ]}
                  placeholder="Type any emoji"
                  placeholderTextColor={theme?.textMuted || '#64748b'}
                  value={formIcon}
                  onChangeText={setFormIcon}
                  maxLength={4}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            {isEditing && category?.id !== 'all' ? (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
              </TouchableOpacity>
            ) : null}

            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme?.border || '#334155' }]}
                onPress={onClose}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelBtnText, { color: theme?.textMuted || '#94a3b8' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: theme?.primary || '#10b981' },
                ]}
                onPress={handleSave}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>
                  {submitting ? 'Saving...' : isEditing ? '✓ Save Changes' : '➕ Create Category'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  liveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  liveBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  formScroll: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  previewSection: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  previewSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  previewBoxWrapper: {
    width: 160,
  },
  previewBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 88,
    overflow: 'hidden',
    alignItems: 'center',
  },
  previewTopHalf: {
    width: '100%',
    height: 36,
  },
  previewIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#111524',
    borderWidth: 1,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -15,
    zIndex: 2,
  },
  previewBottomHalf: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  previewName: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewKhName: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  previewCountBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 5,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emojiPill: {
    width: 38,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customEmojiInput: {
    width: 70,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '900',
  },
});
