import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../api/client';

export const RewardsScreen = ({ onNavigate }) => {
  const { theme, t, user, settings, refreshUser, showToast } = useApp();

  const [loading, setLoading] = useState(false);

  const voucherCost = settings.voucher_cost || 25;
  const voucherPct = settings.voucher_pct || 10;
  const userPoints = user?.points || 0;
  const canRedeem = userPoints >= voucherCost;

  const handleRedeem = async () => {
    if (!user?.id) {
      showToast('Please login to redeem vouchers');
      return;
    }
    if (!canRedeem) {
      showToast(`You need ${voucherCost - userPoints} more points to redeem`);
      return;
    }

    setLoading(true);
    const res = await ApiClient.redeemVoucher(user.id);
    setLoading(false);

    if (res.ok) {
      await refreshUser();
      Alert.alert(
        '🎉 Voucher Redeemed!',
        `You have successfully claimed a ${voucherPct}% OFF voucher! Use it in Checkout.`,
        [{ text: 'Use in Cart', onPress: () => onNavigate && onNavigate('cart') }, { text: 'OK' }]
      );
    } else {
      Alert.alert('Redeem Failed', res.error || 'Could not redeem voucher');
    }
  };

  const vouchers = Array.isArray(user?.vouchers) ? user.vouchers : [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.scroll}>
      {/* Points Balance Big Card */}
      <View style={[styles.balanceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.balanceTag, { color: theme.gold }]}>
          ⭐ {t('rewardsTitle')}
        </Text>
        <Text style={[styles.balanceNum, { color: theme.text }]}>
          {userPoints} <Text style={{ fontSize: 20, color: theme.gold }}>pt</Text>
        </Text>

        <Text style={[styles.balanceHint, { color: theme.textMuted }]}>
          {canRedeem
            ? t('readyClaimVoucher')
            : `${voucherCost - userPoints} ${t('ptNextVoucher')}`}
        </Text>

        <TouchableOpacity
          style={[
            styles.redeemBtn,
            { backgroundColor: canRedeem ? theme.primary : theme.border },
          ]}
          onPress={handleRedeem}
          disabled={!canRedeem || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.redeemBtnText}>
            {loading ? 'Redeeming...' : t('redeemBtn', { pct: voucherPct, cost: voucherCost })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* How to Earn Points Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          💡 {t('howToEarnTitle')}
        </Text>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleDot}>•</Text>
          <Text style={[styles.ruleText, { color: theme.textMuted }]}>{t('ruleMini')}</Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleDot}>•</Text>
          <Text style={[styles.ruleText, { color: theme.textMuted }]}>{t('ruleReady')}</Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleDot}>•</Text>
          <Text style={[styles.ruleText, { color: theme.textMuted }]}>
            {t('ruleCustom', { pt: settings.custom_pt || 5 })}
          </Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleDot}>•</Text>
          <Text style={[styles.ruleText, { color: theme.textMuted }]}>
            {t('ruleVoucher', { cost: voucherCost, pct: voucherPct })}
          </Text>
        </View>
      </View>

      {/* My Vouchers */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          🎟️ {t('myVouchersTitle')}
        </Text>

        {vouchers.length === 0 ? (
          <Text style={[styles.emptyVouchers, { color: theme.textMuted }]}>
            {t('noVouchersYet', { cost: voucherCost })}
          </Text>
        ) : (
          vouchers.map((v) => (
            <View
              key={v.id}
              style={[
                styles.voucherItem,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
            >
              <View>
                <Text style={[styles.voucherCode, { color: theme.primary }]}>
                  {v.code || 'VOUCHER-10'}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted }}>
                  {v.pct || 10}% Discount Voucher
                </Text>
              </View>
              <View style={[styles.usedBadge, { backgroundColor: v.used ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={{ color: v.used ? theme.error : theme.success, fontSize: 11, fontWeight: '700' }}>
                  {v.used ? t('used') : t('available')}
                </Text>
              </View>
            </View>
          ))
        )}
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
    gap: 10,
  },
  balanceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  balanceTag: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  balanceNum: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 4,
  },
  balanceHint: {
    fontSize: 11.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  redeemBtn: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 3,
  },
  ruleDot: {
    color: '#10b981',
    fontWeight: '800',
  },
  ruleText: {
    fontSize: 12,
    flex: 1,
  },
  emptyVouchers: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  voucherItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  voucherCode: {
    fontSize: 14,
    fontWeight: '800',
  },
  usedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
