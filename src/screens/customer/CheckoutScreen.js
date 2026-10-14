import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Linking,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../api/client';
import { TelegramIcon } from '../../components/TelegramIcon';
import { TelegramAvatar } from '../../components/TelegramAvatar';
import { VoucherSelector } from '../../components/VoucherSelector';
import { openTelegramCustomer, cleanTelegramUsername } from '../../utils/orderReceiptHelper';

export const CAMBODIA_PROVINCES = [
  { id: 'phnom_penh', nameEn: 'Phnom Penh', nameKm: 'រាជធានីភ្នំពេញ', isCapital: true },
  { id: 'kandal', nameEn: 'Kandal', nameKm: 'ខេត្តកណ្តាល' },
  { id: 'siem_reap', nameEn: 'Siem Reap', nameKm: 'ខេត្តសៀមរាប' },
  { id: 'battambang', nameEn: 'Battambang', nameKm: 'ខេត្តបាត់ដំបង' },
  { id: 'preah_sihanouk', nameEn: 'Preah Sihanouk (Kampong Som)', nameKm: 'ខេត្តព្រះសីហនុ' },
  { id: 'kampot', nameEn: 'Kampot', nameKm: 'ខេត្តកំពត' },
  { id: 'kampong_cham', nameEn: 'Kampong Cham', nameKm: 'ខេត្តកំពង់ចាម' },
  { id: 'kampong_speu', nameEn: 'Kampong Speu', nameKm: 'ខេត្តកំពង់ស្ពឺ' },
  { id: 'kampong_chhnang', nameEn: 'Kampong Chhnang', nameKm: 'ខេត្តកំពង់ឆ្នាំង' },
  { id: 'kampong_thom', nameEn: 'Kampong Thom', nameKm: 'ខេត្តកំពង់ធំ' },
  { id: 'banteay_meanchey', nameEn: 'Banteay Meanchey', nameKm: 'ខេត្តបន្ទាយមានជ័យ' },
  { id: 'kep', nameEn: 'Kep', nameKm: 'ខេត្តកែប' },
  { id: 'koh_kong', nameEn: 'Koh Kong', nameKm: 'ខេត្តកោះកុង' },
  { id: 'kratie', nameEn: 'Kratie', nameKm: 'ខេត្តក្រចេះ' },
  { id: 'mondulkiri', nameEn: 'Mondulkiri', nameKm: 'ខេត្តមណ្ឌលគិរី' },
  { id: 'oddar_meanchey', nameEn: 'Oddar Meanchey', nameKm: 'ខេត្តឧត្តរមានជ័យ' },
  { id: 'pailin', nameEn: 'Pailin', nameKm: 'ខេត្តប៉ៃលិន' },
  { id: 'preah_vihear', nameEn: 'Preah Vihear', nameKm: 'ខេត្តព្រះវិហារ' },
  { id: 'prey_veng', nameEn: 'Prey Veng', nameKm: 'ខេត្តព្រៃវែង' },
  { id: 'pursat', nameEn: 'Pursat', nameKm: 'ខេត្តពោធិ៍សាត់' },
  { id: 'ratanakiri', nameEn: 'Ratanakiri', nameKm: 'ខេត្តរតនគិរី' },
  { id: 'stung_treng', nameEn: 'Stung Treng', nameKm: 'ខេត្តស្ទឹងត្រែង' },
  { id: 'svay_rieng', nameEn: 'Svay Rieng', nameKm: 'ខេត្តស្វាយរៀង' },
  { id: 'takeo', nameEn: 'Takeo', nameKm: 'ខេត្តតាកែវ' },
  { id: 'tboung_khmum', nameEn: 'Tboung Khmum', nameKm: 'ខេត្តត្បូងឃ្មុំ' },
];

