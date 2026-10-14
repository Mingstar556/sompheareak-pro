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
  Image,
} from 'react-native';
import { TelegramAvatar } from './TelegramAvatar';
import { TelegramIcon } from './TelegramIcon';
import { useApp } from '../context/AppContext';
import {
  getOrderItemImageSource,
  getOrderItemCategory,
  formatReceiptNumber,
  getOrderVoucherInfo,
  openTelegramCustomer,
  cleanTelegramUsername,
} from '../utils/orderReceiptHelper';
import {
  ModularCharmLink,
  ConnectedBraceletRibbon,
  extractBraceletLinks,
  FullBraceletReceiptBox,
} from './ModularCharmLink';

export const AdminEditReceiptModal = ({
  visible,
  order,
  onClose,
  onSave,
  theme,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('Pending');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('1.50');
  const [discount, setDiscount] = useState('0.00');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  // Add Item to Receipt (Admin only)
  const { products: storeProducts = [], charms = [] } = useApp() || {};
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');

  const handleSelectStoreProduct = (prodId) => {
    setSelectedProductId(prodId);
    const prod = storeProducts.find((p) => p.id === prodId);
    if (prod) {
      setCustomItemName(prod.name || '');
      setCustomItemPrice(String(prod.price || 0));
    }
  };

  const handleAddItemToReceipt = () => {
    const name = customItemName.trim();
    const price = parseFloat(customItemPrice) || 0;
    const qty = Math.max(1, parseInt(customItemQty, 10) || 1);

    if (!name) {
      Alert.alert('Missing Item Name', 'Please select a store product or type an item name.');
      return;
    }

    const prod = storeProducts.find((p) => p.id === selectedProductId);

    const newItem = {
      id: selectedProductId || `item_${Date.now()}`,
      productId: selectedProductId || '',
      name: name,
      price: price,
      qty: qty,
      image: prod?.image || prod?.img || '',
      category: prod?.category || prod?.cat || '',
      points: Math.max(1, Math.round(price * 0.5)),
      isCustomAdd: true,
    };

    setItems((prev) => [...prev, newItem]);
    // Reset inputs
    setSelectedProductId('');
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty('1');
    setIsAddingItem(false);
  };

  useEffect(() => {
    if (order && visible) {
      let parsedItems = [];
      try {
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch {
        parsedItems = [];
      }

      let contact = {};
      if (typeof order.contact === 'string') {
        try { contact = JSON.parse(order.contact); } catch { contact = {}; }
      } else if (order.contact && typeof order.contact === 'object') {
        contact = order.contact;
      }

      setCustomerName(order.customer_name || contact.name || contact.customer_name || '');
      setPhone(order.phone || contact.phone || '');
      const rawTg = order.telegram_username || contact.telegram || contact.telegram_username || '';
      setTelegramUsername(cleanTelegramUsername(rawTg));
      setAddress(order.address || contact.address || '');
      setStatus(order.status || 'Pending');
      setPaymentMethod(order.payment_method || order.payment || contact.payment || 'ABA KHQR');
      setDeliveryFee(String(order.delivery !== undefined ? order.delivery : 1.5));
      setDiscount(String(order.discount !== undefined ? order.discount : 0));
      setNotes(order.notes || order.note || contact.notes || '');
      setItems(Array.isArray(parsedItems) ? parsedItems.map((it) => ({ ...it })) : []);
    }
  }, [order, visible]);

  if (!order) return null;

  const handleUpdateItemQty = (index, delta) => {
    setItems((prev) => {
      const copy = [...prev];
      const cur = copy[index];
      const newQty = Math.max(1, (parseInt(cur.qty, 10) || 1) + delta);
      copy[index] = { ...cur, qty: newQty };
      return copy;
    });
  };

  const handleRemoveItem = (index) => {
    Alert.alert('Remove Item', 'Remove this product from the receipt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setItems((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  // Recalculate totals
  const subtotal = items.reduce((sum, it) => sum + (+it.price || 0) * (+it.qty || 1), 0);
  const numDelivery = parseFloat(deliveryFee) || 0;
  const numDiscount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - numDiscount + numDelivery);

  const handleSave = async () => {
    if (!customerName.trim()) {
      Alert.alert('Validation Error', 'Customer name is required');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Validation Error', 'Receipt must contain at least one item');
      return;
    }

    setSaving(true);
    const payload = {
      customer_name: customerName.trim(),
      phone: phone.trim(),
      telegram_username: cleanTelegramUsername(telegramUsername),
      address: address.trim(),
      status,
      payment_method: paymentMethod.trim(),
      delivery: numDelivery,
      discount: numDiscount,
      voucher: order.voucher || order.voucher_code || '',
      subtotal,
      total,
      notes: notes.trim(),
      items,
    };

    try {
      await onSave(order.id, payload);
      setSaving(false);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const statusOptions = ['Pending', 'Confirmed', 'Delivering', 'Completed', 'Rejected', 'Cancelled'];

  const receiptNumber = formatReceiptNumber(order, order.receipt_number || order.id);
  const voucherInfo = getOrderVoucherInfo(order);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <View style={[styles.badgeRow, { flexWrap: 'wrap', gap: 6 }]}>
                <View style={[styles.receiptPill, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                  <Text style={[styles.receiptPillText, { color: theme.primary }]}>
                    Receipt #{receiptNumber}
                  </Text>
                </View>
                {voucherInfo && (
                  <View style={[styles.receiptPill, { backgroundColor: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec4899' }]}>
                    <Text style={[styles.receiptPillText, { color: '#ec4899', fontSize: 11 }]}>
                      🎟️ Voucher: {voucherInfo.code} (-{voucherInfo.pct}%)
                    </Text>
                  </View>
                )}
                <Text style={{ fontSize: 11, color: theme.textMuted }}>
                  Placed: {order.created_at || 'Recently'}
                </Text>
              </View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                ✏️ Edit Receipt & Customer Details
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={{ fontSize: 18, color: theme.textMuted, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {/* 1. Customer Information */}
            <View style={[styles.sectionBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <TelegramAvatar size={24} style={{ marginRight: 8 }} ringColor="#229ED9" />
                <Text style={[styles.sectionHeading, { color: theme.primary, marginBottom: 0 }]}>
                  Customer Profile & Information
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Customer Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Full Name"
                placeholderTextColor={theme.textMuted}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Phone Number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+855..."
                    placeholderTextColor={theme.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={[styles.inputLabel, { color: theme.textMuted, marginBottom: 0 }]}>Telegram (@username)</Text>
                    {cleanTelegramUsername(telegramUsername) ? (
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                          backgroundColor: 'rgba(34, 158, 217, 0.14)',
                          borderColor: 'rgba(34, 158, 217, 0.45)',
                          borderWidth: 1,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 5,
                          cursor: 'pointer',
                        }}
                        onPress={() => openTelegramCustomer(telegramUsername)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Open Telegram chat"
                      >
                        <TelegramIcon size={11} variant="circle" />
                        <Text style={{ color: '#229ED9', fontSize: 10, fontWeight: '800' }}>Chat ↗</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                    value={telegramUsername}
                    onChangeText={setTelegramUsername}
                    placeholder="username"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Delivery Address / Province</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={address}
                onChangeText={setAddress}
                placeholder="House / Street / City / Province"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* 2. Order Status & Payment Method */}
            <View style={[styles.sectionBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.sectionHeading, { color: theme.primary }]}>
                📦 Status & Payment Method
              </Text>

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Order Status</Text>
              <View style={styles.statusOptionsWrap}>
                {statusOptions.map((st) => {
                  const isSelected = status.toLowerCase() === st.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusChip,
                        isSelected
                          ? [styles.statusChipActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
                          : { backgroundColor: theme.card, borderColor: theme.border },
                      ]}
                      onPress={() => setStatus(st)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.statusChipText, { color: isSelected ? '#ffffff' : theme.text }]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: 10 }]}>Payment Method & Details</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={paymentMethod}
                onChangeText={setPaymentMethod}
                placeholder="ABA KHQR (Paid), Cash on Delivery, etc."
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* 3. Items on Receipt */}
            <View style={[styles.sectionBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.sectionHeading, { color: theme.primary }]}>
                🛍️ Items on Receipt ({items.length})
              </Text>

              {items.map((it, idx) => {
                const imgSource = getOrderItemImageSource(it, storeProducts, charms);
                const catLabel = getOrderItemCategory(it, storeProducts);
                const braceletLinks = extractBraceletLinks(it, charms);
                const isCharmOrBracelet = it.isCustom ||
                  catLabel === 'CHARM' ||
                  catLabel === 'BRACELET' ||
                  (it.name && it.name.toLowerCase().includes('charm')) ||
                  braceletLinks.length > 0;

                return (
                  <View
                    key={idx}
                    style={[
                      styles.itemCard,
                      { backgroundColor: theme.card, borderColor: theme.border, flexDirection: 'column' },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                      {isCharmOrBracelet && !(it.image && typeof it.image === 'string' && it.image.startsWith('data:image/')) && !it.braceletPreviewImage ? (
                        <View style={styles.itemThumbWrap}>
                          <ModularCharmLink
                            charm={braceletLinks[0] || it}
                            size="receipt"
                            showHook={false}
                          />
                        </View>
                      ) : (
                        <Image
                          source={imgSource}
                          style={[styles.itemThumb, { borderColor: theme.border }]}
                          resizeMode={isCharmOrBracelet ? "contain" : "cover"}
                        />
                      )}

                      <View style={{ flex: 1, marginRight: 8, marginLeft: 8 }}>
                        <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2}>
                          {it.name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                          <View style={[styles.catBadge, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                            <Text style={[styles.catBadgeText, { color: theme.textMuted }]}>
                              {catLabel}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textMuted }}>
                            ${(+it.price || 0).toFixed(2)} each {it.charms ? `• [${it.charms}]` : ''}
                          </Text>
                        </View>
                      </View>

                    {/* Quantity adjustment */}
                    <View style={styles.qtyControlRow}>
                      <TouchableOpacity
                        style={[styles.qtyBtn, { borderColor: theme.border }]}
                        onPress={() => handleUpdateItemQty(idx, -1)}
                        disabled={(parseInt(it.qty, 10) || 1) <= 1}
                      >
                        <Text style={[styles.qtyBtnText, { color: theme.text }]}>−</Text>
                      </TouchableOpacity>

                      <Text style={[styles.qtyNum, { color: theme.text }]}>{it.qty || 1}</Text>

                      <TouchableOpacity
                        style={[styles.qtyBtn, { borderColor: theme.border }]}
                        onPress={() => handleUpdateItemQty(idx, 1)}
                      >
                        <Text style={[styles.qtyBtnText, { color: theme.text }]}>+</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.deleteItemBtn, { borderColor: theme.error + '40' }]}
                        onPress={() => handleRemoveItem(idx)}
                      >
                        <Text style={{ color: theme.error, fontSize: 13, fontWeight: '800' }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Full Bracelet View Box for custom Italian charms */}
                  {braceletLinks.length > 0 && (
                    <FullBraceletReceiptBox
                      links={braceletLinks}
                      styleId={it.styleId}
                      finish={it.bandFinish}
                      theme={theme}
                    />
                  )}
                </View>
              );
            })}

              {/* Button to Add More Products / Custom Items to the Receipt */}
              {!isAddingItem ? (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(34, 158, 217, 0.12)',
                    borderWidth: 1,
                    borderColor: '#229ED9',
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    marginTop: 8,
                    gap: 6,
                  }}
                  onPress={() => setIsAddingItem(true)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16, color: '#229ED9', fontWeight: '900' }}>＋</Text>
                  <Text style={{ fontSize: 13, color: '#229ED9', fontWeight: '800' }}>
                    Add Product / Item to Receipt (Admin)
                  </Text>
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    backgroundColor: theme.card,
                    borderColor: '#229ED9',
                    borderWidth: 1.5,
                    borderRadius: 14,
                    padding: 12,
                    marginTop: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#229ED9' }}>
                      ➕ Add Product to Customer's Receipt
                    </Text>
                    <TouchableOpacity onPress={() => setIsAddingItem(false)}>
                      <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '700' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quick Select from Store Catalog */}
                  {storeProducts.length > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={[styles.inputLabel, { color: theme.textMuted, fontSize: 11 }]}>
                        Quick Pick From Store Products
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                        {storeProducts.slice(0, 10).map((prod) => (
                          <TouchableOpacity
                            key={prod.id}
                            style={{
                              backgroundColor: selectedProductId === prod.id ? '#229ED9' : theme.inputBg,
                              borderWidth: 1,
                              borderColor: selectedProductId === prod.id ? '#229ED9' : theme.border,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                              marginRight: 6,
                            }}
                            onPress={() => handleSelectStoreProduct(prod.id)}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: selectedProductId === prod.id ? '#fff' : theme.text,
                              }}
                            >
                              {prod.name} (${(+prod.price || 0).toFixed(2)})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Product / Item Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, marginBottom: 8 }]}
                    placeholder="e.g. Extra Italian Charm, Special Gift Box"
                    placeholderTextColor={theme.textMuted}
                    value={customItemName}
                    onChangeText={setCustomItemName}
                  />

                  <View style={styles.twoCol}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Price ($) *</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                        placeholder="0.00"
                        placeholderTextColor={theme.textMuted}
                        value={customItemPrice}
                        onChangeText={setCustomItemPrice}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Quantity *</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                        placeholder="1"
                        placeholderTextColor={theme.textMuted}
                        value={customItemQty}
                        onChangeText={setCustomItemQty}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: '#229ED9',
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                      onPress={handleAddItemToReceipt}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                        ✓ Add Item to Receipt
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Delivery and Discount adjustment */}
              <View style={[styles.twoCol, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Delivery Fee ($)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                    value={deliveryFee}
                    onChangeText={setDeliveryFee}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Discount ($)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                    value={discount}
                    onChangeText={setDiscount}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Total Summary */}
              <View style={[styles.totalsBox, { borderTopColor: theme.border }]}>
                <View style={styles.summaryRow}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Subtotal:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Delivery Fee:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>+${numDelivery.toFixed(2)}</Text>
                </View>
                {numDiscount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={{ fontSize: 12, color: theme.error }}>Discount Applied:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.error }}>-${numDiscount.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.border }]}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Total Amount:</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: theme.primary }}>${total.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* 4. Notes / Memo */}
            <View style={[styles.sectionBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.sectionHeading, { color: theme.primary }]}>
                📝 Special Order Notes / Admin Memo
              </Text>
              <TextInput
                style={[styles.input, { height: 60, backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Customer instructions, delivery timing, remarks..."
                placeholderTextColor={theme.textMuted}
                multiline
              />
            </View>
          </ScrollView>

          {/* Modal Footer Buttons */}
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={onClose} activeOpacity={0.8}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Saving...' : 'Save Receipt Changes 💾'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  receiptPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  receiptPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  scrollBody: {
    flex: 1,
    ...(Platform.OS === 'web' ? {
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      overflowY: 'auto',
    } : {}),
  },
  scrollContent: {
    padding: 12,
    gap: 10,
  },
  sectionBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  sectionHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  input: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  statusOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipActive: {},
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
  },
  itemThumbWrap: {
    width: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  qtyNum: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteItemBtn: {
    padding: 4,
    marginLeft: 4,
  },
  totalsBox: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
