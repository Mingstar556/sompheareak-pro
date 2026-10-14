import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';

// Recognized store promotional voucher codes
const STORE_PROMO_CODES = [
  { id: 'promo_welcome10', code: 'WELCOME10', pct: 10, label: '10% OFF Welcome' },
  { id: 'promo_sompheareak', code: 'SOMPHEAREAK', pct: 10, label: '10% OFF Storefront' },
  { id: 'promo_save15', code: 'SAVE15', pct: 15, label: '15% OFF Special' },
];

export const VoucherSelector = ({ onNavigateToRewards, compact = false }) => {
  const {
    theme,
    t,
    user,
    cartSubtotal,
    selectedVoucher,
    setSelectedVoucher,
    showToast,
  } = useApp();

  const [inputCode, setInputCode] = useState('');

  // Extract customer's active loyalty vouchers
  const userVouchers = Array.isArray(user?.vouchers)
    ? user.vouchers.filter((v) => v && !v.used)
    : [];

  const voucherDiscountPct = selectedVoucher ? (selectedVoucher.pct || 10) : 0;
  const voucherDiscountAmt = (cartSubtotal * voucherDiscountPct) / 100;
  const priceAfterDiscount = Math.max(0, cartSubtotal - voucherDiscountAmt);

  const applyVoucherObj = (voucherObj) => {
    setSelectedVoucher(voucherObj);
    if (showToast) {
      showToast(`🎉 Voucher ${voucherObj.code} (-${voucherObj.pct}%) Applied!`);
    }
  };

  const removeVoucher = () => {
    setSelectedVoucher(null);
    if (showToast) {
      showToast('Voucher removed');
    }
  };

  const handleApplyInput = () => {
    const raw = (inputCode || '').trim();
    if (!raw) {
      if (showToast) showToast('⚠️ Please enter a voucher code');
      return;
    }

    const clean = raw.toUpperCase();

    // 1. Check user redeemed vouchers
    const userMatch = userVouchers.find((v) => (v.code || '').toUpperCase() === clean);
    if (userMatch) {
      applyVoucherObj(userMatch);
      setInputCode('');
      return;
    }

    // 2. Check store promo list
    const promoMatch = STORE_PROMO_CODES.find((p) => p.code === clean);
    if (promoMatch) {
      applyVoucherObj({
        id: promoMatch.id,
        code: promoMatch.code,
        pct: promoMatch.pct,
        source: 'promo',
      });
      setInputCode('');
      return;
    }

    // 3. Dynamic patterns: WELCOME{pct}, SAVE{pct}, VIP{pct}, {pct}OFF, VOUCHER{pct}
    let parsedPct = null;
    const saveMatch = clean.match(/^(?:SAVE|VIP|DISCOUNT|VOUCHER|PROMO)(\d{1,2})$/);
    const offMatch = clean.match(/^(\d{1,2})OFF$/);

    if (clean === 'VIP' || clean === 'LUXURY') {
      parsedPct = 15;
    } else if (saveMatch) {
      parsedPct = parseInt(saveMatch[1], 10);
    } else if (offMatch) {
      parsedPct = parseInt(offMatch[1], 10);
    } else if (clean === 'WELCOME' || clean === 'VOUCHER') {
      parsedPct = 10;
    }

    if (parsedPct && parsedPct >= 5 && parsedPct <= 50) {
      applyVoucherObj({
        id: `promo_${clean}`,
        code: clean,
        pct: parsedPct,
        source: 'promo',
      });
      setInputCode('');
      return;
    }

    if (showToast) {
      showToast('⚠️ Invalid voucher code. Try WELCOME10 or SAVE15');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>🎟️</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {t('applyVoucher')}
          </Text>
        </View>

        {onNavigateToRewards && (
          <TouchableOpacity
            onPress={onNavigateToRewards}
            activeOpacity={0.7}
            style={styles.rewardsLink}
          >
            <Text style={{ fontSize: 11, color: theme.gold, fontWeight: '700' }}>
              ⭐ {t('myVouchersTitle')} ↗
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* When a voucher is actively applied */}
      {selectedVoucher ? (
        <View
          style={[
            styles.appliedCard,
            {
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderColor: theme.secondary || '#10b981',
            },
          ]}
        >
          <View style={styles.appliedHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
              <View style={[styles.appliedPill, { backgroundColor: theme.secondary || '#10b981' }]}>
                <Text style={styles.appliedPillText}>
                  ✓ {selectedVoucher.code || 'VOUCHER'}
                </Text>
              </View>
              <Text style={[styles.appliedPctText, { color: theme.secondary || '#10b981' }]}>
                -{voucherDiscountPct}% OFF
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.removeBtn, { borderColor: theme.error + '40' }]}
              onPress={removeVoucher}
              activeOpacity={0.7}
            >
              <Text style={{ color: theme.error, fontSize: 11, fontWeight: '800' }}>
                ✕ {t('removeVoucher')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Explicit discount and price after discount calculation */}
          <View style={[styles.discountBreakdownBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>
                {t('subtotal')}:
              </Text>
              <Text style={[styles.breakdownVal, { color: theme.text }]}>
                ${cartSubtotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.rose }]}>
                {t('voucherDiscount')} (-{voucherDiscountPct}%):
              </Text>
              <Text style={[styles.breakdownVal, { color: theme.rose, fontWeight: '800' }]}>
                -${voucherDiscountAmt.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabelBold, { color: theme.secondary || '#10b981' }]}>
                ✨ {t('priceAfterDiscount')}:
              </Text>
              <Text style={[styles.breakdownValBold, { color: theme.secondary || '#10b981' }]}>
                ${priceAfterDiscount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        /* Voucher Input & Quick Options */
        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder={t('enterVoucherCode')}
              placeholderTextColor={theme.textMuted}
              value={inputCode}
              onChangeText={setInputCode}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleApplyInput}
            />

            <TouchableOpacity
              style={[
                styles.applyBtn,
                {
                  backgroundColor: inputCode.trim() ? theme.primary : (theme.primary + '80'),
                },
              ]}
              onPress={handleApplyInput}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>{t('apply')}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Select Chips */}
          <View style={styles.chipsSection}>
            <Text style={[styles.chipsHeading, { color: theme.textMuted }]}>
              {userVouchers.length > 0 ? 'Your Vouchers & Promotions:' : 'Available Promotions (Tap to Apply):'}
            </Text>

            <View style={styles.chipsRow}>
              {/* User loyalty redeemed vouchers */}
              {userVouchers.map((v) => (
                <TouchableOpacity
                  key={v.id || v.code}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: theme.primary + '15',
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => applyVoucherObj(v)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: theme.primary }]}>
                    🎟️ {v.code} (-{v.pct || 10}%)
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Instant store promo codes */}
              {STORE_PROMO_CODES.map((promo) => (
                <TouchableOpacity
                  key={promo.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() =>
                    applyVoucherObj({
                      id: promo.id,
                      code: promo.code,
                      pct: promo.pct,
                      source: 'promo',
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: theme.text }]}>
                    🏷️ {promo.code} (-{promo.pct}%)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  rewardsLink: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  appliedCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  appliedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  appliedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  appliedPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  appliedPctText: {
    fontSize: 12,
    fontWeight: '800',
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  discountBreakdownBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
  },
  breakdownVal: {
    fontSize: 12,
  },
  breakdownLabelBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  breakdownValBold: {
    fontSize: 14,
    fontWeight: '900',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  inputSection: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  applyBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  chipsSection: {
    gap: 5,
  },
  chipsHeading: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