export const CheckoutScreen = ({ onNavigate }) => {
  const {
    theme,
    t,
    cart,
    cartSubtotal,
    settings,
    user,
    isGuest,
    loginCustomer,
    registerCustomer,
    selectedVoucher,
    setSelectedVoucher,
    clearCart,
    refreshUser,
    refreshOrders,
    addSubmittedOrder,
    showToast,
  } = useApp();

  const [name, setName] = useState(user?.name || user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [telegramUsername, setTelegramUsername] = useState(
    user?.telegram_username || (user?.username && !user.username.includes(' ') ? user.username : '')
  );
  const [selectedProvince, setSelectedProvince] = useState(CAMBODIA_PROVINCES[0]); // Default Phnom Penh
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProvinceModalOpen, setIsProvinceModalOpen] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Guest Authentication Modal State (Required when placing order)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const rate = Number(settings?.exchange_rate) || 4100;

  // Auto-fill user credentials when logged in
  useEffect(() => {
    if (user) {
      if (!name || name === 'guest_user') setName(user.name || user.username || '');
      if (!phone) setPhone(user.phone || '');
      if (!telegramUsername) {
        setTelegramUsername(
          user.telegram_username || (user.username && !user.username.includes(' ') ? user.username : '')
        );
      }
    }
  }, [user]);

  const handleModalLogin = async () => {
    setAuthError('');
    if (!authPhone.trim() || !authPassword.trim()) {
      setAuthError('Please enter your phone number or Telegram and password');
      return;
    }
    setAuthLoading(true);
    let formattedIdent = authPhone.trim();
    const rawDigits = formattedIdent.replace(/\D/g, '');
    if (rawDigits.length >= 8 && rawDigits.length <= 11 && !formattedIdent.includes('@')) {
      formattedIdent = `+855 ${rawDigits.replace(/^0/, '')}`;
    }

    const res = await loginCustomer(formattedIdent, authPassword.trim());
    setAuthLoading(false);
    if (res.ok && res.user) {
      setName(res.user.name || res.user.username || '');
      setPhone(res.user.phone || '');
      if (res.user.telegram_username || res.user.username) {
        setTelegramUsername(res.user.telegram_username || res.user.username);
      }
      setIsAuthModalOpen(false);
      showToast(`✓ Welcome @${res.user.username}! You can now complete your order.`);
    } else {
      setAuthError(res.error || 'Invalid account credentials');
    }
  };

  const handleModalRegister = async () => {
    setAuthError('');
    const cleanUser = authUsername.trim().replace(/^@/, '');
    if (!cleanUser) {
      setAuthError('Telegram username is required (e.g. @sophal)');
      return;
    }
    const rawDigits = authPhone.trim().replace(/\D/g, '');
    const cleanDigits = rawDigits.replace(/^0/, '');
    if (cleanDigits.length < 8 || cleanDigits.length > 10) {
      setAuthError('Please enter a valid phone number (8-10 digits)');
      return;
    }
    const formattedPhone = `+855 ${cleanDigits}`;
    if (!authPassword || authPassword.length < 4) {
      setAuthError('Password must be at least 4 characters');
      return;
    }
    if (authPassword !== authConfirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setAuthLoading(true);
    const res = await registerCustomer(cleanUser, formattedPhone, authPassword);
    setAuthLoading(false);
    if (res.ok && res.user) {
      setName(res.user.name || res.user.username || '');
      setPhone(res.user.phone || '');
      setTelegramUsername(cleanUser);
      setIsAuthModalOpen(false);
      showToast(`✓ Account created! Welcome @${res.user.username}.`);
    } else {
      setAuthError(res.error || 'Account registration failed');
    }
  };

  // Keyboard navigation input references
  const phoneInputRef = useRef(null);
  const telegramInputRef = useRef(null);
  const addressInputRef = useRef(null);
  const noteInputRef = useRef(null);

  const standardDeliveryFee = typeof settings.delivery_fee === 'number' ? settings.delivery_fee : (parseFloat(settings.delivery_fee) || 1.5);
  const hasItemWithFreeDelivery = cart.some(item => item.free_delivery === 1 || item.free_delivery === '1' || item.free_delivery === true);
  const meetsFreeDeliveryThreshold = Number(settings.free_delivery_threshold) > 0 && cartSubtotal >= Number(settings.free_delivery_threshold);

  const isFreeDelivery = cart.length > 0 && (hasItemWithFreeDelivery || meetsFreeDeliveryThreshold);
  const deliveryFee = isFreeDelivery ? 0 : standardDeliveryFee;
  const voucherDiscountPct = selectedVoucher ? (selectedVoucher.pct || 10) : 0;
  const voucherDiscountAmt = (cartSubtotal * voucherDiscountPct) / 100;
  const finalTotal = Math.max(0, cartSubtotal - voucherDiscountAmt + deliveryFee);
  const totalPoints = cart.reduce((acc, item) => acc + (item.points || item.pt || 1) * (item.qty || 1), 0);

  const isPhnomPenh = selectedProvince.id === 'phnom_penh';

  // Province selection handler:
  // If destination is outside Phnom Penh, automatically switch to ABA KHQR and strictly lock it
  const handleSelectProvince = (prov) => {
    setSelectedProvince(prov);
    setIsProvinceModalOpen(false);
    setProvinceSearch('');

    if (prov.id !== 'phnom_penh') {
      setPaymentMethod('khqr');
      showToast(`📍 ${prov.nameEn}: Payment switched to ABA KHQR Scan`);
    }
  };

  // Payment method selection handler:
  // Strictly prevent switching to COD if destination is outside Phnom Penh
  const handleSelectPaymentMethod = (method) => {
    if (method === 'cod') {
      if (!isPhnomPenh) {
        Alert.alert(
          '🔒 COD Only Available in Phnom Penh',
          `Cash on Delivery (COD) is restricted to Phnom Penh city deliveries. Orders to ${selectedProvince.nameEn} are delivered via provincial logistics and must be paid securely via ABA KHQR (Bakong Scan).`,
          [{ text: 'Understood', style: 'default' }]
        );
        return;
      }
      setPaymentMethod('cod');
    } else {
      setPaymentMethod('khqr');
    }
  };

  const handlePlaceOrder = async () => {
    // Require user login before placing order (as requested)
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('🔒 Please log in or create an account to place this order');
      return;
    }

    if (!name.trim() || !phone.trim() || !address.trim()) {
      showToast('⚠️ Please provide your Name, Phone Number, and Address');
      return;
    }

    setLoading(true);

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const clientReceiptId = `SR-${dateStr}-${randCode}`;
    const cleanTlg = cleanTelegramUsername(
      telegramUsername || user?.telegram_username || (user?.username && !user.username.includes(' ') ? user.username : '')
    );
    const tlgUsername = cleanTlg;
    const provinceString = `${selectedProvince.nameEn} (${selectedProvince.nameKm})`;

    const payload = {
      id: clientReceiptId,
      receipt_number: clientReceiptId,
      user_id: user?.id || user?.username || 'guest_user',
      customer_name: name.trim(),
      telegram_username: tlgUsername,
      phone: phone.trim(),
      contact: {
        name: name.trim(),
        phone: phone.trim(),
        telegram: tlgUsername,
        telegram_username: tlgUsername,
        address: address.trim(),
        province: provinceString,
        province_id: selectedProvince.id,
        notes: note.trim(),
        payment: paymentMethod === 'cod' ? 'COD (Cash on Delivery)' : 'ABA KHQR (Bakong Scan)',
        payment_type: paymentMethod === 'cod' ? 'COD' : 'KHQR',
      },
      province: provinceString,
      address: address.trim(),
      notes: note.trim(),
      payment_method: paymentMethod === 'cod' ? 'COD (Cash on Delivery)' : 'ABA KHQR (Bakong Scan)',
      items: cart.map(i => ({
        id: i.id,
        productId: i.productId || i.id,
        product_id: i.productId || i.id,
        name: i.name,
        price: i.price,
        qty: i.qty || 1,
        image: i.image || i.img || '',
        braceletPreviewImage: i.braceletPreviewImage || i.image || '',
        category: i.category || i.cat || '',
        points: i.points || i.pt || 1,
        pt: i.pt || i.points || 1,
        isCustom: !!i.isCustom,
        charms: i.charmsSummary || '',
        braceletLinks: i.braceletLinks || i.links || [],
        styleId: i.styleId || '',
        bandFinish: i.bandFinish || '',
        boxOption: i.boxOption || 'basic',
        boxPrice: i.boxPrice || (i.boxOption === 'premium' ? 0.5 : 0),
      })),
      subtotal: cartSubtotal,
      discount: voucherDiscountAmt,
      delivery: deliveryFee,
      total: finalTotal,
      voucher: selectedVoucher?.code || null,
      voucher_code: selectedVoucher?.code || null,
      voucher_pct: voucherDiscountPct,
      subtotal_after_discount: Math.max(0, cartSubtotal - voucherDiscountAmt),
      earned: totalPoints,
      earned_points: totalPoints,
    };

    const res = await ApiClient.checkout(payload);
    setLoading(false);

    if (res.ok) {
      clearCart();
      setSelectedVoucher(null);
      refreshUser();
      const newOrderObj = {
        id: res.receipt_number || res.order_id || res.id || clientReceiptId,
        receipt_number: res.receipt_number || res.order_id || res.id || clientReceiptId,
        customer_name: name.trim(),
        telegram_username: tlgUsername,
        phone: phone.trim(),
        province: provinceString,
        address: `${provinceString}${address.trim() ? ' - ' + address.trim() : ''}`,
        payment: paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'ABA KHQR (Scan to Pay)',
        payment_method: paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'ABA KHQR (Scan to Pay)',
        items: payload.items,
        subtotal: cartSubtotal,
        discount: voucherDiscountAmt,
        voucher: selectedVoucher?.code || null,
        voucher_code: selectedVoucher?.code || null,
        voucher_pct: voucherDiscountPct,
        subtotal_after_discount: Math.max(0, cartSubtotal - voucherDiscountAmt),
        delivery: deliveryFee,
        total: finalTotal,
        earned: totalPoints,
        status: 'Pending',
        created_at: new Date().toISOString(),
      };
      if (addSubmittedOrder) addSubmittedOrder(newOrderObj);
      refreshOrders();
      setOrderSuccess({
        id: res.receipt_number || res.order_id || res.id || clientReceiptId,
        receipt_number: res.receipt_number || res.order_id || res.id || clientReceiptId,
        customer_name: name.trim(),
        telegram_username: tlgUsername,
        phone: phone.trim(),
        province: provinceString,
        total: finalTotal,
        points: totalPoints,
      });
      showToast('🎉 ' + t('orderSubmitted'));
    } else {
      Alert.alert('Checkout Failed', res.error || 'Could not place order');
    }
  };

  const filteredProvinces = CAMBODIA_PROVINCES.filter((p) => {
    if (!provinceSearch.trim()) return true;
    const q = provinceSearch.toLowerCase();
    return p.nameEn.toLowerCase().includes(q) || p.nameKm.toLowerCase().includes(q);
  });

  if (orderSuccess) {
    return (
      <View style={[styles.successContainer, { backgroundColor: theme.bg }]}>
        <View style={[styles.successCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ fontSize: 50, marginBottom: 12 }}>🎉</Text>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            {t('orderSubmitted')}
          </Text>

          {/* Official Order Receipt Number Badge */}
          <View style={[styles.receiptPillBadge, { backgroundColor: theme.gold + '20', borderColor: theme.gold }]}>
            <Text style={[styles.receiptPillText, { color: theme.gold }]}>
              Official Receipt #{orderSuccess.receipt_number || orderSuccess.id}
            </Text>
          </View>

          {/* Customer Summary Box */}
          <View style={[styles.receiptSummaryBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <View style={styles.summaryItemRow}>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>Customer:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TelegramAvatar size={18} ring={false} />
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>
                  {orderSuccess.customer_name}
                </Text>
              </View>
            </View>
            {orderSuccess.telegram_username ? (
              <View style={styles.summaryItemRow}>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>Telegram:</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                  onPress={() => openTelegramCustomer(orderSuccess.telegram_username)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open Telegram Profile"
                >
                  <TelegramIcon size={14} variant="circle" />
                  <Text style={{ color: '#229ED9', fontSize: 12, fontWeight: '700' }}>
                    @{orderSuccess.telegram_username}
                  </Text>
                  <Text style={{ color: '#229ED9', fontSize: 11, fontWeight: '900' }}>↗</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.summaryItemRow}>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>Phone:</Text>
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>
                📞 {orderSuccess.phone}
              </Text>
            </View>
            <View style={styles.summaryItemRow}>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>Province / City:</Text>
              <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>
                📍 {orderSuccess.province}
              </Text>
            </View>
            <View style={styles.summaryItemRow}>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>Total Paid:</Text>
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>
                ${orderSuccess.total.toFixed(2)} USD (≈ {Math.round(orderSuccess.total * rate).toLocaleString()} ៛)
              </Text>
            </View>
          </View>

          <Text style={[styles.successDesc, { color: theme.textMuted }]}>
            {t('pendingNotice')}
          </Text>

          <View style={[styles.pointsBonusBox, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
            <Text style={{ color: theme.gold, fontWeight: '700', fontSize: 13 }}>
              ⭐ {t('pointsAwardNotice', { p: orderSuccess.points })}
            </Text>
          </View>

          {/* Telegram CS Assistance Link */}
          <TouchableOpacity
            style={styles.tgAssistanceRow}
            onPress={() => Linking.openURL('https://t.me/Somphea_Reak')}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#06b6d4', fontSize: 12, fontWeight: '700' }}>
              💬 Need help with this order? Contact @Somphea_Reak on Telegram ↗
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 14 }]}
            onPress={() => onNavigate && onNavigate('orders')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>
              📦 {t('viewMyOrders')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => onNavigate && onNavigate('home')}
          >
            <Text style={[styles.homeBtnText, { color: theme.textMuted }]}>
              {t('backToHome')}
            </Text>
          </TouchableOpacity>
        </View>
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
          🚚 {t('checkoutTitle')}
        </Text>
        <Text style={[styles.headerDesc, { color: theme.textMuted }]}>
          {t('checkoutDesc')}
        </Text>

        {/* Telegram Customer Support Banner */}
        <TouchableOpacity
          style={[styles.csTelegramPill, { backgroundColor: 'rgba(34, 158, 217, 0.08)', borderColor: 'rgba(34, 158, 217, 0.35)' }]}
          onPress={() => Linking.openURL('https://t.me/Somphea_Reak')}
          activeOpacity={0.8}
        >
          <TelegramIcon size={22} variant="circle" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#229ED9' }}>
              Customer Service: @Somphea_Reak
            </Text>
            <Text style={{ fontSize: 11, color: theme.textMuted }}>
              Questions about sizing, custom charms, or delivery status? Chat with us live!
            </Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#229ED9' }}>Chat ↗</Text>
        </TouchableOpacity>

        {/* Guest Warning / Login Callout (If browsing as guest) */}
        {!user && (
          <View style={[styles.guestWarningBox, { backgroundColor: 'rgba(234, 179, 8, 0.12)', borderColor: 'rgba(234, 179, 8, 0.45)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>🔒</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.gold }}>
                  Browsing as Guest
                </Text>
              </View>
              <View style={[styles.guestBadge, { backgroundColor: theme.gold + '25', borderColor: theme.gold }]}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: theme.gold }}>ACCOUNT REQUIRED TO ORDER</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: theme.text, lineHeight: 17, marginBottom: 10 }}>
              You are exploring the boutique as a guest. To submit your order, earn reward points, and view your official receipt, please sign in or register below.
            </Text>
            <TouchableOpacity
              style={[styles.guestAuthBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                setAuthError('');
                setIsAuthModalOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                🔑 Log In or Create Account to Continue
              </Text>
            </TouchableOpacity>
          </View>
        )}
 
        {/* Logged-In Telegram Customer Profile Banner */}
        {user && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 12, flexDirection: 'row', alignItems: 'center', padding: 14 }]}>
            <TelegramAvatar size={42} style={{ marginRight: 12 }} ringColor="#229ED9" showBadge={true} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>
                  @{user.username || user.name}
                </Text>
                <View style={{ backgroundColor: 'rgba(34, 158, 217, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#229ED9' }}>TELEGRAM PROFILE</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                {user.phone ? `📞 ${user.phone}` : 'Connected Account'} • ⭐ {user.points || 0} Points
              </Text>
            </View>
          </View>
        )}

        {/* Recipient Details Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
            {t('recipientName')} *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="e.g. Sophal Chan"
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            onSubmitEditing={() => phoneInputRef.current?.focus()}
            blurOnSubmit={false}
          />

          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
            {t('contactPhone')} *
          </Text>
          <TextInput
            ref={phoneInputRef}
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="+855 12 345 678"
            placeholderTextColor={theme.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => telegramInputRef.current?.focus()}
            blurOnSubmit={false}
          />

          {/* Telegram Username Input */}
          <View style={{ marginTop: 8, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={[styles.inputLabel, { color: theme.textMuted, marginBottom: 0 }]}>
                💬 {t('telegramUsername') || 'Telegram Username (@username)'}
              </Text>
              <Text style={{ fontSize: 10.5, color: '#229ED9', fontWeight: '700' }}>
                For quick delivery & chat
              </Text>
            </View>
            <View style={{ position: 'relative', justifyContent: 'center' }}>
              <TextInput
                ref={telegramInputRef}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                    paddingLeft: 38,
                    marginBottom: 0,
                  },
                ]}
                placeholder="e.g. @sophal_chan or username"
                placeholderTextColor={theme.textMuted}
                value={telegramUsername}
                onChangeText={setTelegramUsername}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => addressInputRef.current?.focus()}
                blurOnSubmit={false}
              />
              <View style={{ position: 'absolute', left: 11, top: 12 }}>
                <TelegramIcon size={16} variant="circle" />
              </View>
            </View>
          </View>

          {/* Cambodia Province / City Selector */}
          <View style={styles.labelRow}>
            <Text style={[styles.inputLabel, { color: theme.textMuted, marginBottom: 0 }]}>
              {t('provinceCity')} (Cambodia Only) *
            </Text>
            <Text style={{ fontSize: 11, color: theme.gold, fontWeight: '700' }}>
              {isPhnomPenh ? 'COD / KHQR Available' : '🔒 ABA KHQR Required'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.provinceSelectorBtn,
              {
                backgroundColor: theme.inputBg,
                borderColor: !isPhnomPenh ? theme.gold : theme.inputBorder,
              },
            ]}
            onPress={() => setIsProvinceModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.provinceSelectorText, { color: theme.text }]}>
                📍 {selectedProvince.nameEn} ({selectedProvince.nameKm})
              </Text>
              <Text style={{ fontSize: 11, color: isPhnomPenh ? theme.textMuted : theme.gold, marginTop: 2 }}>
                {isPhnomPenh
                  ? 'Capital City · Cash on Delivery & KHQR enabled'
                  : 'Provincial Delivery · ABA KHQR payment required'}
              </Text>
            </View>
            <View style={[styles.choosePill, { backgroundColor: theme.gold + '20', borderColor: theme.gold }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.gold }}>Choose ▾</Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
            {t('deliveryAddr')} *
          </Text>
          <TextInput
            ref={addressInputRef}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
            ]}
            placeholder="House #, Street name, Sangkat, Khan, Landmark..."
            placeholderTextColor={theme.textMuted}
            value={address}
            onChangeText={setAddress}
            multiline
            returnKeyType="next"
            onSubmitEditing={() => noteInputRef.current?.focus()}
          />

          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
            Order Notes / Special Requests (Optional)
          </Text>
          <TextInput
            ref={noteInputRef}
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            placeholder="e.g. Call before delivery, gift wrapping, drop off at guard..."
            placeholderTextColor={theme.textMuted}
            value={note}
            onChangeText={setNote}
            returnKeyType="done"
            onSubmitEditing={handlePlaceOrder}
          />
        </View>

        {/* Payment Method Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
              💳 {t('paymentMethod')}
            </Text>
            {!isPhnomPenh && (
              <View style={[styles.lockedBadge, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: theme.gold }}>
                  🔒 Locked to ABA KHQR for {selectedProvince.nameEn}
                </Text>
              </View>
            )}
          </View>

          {/* COD Option */}
          <TouchableOpacity
            style={[
              styles.payOption,
              {
                backgroundColor: paymentMethod === 'cod' ? 'rgba(16, 185, 129, 0.15)' : theme.inputBg,
                borderColor: paymentMethod === 'cod' ? theme.primary : theme.border,
                opacity: !isPhnomPenh ? 0.45 : 1,
              },
            ]}
            onPress={() => handleSelectPaymentMethod('cod')}
            activeOpacity={!isPhnomPenh ? 0.9 : 0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.payOptionTitle, { color: theme.text }]}>
                {t('payCod')}
              </Text>
              {!isPhnomPenh ? (
                <View style={[styles.lockedPill, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.error }}>
                    🔒 Phnom Penh Only
                  </Text>
                </View>
              ) : (
                paymentMethod === 'cod' && (
                  <Text style={{ fontSize: 14, color: theme.primary, fontWeight: '900' }}>✓</Text>
                )
              )}
            </View>
            <Text style={[styles.payOptionSub, { color: theme.textMuted }]}>
              {!isPhnomPenh
                ? 'Unavailable: Provincial logistics require KHQR payment prior to shipping.'
                : t('payCodDesc')}
            </Text>
          </TouchableOpacity>

          {/* ABA KHQR Option */}
          <TouchableOpacity
            style={[
              styles.payOption,
              {
                backgroundColor: paymentMethod === 'khqr' ? 'rgba(16, 185, 129, 0.15)' : theme.inputBg,
                borderColor: paymentMethod === 'khqr' ? theme.primary : theme.border,
              },
            ]}
            onPress={() => handleSelectPaymentMethod('khqr')}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.payOptionTitle, { color: theme.text }]}>
                {t('payKhqr')}
              </Text>
              {!isPhnomPenh ? (
                <View style={[styles.lockedPill, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.primary }}>
                    ✓ Required for {selectedProvince.nameEn}
                  </Text>
                </View>
              ) : (
                paymentMethod === 'khqr' && (
                  <Text style={{ fontSize: 14, color: theme.primary, fontWeight: '900' }}>✓</Text>
                )
              )}
            </View>
            <Text style={[styles.payOptionSub, { color: theme.textMuted }]}>
              {t('payKhqrDesc')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Voucher Selector in Checkout */}
        <VoucherSelector onNavigateToRewards={() => onNavigate && onNavigate('rewards')} />

        {/* Order Summary & Submit Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <Text style={{ color: theme.textMuted }}>{t('subtotal')}</Text>
            <Text style={{ color: theme.text, fontWeight: '600' }}>${cartSubtotal.toFixed(2)}</Text>
          </View>

          {voucherDiscountAmt > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={{ color: theme.rose }}>
                  {t('voucherDiscount')} ({selectedVoucher?.code || 'VOUCHER'} -{voucherDiscountPct}%)
                </Text>
                <Text style={{ color: theme.rose, fontWeight: '700' }}>
                  -${voucherDiscountAmt.toFixed(2)}
                </Text>
              </View>

              <View style={[styles.summaryRow, { backgroundColor: 'rgba(16, 185, 129, 0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginVertical: 2 }]}>
                <Text style={{ color: theme.secondary || '#10b981', fontWeight: '800', fontSize: 13 }}>
                  ✨ {t('priceAfterDiscount')}
                </Text>
                <Text style={{ color: theme.secondary || '#10b981', fontWeight: '900', fontSize: 14 }}>
                  ${(cartSubtotal - voucherDiscountAmt).toFixed(2)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.summaryRow}>
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

          <View style={styles.summaryRow}>
            <Text style={{ color: theme.gold }}>⭐ Points to Earn</Text>
            <Text style={{ color: theme.gold, fontWeight: '800' }}>+{totalPoints} pt</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.totalRow}>
            <View>
              <Text style={[styles.totalLabel, { color: theme.text }]}>{t('totalAmount')}</Text>
              <Text style={{ fontSize: 12, color: theme.textMuted }}>
                ≈ {Math.round(finalTotal * rate).toLocaleString()} ៛ (1 USD = {rate.toLocaleString()} KHR)
              </Text>
            </View>
            <Text style={[styles.totalVal, { color: theme.secondary || '#10b981' }]}>${finalTotal.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: !user ? theme.gold : (theme.secondary || '#10b981') }]}
            onPress={handlePlaceOrder}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>
              {loading
                ? 'Submitting Order...'
                : !user
                ? `🔒 Log In to Place Order ($${finalTotal.toFixed(2)})`
                : `${t('placeOrderBtn')} ($${finalTotal.toFixed(2)})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cambodia Province Selector Modal */}
      <Modal
        visible={isProvinceModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsProvinceModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  🇰🇭 Select Province / City
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted }}>
                  Only 25 Cambodian administrative territories available
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsProvinceModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={{ color: theme.textMuted, fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Filter Search */}
            <TextInput
              style={[
                styles.modalSearchInput,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
              ]}
              placeholder="🔍 Search province in English or Khmer..."
              placeholderTextColor={theme.textMuted}
              value={provinceSearch}
              onChangeText={setProvinceSearch}
              returnKeyType="search"
            />

            <FlatList
              data={filteredProvinces}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => {
                const isSelected = selectedProvince.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.provinceItem,
                      {
                        backgroundColor: isSelected ? theme.gold + '20' : theme.inputBg,
                        borderColor: isSelected ? theme.gold : theme.border,
                      },
                    ]}
                    onPress={() => handleSelectProvince(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.provinceNameEn, { color: isSelected ? theme.gold : theme.text }]}>
                          {item.nameEn}
                        </Text>
                        {item.isCapital && (
                          <View style={[styles.capitalPill, { backgroundColor: theme.gold + '30' }]}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: theme.gold }}>CAPITAL</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.provinceNameKm, { color: theme.textMuted }]}>
                        {item.nameKm}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: item.isCapital ? '#10b981' : theme.gold,
                        }}
                      >
                        {item.isCapital ? 'COD / KHQR' : 'ABA KHQR'}
                      </Text>
                      {isSelected && (
                        <Text style={{ fontSize: 12, color: theme.gold, fontWeight: '900', marginTop: 2 }}>
                          ✓ Selected
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Guest Authentication Modal (Required to Place Order) */}
      <Modal
        visible={isAuthModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAuthModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.authModalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  🔒 Account Required to Order
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                  Log in or register to secure your official receipt & points
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAuthModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={{ color: theme.textMuted, fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Auth Tab Switcher */}
            <View style={[styles.authTabSwitcher, { backgroundColor: theme.inputBg }]}>
              <TouchableOpacity
                style={[
                  styles.authTabBtn,
                  authTab === 'login' && { backgroundColor: theme.gold, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
                ]}
                onPress={() => {
                  setAuthTab('login');
                  setAuthError('');
                }}
              >
                <Text
                  style={[
                    styles.authTabBtnText,
                    { color: authTab === 'login' ? '#000' : theme.textMuted },
                  ]}
                >
                  🔑 Log In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.authTabBtn,
                  authTab === 'register' && { backgroundColor: theme.gold, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
                ]}
                onPress={() => {
                  setAuthTab('register');
                  setAuthError('');
                }}
              >
                <Text
                  style={[
                    styles.authTabBtnText,
                    { color: authTab === 'register' ? '#000' : theme.textMuted },
                  ]}
                >
                  ✨ Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {authError ? (
              <View style={[styles.authErrorBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>
                  ⚠️ {authError}
                </Text>
              </View>
            ) : null}

            {authTab === 'login' ? (
              <View style={{ gap: 10 }}>
                <View>
                  <Text style={[styles.authFieldLabel, { color: theme.textMuted }]}>Phone Number or Telegram</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    placeholder="e.g. 012 345 678 or @username"
                    placeholderTextColor={theme.textMuted}
                    value={authPhone}
                    onChangeText={setAuthPhone}
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>

                <View>
                  <Text style={[styles.authFieldLabel, { color: theme.textMuted }]}>Account Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.textMuted}
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleModalLogin}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: theme.gold }]}
                  onPress={handleModalLogin}
                  disabled={authLoading}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalSubmitBtnText, { color: '#000' }]}>
                    {authLoading ? 'Signing In...' : '🔑 Sign In & Continue to Place Order'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ alignSelf: 'center', marginTop: 4 }}
                  onPress={() => Linking.openURL('https://t.me/Somphea_Reak')}
                >
                  <Text style={{ fontSize: 11, color: theme.gold, textDecorationLine: 'underline' }}>
                    Forgot password? Contact Telegram @Somphea_Reak
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <View>
                  <Text style={[styles.authFieldLabel, { color: theme.textMuted }]}>Telegram Username *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    placeholder="e.g. @sophal_chan"
                    placeholderTextColor={theme.textMuted}
                    value={authUsername}
                    onChangeText={setAuthUsername}
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text style={[styles.authFieldLabel, { color: theme.textMuted }]}>Phone Number *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    placeholder="012 345 678"
                    placeholderTextColor={theme.textMuted}
                    value={authPhone}
                    onChangeText={setAuthPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View>
                  <Text style={[styles.authFieldLabel, { color: theme.textMuted }]}>Password (min 4 characters) *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    placeholder="Create a password"
                    placeholderTextColor={theme.textMuted}
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    secureTextEntry
                  />
                </View>

                <View>
                  <Text style={[styles.authFieldLabel, { color: theme.textMuted }]}>Confirm Password *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.textMuted}
                    value={authConfirmPassword}
                    onChangeText={setAuthConfirmPassword}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleModalRegister}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: theme.secondary || '#10b981' }]}
                  onPress={handleModalRegister}
                  disabled={authLoading}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalSubmitBtnText, { color: '#fff' }]}>
                    {authLoading ? 'Creating Account...' : '✨ Create Account & Continue to Order'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerDesc: {
    fontSize: 11.5,
  },
  csTelegramPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    marginBottom: 10,
  },
  textArea: {
    height: 64,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  provinceSelectorBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  provinceSelectorText: {
    fontSize: 13,
    fontWeight: '700',
  },
  choosePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  payOption: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  payOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  payOptionSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  lockedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockedPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: 10,
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
  primaryBtn: {
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  receiptPillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptPillText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  receiptSummaryBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  pointsBonusBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
  },
  tgAssistanceRow: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  homeBtn: {
    marginTop: 14,
  },
  homeBtnText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalSearchInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 12,
  },
  provinceItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  provinceNameEn: {
    fontSize: 13,
    fontWeight: '700',
  },
  capitalPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  provinceNameKm: {
    fontSize: 11,
    marginTop: 2,
  },
  guestWarningBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  guestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  guestAuthBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authModalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    maxHeight: '90%',
  },
  authTabSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  authTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authTabBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  authErrorBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  authFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubmitBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
