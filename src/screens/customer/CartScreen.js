import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { resolveProductImage } from '../../utils/productImageHelper';
import {
  extractBraceletLinks,
  FullBraceletReceiptBox,
} from '../../components/ModularCharmLink';
import { VoucherSelector } from '../../components/VoucherSelector';

export const CartScreen = ({ onNavigate }) => {
  const {
    theme,
    t,
    cart,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
    settings,
    user,
    selectedVoucher,
    setSelectedVoucher,
    charms,
  } = useApp();

  const standardDeliveryFee = typeof settings.delivery_fee === 'number' ? settings.delivery_fee : (parseFloat(settings.delivery_fee) || 1.5);
  const hasItemWithFreeDelivery = cart.some(item => item.free_delivery === 1 || item.free_delivery === '1' || item.free_delivery === true);
  const meetsFreeDeliveryThreshold = Number(settings.free_delivery_threshold) > 0 && cartSubtotal >= Number(settings.free_delivery_threshold);

  const isFreeDelivery = cart.length > 0 && (hasItemWithFreeDelivery || meetsFreeDeliveryThreshold);
  const deliveryFee = isFreeDelivery ? 0 : standardDeliveryFee;
  const voucherDiscountPct = selectedVoucher ? (selectedVoucher.pct || 10) : 0;
  const voucherDiscountAmt = (cartSubtotal * voucherDiscountPct) / 100;
  const finalTotal = Math.max(0, cartSubtotal - voucherDiscountAmt + (cart.length > 0 ? deliveryFee : 0));

  const totalPointsEarned = cart.reduce((acc, item) => acc + (item.points || item.pt || 1) * (item.qty || 1), 0);

  // User's active vouchers
  const activeVouchers = Array.isArray(user?.vouchers)
    ? user.vouchers.filter((v) => !v.used)
    : [];

  if (cart.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
        <Text style={{ fontSize: 50, marginBottom: 16 }}>🛒</Text>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {t('cartEmpty')}
        </Text>
        <TouchableOpacity
          style={[styles.startShoppingBtn, { backgroundColor: theme.primary }]}
          onPress={() => onNavigate && onNavigate('home')}
          activeOpacity={0.8}
        >
          <Text style={styles.startShoppingBtnText}>
            🛍️ {t('startShopping')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centeredWrapper}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          🛒 {t('cartTitle')}
        </Text>

      {/* Cart Items List */}
      <View style={styles.itemsList}>
        {cart.map((item) => {
          const imageSource = resolveProductImage(item);
          const braceletLinks = extractBraceletLinks(item, charms);
          const isCustomBracelet = item.isCustom || braceletLinks.length > 0;

          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  flexDirection: 'column',
                  alignItems: 'stretch',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                <View
                  style={[
                    styles.itemImageWrap,
                    isCustomBracelet && { width: 88, height: 60, backgroundColor: '#0f172a' },
                  ]}
                >
                  <Image source={imageSource} style={styles.itemImage} resizeMode="contain" />
                </View>

                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.charmsSummary ? (
                    <Text style={[styles.charmSummary, { color: theme.gold }]} numberOfLines={1}>
                      {item.charmsSummary}
                    </Text>
                  ) : null}
                  <Text style={[styles.itemPrice, { color: theme.primary }]}>
                    ${item.price.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#eab308', fontWeight: '700', marginTop: 2 }}>
                    ⭐ +{(item.points || item.pt || 1) * item.qty} pt
                  </Text>
                </View>

                {/* Horizontal Quantity Controls & Remove */}
                <View style={styles.actionCol}>
                  <View style={[styles.qtyRowHorizontal, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <TouchableOpacity
                      style={styles.qtyBtnH}
                      onPress={() => updateCartQty(item.id, -1)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.qtyBtnHText, { color: theme.text }]}>−</Text>
                    </TouchableOpacity>

                    <Text style={[styles.qtyTextH, { color: theme.text }]}>{item.qty}</Text>

                    <TouchableOpacity
                      style={styles.qtyBtnH}
                      onPress={() => updateCartQty(item.id, 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.qtyBtnHText, { color: theme.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeFromCart(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: theme.error, fontSize: 11, fontWeight: '700' }}>
                      ✕ {t('remove')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Full Bracelet View Box inside Cart */}
              {braceletLinks.length > 0 && (
                <FullBraceletReceiptBox
                  links={braceletLinks}
                  styleId={item.styleId}
                  finish={item.bandFinish}
                  theme={theme}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Discount Voucher Selector */}
      <VoucherSelector onNavigateToRewards={() => onNavigate && onNavigate('rewards')} />

      {/* Summary Calculations */}
      <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.summaryTitle, { color: theme.text }]}>
          🧾 {t('summary')}
        </Text>

        <View style={styles.row}>
          <Text style={{ color: theme.textMuted }}>{t('subtotal')}</Text>
          <Text style={{ color: theme.text, fontWeight: '600' }}>${cartSubtotal.toFixed(2)}</Text>
        </View>

        {voucherDiscountAmt > 0 && (
          <>
            <View style={styles.row}>
              <Text style={{ color: theme.rose }}>
                {t('voucherDiscount')} ({selectedVoucher?.code || 'VOUCHER'} -{voucherDiscountPct}%)
              </Text>
              <Text style={{ color: theme.rose, fontWeight: '700' }}>
                -${voucherDiscountAmt.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.row, { backgroundColor: 'rgba(16, 185, 129, 0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginVertical: 2 }]}>
              <Text style={{ color: theme.secondary || '#10b981', fontWeight: '800', fontSize: 13 }}>
                ✨ {t('priceAfterDiscount')}
              </Text>
              <Text style={{ color: theme.secondary || '#10b981', fontWeight: '900', fontSize: 14 }}>
                ${(cartSubtotal - voucherDiscountAmt).toFixed(2)}
              </Text>
            </View>
          </>
        )}

        <View style={styles.row}>
          <Text style={{ color: theme.textMuted }}>{t('deliveryFee')}</Text>
          {isFreeDelivery ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: theme.textMuted, textDecorationLine: 'line-through', fontSize: 12 }}>
                ${standardDeliveryFee.toFixed(2)}
              </Text>
              <Text style={{ color: theme.secondary || '#10b981', fontWeight: '800' }}>
                🚚 FREE
              </Text>
            </View>
          ) : (
            <Text style={{ color: theme.text, fontWeight: '600' }}>${deliveryFee.toFixed(2)}</Text>
          )}
        </View>

        <View style={styles.row}>
          <Text style={{ color: theme.gold }}>⭐ {t('pointsEarn')}</Text>
          <Text style={{ color: theme.gold, fontWeight: '800' }}>+{totalPointsEarned} pt</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>{t('totalAmount')}</Text>
          <Text style={[styles.totalVal, { color: theme.secondary || '#10b981' }]}>
            ${finalTotal.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: theme.secondary || '#10b981' }]}
          onPress={() => onNavigate && onNavigate('checkout')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutBtnText}>
            {t('proceedCheckout')} (${finalTotal.toFixed(2)})
          </Text>
        </TouchableOpacity>
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
    maxWidth: 760,
    alignSelf: 'center',
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  startShoppingBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 11,
  },
  startShoppingBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  itemImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  itemImage: {
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
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  charmSummary: {
    fontSize: 11,
    marginVertical: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    marginLeft: 8,
  },
  qtyRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtnH: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnHText: {
    fontSize: 16,
    fontWeight: '800',
  },
  qtyTextH: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 6,
    minWidth: 22,
    textAlign: 'center',
  },
  removeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  summaryTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 10,
  },
  voucherRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  voucherBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  voucherBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  claimVoucherHint: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3.5,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 19,
    fontWeight: '900',
  },
  checkoutBtn: {
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
