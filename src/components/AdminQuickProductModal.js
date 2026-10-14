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
  Image,
  Platform,
} from 'react-native';
import { ApiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { generateProductId, isProductIdDuplicate } from '../utils/productIdHelper';
import { CATEGORY_FALLBACK_IMAGES } from '../utils/productImageHelper';

export const AdminQuickProductModal = ({
  visible,
  product,
  products: propProducts,
  categories = [],
  adminToken,
  onClose,
  onSaved,
  theme,
}) => {
  const { products: contextProducts = [], settings } = useApp() || {};
  const exchangeRate = Number(settings?.exchange_rate) || 4100;
  const products = propProducts || contextProducts || [];

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCat, setFormCat] = useState('');
  const [formPrice, setFormPrice] = useState('10.00');
  const [formDiscount, setFormDiscount] = useState('0');
  const [formStock, setFormStock] = useState('10');
  const [formPt, setFormPt] = useState('1');
  const [formImage, setFormImage] = useState('');
  const [formFreeDelivery, setFormFreeDelivery] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormId(product.id || '');
      setFormName(product.name || '');
      setFormCat(product.cat || (categories[0]?.id || 'minifigure'));
      setFormPrice(String(product.price ?? 10));
      setFormDiscount(String(product.discount ?? 0));
      setFormStock(String(product.stock ?? 10));
      setFormPt(String(product.pt ?? 1));
      setFormImage(product.image || '');
      setFormFreeDelivery(Boolean(product.free_delivery === 1 || product.free_delivery === true || product.free_delivery === '1'));
    } else {
      setFormId(generateProductId(products));
      setFormName('');
      setFormCat(categories[0]?.id || 'minifigure');
      setFormPrice('10.00');
      setFormDiscount('0');
      setFormStock('10');
      setFormPt('1');
      setFormImage('');
      setFormFreeDelivery(false);
    }
  }, [product, categories, visible]);

  const handlePickFile = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp';
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          if (file.size > 8 * 1024 * 1024) {
            Alert.alert('File Too Large', 'Please select an image under 8MB.');
            return;
          }
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            setFormImage(uploadEvent.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name');
      return;
    }
    const cleanId = (formId || '').trim().toUpperCase();
    if (!cleanId) {
      Alert.alert('Validation Error', 'Product ID / SKU is required');
      return;
    }
    if (isProductIdDuplicate(cleanId, product?.id, products)) {
      Alert.alert(
        'Duplicate Product ID',
        `Product ID "${cleanId}" is already assigned to another product. Each product must have a unique non-duplicate ID.`
      );
      return;
    }

    setSubmitting(true);
    const payload = {
      id: cleanId,
      prev_id: product?.id,
      is_new: !product,
      name: formName.trim(),
      cat: formCat || (categories[0]?.id || 'minifigure'),
      price: parseFloat(formPrice) || 0,
      discount: parseFloat(formDiscount) || 0,
      stock: parseInt(formStock, 10) || 0,
      pt: parseInt(formPt, 10) || 1,
      image: formImage.trim() || (CATEGORY_FALLBACK_IMAGES[formCat] || CATEGORY_FALLBACK_IMAGES['minifigure']),
      free_delivery: formFreeDelivery,
    };

    const res = await ApiClient.createProduct(payload, adminToken);
    setSubmitting(false);

    if (res.ok) {
      if (onSaved) onSaved(payload);
      onClose();
    } else {
      Alert.alert('Save Failed', res.error || 'Could not save product');
    }
  };

  const handleDelete = () => {
    if (!product) return;
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            const res = await ApiClient.deleteProduct(product.id, adminToken);
            setSubmitting(false);
            if (res.ok) {
              if (onSaved) onSaved(null, true);
              onClose();
            } else {
              Alert.alert('Delete Failed', res.error || 'Could not delete product');
            }
          },
        },
      ]
    );
  };

  const numPrice = parseFloat(formPrice) || 0;
  const numDiscount = parseFloat(formDiscount) || 0;
  const numFinalPrice = numDiscount > 0 ? numPrice * (1 - numDiscount / 100) : numPrice;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme?.card || '#161b2e', borderColor: theme?.border || '#334155' }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.title, { color: theme?.text || '#f8fafc' }]}>
                {product ? '✏️ Live Edit Product' : '➕ Quick Add Product'}
              </Text>
              <Text style={{ fontSize: 10, color: theme?.textMuted || '#94a3b8', marginTop: 1 }}>
                Changes update the live database and reflect immediately
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme?.inputBg || '#1e293b' }]}>
              <Text style={{ color: theme?.textMuted || '#94a3b8', fontSize: 13, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            {/* Image Preview & Upload Row */}
            <View style={{ marginBottom: 6 }}>
              <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>Product Image</Text>
              <View style={[styles.imgPreviewBox, { borderColor: theme?.border || '#334155', backgroundColor: '#ffffff' }]}>
                {formImage ? (
                  <Image source={{ uri: formImage }} style={styles.imgPreview} resizeMode="contain" />
                ) : (
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20, marginBottom: 2 }}>🖼️</Text>
                    <Text style={{ fontSize: 10, color: theme?.textMuted }}>No image selected</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.uploadBtn, { backgroundColor: theme?.inputBg, borderColor: theme?.border }]}
                onPress={handlePickFile}
              >
                <Text style={{ color: theme?.text || '#f8fafc', fontSize: 11, fontWeight: '800' }}>
                  📁 {formImage ? 'Replace Image from Computer' : 'Upload Image from Computer'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Product ID / SKU Input with Auto-Generate */}
            <View style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8', marginBottom: 0 }]}>
                  Product ID / SKU * (Non-Duplicate)
                </Text>
                <TouchableOpacity
                  style={[styles.autoGenIdBtn, { backgroundColor: theme?.inputBg, borderColor: theme?.border, paddingHorizontal: 6, paddingVertical: 2 }]}
                  onPress={() => setFormId(generateProductId(products))}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: theme?.gold || '#eab308' }}>
                    ⚡ Auto-Generate
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme?.inputBg,
                    borderColor: isProductIdDuplicate(formId, product?.id, products)
                      ? (theme?.error || '#ef4444')
                      : theme?.inputBorder,
                    color: theme?.text,
                    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                    fontWeight: '800',
                    letterSpacing: 1,
                  },
                ]}
                value={formId}
                onChangeText={(val) => setFormId(val.toUpperCase())}
                placeholder="e.g. PRD-1001"
                placeholderTextColor={theme?.textMuted}
                autoCapitalize="characters"
              />
              {isProductIdDuplicate(formId, product?.id, products) ? (
                <Text style={{ fontSize: 10, color: theme?.error || '#ef4444', marginTop: 2, fontWeight: '700' }}>
                  ⚠️ Duplicate Product ID! "{formId}" is already assigned to another product. Each product must have a unique non-duplicate ID.
                </Text>
              ) : formId ? (
                <Text style={{ fontSize: 10, color: theme?.primary || '#10b981', marginTop: 2, fontWeight: '600' }}>
                  ✓ Unique Product ID confirmed ({formId})
                </Text>
              ) : null}
            </View>

            {/* Product Title - Sleek & Perfectly Proportioned */}
            <View style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8', marginBottom: 0 }]}>
                  Product Title *
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {formName ? (
                    <TouchableOpacity
                      style={[styles.autoGenIdBtn, { backgroundColor: theme?.inputBg || '#0f172a', borderColor: theme?.border || '#334155', paddingHorizontal: 6, paddingVertical: 2 }]}
                      onPress={() => setFormName('')}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: theme?.error || '#ef4444' }}>✕ Clear</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.autoGenIdBtn, { backgroundColor: theme?.inputBg || '#0f172a', borderColor: theme?.border || '#334155', paddingHorizontal: 6, paddingVertical: 2 }]}
                    onPress={() => {
                      if (!formName) return;
                      const titled = formName
                        .split(' ')
                        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
                        .join(' ');
                      setFormName(titled);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: theme?.primary || '#10b981' }}>Aa Title</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme?.inputBg,
                    borderColor: formName?.trim() ? (theme?.primary || '#10b981') : theme?.inputBorder,
                    color: theme?.text,
                  },
                ]}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Vintage Italian Bracelet"
                placeholderTextColor={theme?.textMuted}
              />
            </View>

            <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8', marginTop: 2, marginBottom: 3 }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: formCat === c.id ? (theme?.primary || '#10b981') : (theme?.inputBg || '#1e293b'),
                      borderColor: formCat === c.id ? (theme?.primary || '#10b981') : (theme?.border || '#334155'),
                    },
                  ]}
                  onPress={() => setFormCat(c.id)}
                >
                  <Text style={{ color: formCat === c.id ? '#fff' : (theme?.text || '#f8fafc'), fontSize: 10, fontWeight: '800' }}>
                    {c.icon || '🛍️'} {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>Price ($ USD) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }]}
                  value={formPrice}
                  onChangeText={setFormPrice}
                  keyboardType="decimal-pad"
                />
                <Text style={{ fontSize: 9.5, color: theme?.gold || '#eab308', marginTop: 2 }}>
                  ≈ {Math.round(numPrice * exchangeRate).toLocaleString()} ៛ KHR
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>Discount (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }]}
                  value={formDiscount}
                  onChangeText={setFormDiscount}
                  keyboardType="numeric"
                />
                {numDiscount > 0 ? (
                  <Text style={{ fontSize: 9.5, color: theme?.rose || '#f43f5e', marginTop: 2 }}>
                    Final: ${numFinalPrice.toFixed(2)}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>Stock Count</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }]}
                  value={formStock}
                  onChangeText={setFormStock}
                  keyboardType="numeric"
                />
                {/* Quick adjustment pills */}
                <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
                  {[-5, 1, 5, 10].map((delta) => (
                    <TouchableOpacity
                      key={delta}
                      style={[styles.stockPill, { backgroundColor: theme?.inputBg, borderColor: theme?.border }]}
                      onPress={() => {
                        const curr = parseInt(formStock, 10) || 0;
                        setFormStock(String(Math.max(0, curr + delta)));
                      }}
                    >
                      <Text style={{ fontSize: 8.5, fontWeight: '800', color: theme?.text }}>
                        {delta > 0 ? `+${delta}` : delta}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8' }]}>Points Reward</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }]}
                  value={formPt}
                  onChangeText={setFormPt}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme?.textMuted || '#94a3b8', marginTop: 4 }]}>Image URL / Base64</Text>
            <TextInput
              style={[styles.input, { height: 30, backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text, fontSize: 10.5 }]}
              value={formImage.length > 55 ? `${formImage.substring(0, 55)}... (Image Loaded)` : formImage}
              onChangeText={setFormImage}
              placeholder="e.g. https://... or upload above"
              placeholderTextColor={theme?.textMuted}
            />

            {/* Free Delivery Option Toggle */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: formFreeDelivery ? 'rgba(16, 185, 129, 0.12)' : (theme?.inputBg || '#1e293b'),
                borderColor: formFreeDelivery ? (theme?.secondary || '#10b981') : (theme?.border || '#334155'),
                borderWidth: 1.2,
                borderRadius: 10,
                padding: 8,
                paddingHorizontal: 10,
                marginTop: 6,
                marginBottom: 8,
              }}
              onPress={() => setFormFreeDelivery(!formFreeDelivery)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: theme?.text || '#ffffff' }}>
                    🚚 Free Delivery (ដឹកឥតគិតថ្លៃ)
                  </Text>
                  {formFreeDelivery && (
                    <View style={{ backgroundColor: theme?.secondary || '#10b981', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
                      <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#fff' }}>FREE</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 9.5, color: theme?.textMuted || '#94a3b8', marginTop: 1 }}>
                  Customer receives $0.00 delivery fee on checkout
                </Text>
              </View>
              <View
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: formFreeDelivery ? (theme?.secondary || '#10b981') : (theme?.border || '#334155'),
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#fff',
                    alignSelf: formFreeDelivery ? 'flex-end' : 'flex-start',
                  }}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.btnRow}>
              {product && (
                <TouchableOpacity
                  style={[styles.btn, styles.deleteBtn]}
                  onPress={handleDelete}
                  disabled={submitting}
                >
                  <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 11 }}>🗑️ Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: theme?.primary || '#10b981', flex: 2 }]}
                onPress={handleSave}
                disabled={submitting}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>
                  {submitting ? 'Saving...' : '💾 Save Product'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    width: '100%',
  },
  imgPreviewBox: {
    width: '100%',
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    marginBottom: 6,
    backgroundColor: '#ffffff',
  },
  imgPreview: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? {
      objectFit: 'contain',
      objectPosition: 'center',
    } : {}),
  },
  uploadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 2,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  input: {
    height: 35,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  catScroll: {
    marginBottom: 6,
  },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  stockPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  btn: {
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  autoGenIdBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
});
