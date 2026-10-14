import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { AnimatedLangSwitch } from '../../components/AnimatedLangSwitch';
import { AnimatedThemeSwitch } from '../../components/AnimatedThemeSwitch';
import { TelegramIcon } from '../../components/TelegramIcon';

export const LoginGateScreen = ({ initialTab, onOpenAdmin }) => {
  const {
    theme,
    themeMode,
    toggleTheme,
    t,
    lang,
    setLang,
    authGateTab,
    setAuthGateTab,
    registerCustomer,
    loginCustomer,
    recoverCustomerPassword,
    continueAsGuest,
  } = useApp();

  // Mode: 'login' | 'register' | 'recover'
  const [authMode, setAuthMode] = useState(initialTab || authGateTab || 'login');

  // Register Fields
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Login Fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Recover Fields
  const [recoverIdentifier, setRecoverIdentifier] = useState('');
  const [recoverNewPassword, setRecoverNewPassword] = useState('');
  const [recoverConfirmPassword, setRecoverConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear messages when switching tabs
  const switchMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setSuccessMsg('');
  };

  // 1. CREATE ACCOUNT (Register)
  const handleRegister = async () => {
    setError('');
    setSuccessMsg('');

    const cleanUser = regUsername.trim().replace(/^@/, '');
    if (!cleanUser) {
      setError(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះគណនី Telegram របស់អ្នក' : 'Please enter your Telegram username (e.g. @sophal)');
      return;
    }

    const rawDigits = regPhone.trim().replace(/\D/g, '');
    const cleanDigits = rawDigits.replace(/^0/, '');
    if (cleanDigits.length < 8 || cleanDigits.length > 10) {
      setError(t('gatePhoneErr'));
      return;
    }
    const formattedPhone = `+855 ${cleanDigits}`;

    if (!regPassword || regPassword.length < 4) {
      setError(t('passwordTooShort'));
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    const res = await registerCustomer(cleanUser, formattedPhone, regPassword, remember);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || 'Registration failed');
    }
  };

  // 2. LOG IN
  const handleLogin = async () => {
    setError('');
    setSuccessMsg('');

    const ident = loginPhone.trim();
    if (!ident) {
      setError(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ ឬ Telegram របស់អ្នក' : 'Please enter your registered phone number or Telegram');
      return;
    }

    if (!loginPassword) {
      setError(lang === 'km' ? 'សូមបញ្ចូលពាក្យសម្ងាត់គណនី' : 'Please enter your account password');
      return;
    }

    // Format phone if digits
    let formattedIdent = ident;
    const rawDigits = ident.replace(/\D/g, '');
    if (rawDigits.length >= 8 && rawDigits.length <= 11 && !ident.includes('@')) {
      const cleanDigits = rawDigits.replace(/^0/, '');
      formattedIdent = `+855 ${cleanDigits}`;
    }

    setLoading(true);
    const res = await loginCustomer(formattedIdent, loginPassword, remember);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || t('invalidPassword'));
    }
  };

  // 3. RECOVER ACCOUNT (Forgot Password)
  const handleRecover = async () => {
    setError('');
    setSuccessMsg('');

    const ident = recoverIdentifier.trim();
    if (!ident) {
      setError(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ ឬ Telegram ដែលបានចុះឈ្មោះ' : 'Please enter your registered phone or Telegram');
      return;
    }

    if (!recoverNewPassword || recoverNewPassword.length < 4) {
      setError(t('passwordTooShort'));
      return;
    }

    if (recoverNewPassword !== recoverConfirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    let formattedIdent = ident;
    const rawDigits = ident.replace(/\D/g, '');
    if (rawDigits.length >= 8 && rawDigits.length <= 11 && !ident.includes('@')) {
      const cleanDigits = rawDigits.replace(/^0/, '');
      formattedIdent = `+855 ${cleanDigits}`;
    }

    setLoading(true);
    const res = await recoverCustomerPassword(formattedIdent, recoverNewPassword);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || 'Account recovery failed');
    } else {
      setSuccessMsg(t('passwordResetSuccess'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Controls: Language & Theme */}
        <View style={styles.topControlRow}>
          <AnimatedLangSwitch
            lang={lang}
            onToggle={() => setLang(lang === 'km' ? 'en' : 'km')}
            theme={theme}
          />
          <AnimatedThemeSwitch
            themeMode={themeMode}
            onToggle={toggleTheme}
            theme={theme}
          />
        </View>

        {/* Auth Luxury Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Brand Header */}
          <View style={styles.headerBox}>
            <View style={{ marginBottom: 12 }}>
              <TelegramIcon size={76} variant="circle" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('siteTitle')}
            </Text>
            <View style={[styles.brandBadge, { backgroundColor: theme.secondaryBg || 'rgba(16, 185, 129, 0.12)' }]}>
              <Text style={[styles.subtitle, { color: theme.secondary || '#10b981' }]}>
                Premium Studio
              </Text>
            </View>
          </View>

          {/* Quick Option: Log in as Guest (Explore Storefront) */}
          <TouchableOpacity
            style={[
              styles.guestBannerCard,
              { backgroundColor: theme.inputBg, borderColor: theme.border },
            ]}
            onPress={continueAsGuest}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: theme.secondary || '#10b981' }}>
                  {lang === 'km' ? '🛍️ ចូលជាភ្ញៀវ (រុករកទំនិញក្នុងហាង)' : '🛍️ Log In as Guest (Explore Store)'}
                </Text>
                <View style={[styles.guestPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: theme.secondary || '#10b981' }}>
                    {lang === 'km' ? 'មិនបាច់ពាក្យសម្ងាត់' : 'NO PASSWORD'}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
                {lang === 'km'
                  ? 'រុករកទំនិញ និងច្នៃខ្សែដៃភ្លាមៗ • ត្រូវការគណនីពេលកុម្ម៉ង់ទិញ'
                  : 'Browse catalog & customize bracelets freely • Account required to place order'}
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: theme.secondary || '#10b981', fontWeight: '800' }}>→</Text>
          </TouchableOpacity>

          <View style={styles.orDividerRow}>
            <View style={[styles.orDividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.orDividerText, { color: theme.textMuted }]}>
              {lang === 'km' ? 'ឬ ចូលគណនីរបស់អ្នក' : 'OR SIGN IN TO YOUR ACCOUNT'}
            </Text>
            <View style={[styles.orDividerLine, { backgroundColor: theme.border }]} />
          </View>

          {/* Segmented Auth Selector Tabs */}
          {authMode !== 'recover' && (
            <View style={[styles.segmentedTabs, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  authMode === 'login' && [
                    styles.tabBtnActive,
                    { backgroundColor: theme.card, borderColor: theme.secondary || '#10b981' },
                  ],
                ]}
                onPress={() => switchMode('login')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color: authMode === 'login' ? (theme.secondary || '#10b981') : theme.textMuted,
                      fontWeight: authMode === 'login' ? '800' : '600',
                    },
                  ]}
                >
                  🔑 {t('tabLogin')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  authMode === 'register' && [
                    styles.tabBtnActive,
                    { backgroundColor: theme.card, borderColor: theme.secondary || '#10b981' },
                  ],
                ]}
                onPress={() => switchMode('register')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color: authMode === 'register' ? (theme.secondary || '#10b981') : theme.textMuted,
                      fontWeight: authMode === 'register' ? '800' : '600',
                    },
                  ]}
                >
                  ✨ {t('tabRegister')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error & Success Feedback */}
          {error ? (
            <View style={[styles.alertBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: theme.error }]}>
              <Text style={[styles.alertText, { color: theme.error }]}>⚠️ {error}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={[styles.alertBox, { backgroundColor: theme.secondaryBg, borderColor: theme.secondary }]}>
              <Text style={[styles.alertText, { color: theme.secondary }]}>✓ {successMsg}</Text>
            </View>
          ) : null}

          {/* ==================================================== */}
          {/* TAB 1: LOG IN (Already have an account) */}
          {/* ==================================================== */}
          {authMode === 'login' && (
            <View style={styles.formBox}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {t('gateLoginTitle')}
              </Text>
              <Text style={[styles.formDesc, { color: theme.textMuted }]}>
                {t('gateLoginDesc')}
              </Text>

              {/* Phone or Username */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                📱 {t('contactPhone')} / Telegram
              </Text>
              <View style={styles.inputRow}>
                <View style={[styles.prefixBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>🇰🇭 +855</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputFlex,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  placeholder="12 345 678 or @username"
                  placeholderTextColor={theme.textMuted}
                  value={loginPhone}
                  onChangeText={(val) => {
                    setLoginPhone(val);
                    setError('');
                  }}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                🔒 {t('passwordLabel')}
              </Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  value={loginPassword}
                  onChangeText={(val) => {
                    setLoginPassword(val);
                    setError('');
                  }}
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>

              {/* Remember Me & Forgot Password Row */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRemember(!remember)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: theme.secondary || '#10b981' },
                      remember && { backgroundColor: theme.secondary || '#10b981' },
                    ]}
                  >
                    {remember && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>}
                  </View>
                  <Text style={[styles.rememberText, { color: theme.textMuted }]}>
                    {t('rememberMeText')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => switchMode('recover')} activeOpacity={0.7}>
                  <Text style={[styles.forgotLink, { color: theme.secondary || '#10b981' }]}>
                    {t('forgotPassword')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Primary Log In Button */}
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.secondary || '#10b981' }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>
                  {loading ? 'Logging in...' : `🔑 ${t('gateLoginBtn')}`}
                </Text>
              </TouchableOpacity>

              {/* Switch to Register link */}
              <TouchableOpacity
                style={styles.switchAuthRow}
                onPress={() => switchMode('register')}
                activeOpacity={0.8}
              >
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                  {lang === 'km' ? 'មិនទាន់មានគណនីមែនទេ?' : "Don't have an account?"}{' '}
                  <Text style={{ color: theme.secondary || '#10b981', fontWeight: '800' }}>
                    {t('tabRegister')} →
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ==================================================== */}
          {/* TAB 2: CREATE ACCOUNT (Register) */}
          {/* ==================================================== */}
          {authMode === 'register' && (
            <View style={styles.formBox}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {t('gateCreateTitle')}
              </Text>
              <Text style={[styles.formDesc, { color: theme.textMuted }]}>
                {t('gateCreateDesc')}
              </Text>

              {/* 1. Telegram Username */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                ✈️ {t('gateUserLabel')}
              </Text>
              <View style={styles.inputRow}>
                <View style={[styles.prefixBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <TelegramIcon size={18} variant="circle" />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputFlex,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  placeholder="@username (e.g. @sophal)"
                  placeholderTextColor={theme.textMuted}
                  value={regUsername}
                  onChangeText={(val) => {
                    setRegUsername(val);
                    setError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* 2. Telegram Phone Number */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                📱 {t('gatePhoneLabel')}
              </Text>
              <View style={styles.inputRow}>
                <View style={[styles.prefixBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>🇰🇭 +855</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputFlex,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  placeholder="12 345 678"
                  placeholderTextColor={theme.textMuted}
                  value={regPhone}
                  onChangeText={(val) => {
                    setRegPhone(val);
                    setError('');
                  }}
                  keyboardType="phone-pad"
                />
              </View>

              {/* 3. Account Password */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                🔒 {t('createPasswordLabel')}
              </Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  value={regPassword}
                  onChangeText={(val) => {
                    setRegPassword(val);
                    setError('');
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>

              {/* 4. Confirm Password */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                🔒 {t('confirmPasswordLabel')}
              </Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  value={regConfirmPassword}
                  onChangeText={(val) => {
                    setRegConfirmPassword(val);
                    setError('');
                  }}
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={handleRegister}
                />
              </View>

              {/* VIP Perks Badge */}
              <View style={[styles.perksBadge, { backgroundColor: theme.secondaryBg || 'rgba(16, 185, 129, 0.12)' }]}>
                <Text style={[styles.perksText, { color: theme.secondary || '#10b981' }]}>
                  🎁 {lang === 'km' ? 'ទទួលបាន ១០ ពិន្ទុភ្លាមៗពេលចុះឈ្មោះ + សន្ំពិន្ទុរាល់ពេលទិញ' : '+10 Welcome Points instantly upon account creation!'}
                </Text>
              </View>

              {/* Primary Register Button */}
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.secondary || '#10b981' }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>
                  {loading ? 'Creating Account...' : `✨ ${t('gateCreateBtn')}`}
                </Text>
              </TouchableOpacity>

              {/* Switch to Login link */}
              <TouchableOpacity
                style={styles.switchAuthRow}
                onPress={() => switchMode('login')}
                activeOpacity={0.8}
              >
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                  {lang === 'km' ? 'មានគណនីរួចហើយ?' : 'Already have an account?'}{' '}
                  <Text style={{ color: theme.secondary || '#10b981', fontWeight: '800' }}>
                    {t('tabLogin')} →
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ==================================================== */}
          {/* TAB 3: ACCOUNT RECOVERY (Forgot Password) */}
          {/* ==================================================== */}
          {authMode === 'recover' && (
            <View style={styles.formBox}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {t('recoverTitle')}
              </Text>
              <Text style={[styles.formDesc, { color: theme.textMuted }]}>
                {t('recoverDesc')}
              </Text>

              {/* Registered Phone or Telegram */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                📱 {t('contactPhone')} / Telegram
              </Text>
              <View style={styles.inputRow}>
                <View style={[styles.prefixBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>🇰🇭 +855</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputFlex,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  placeholder="12 345 678 or @username"
                  placeholderTextColor={theme.textMuted}
                  value={recoverIdentifier}
                  onChangeText={(val) => {
                    setRecoverIdentifier(val);
                    setError('');
                  }}
                  autoCapitalize="none"
                />
              </View>

              {/* New Password */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                🔒 {t('newPasswordLabel')}
              </Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  value={recoverNewPassword}
                  onChangeText={(val) => {
                    setRecoverNewPassword(val);
                    setError('');
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>

              {/* Confirm New Password */}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                🔒 {t('confirmPasswordLabel')}
              </Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  value={recoverConfirmPassword}
                  onChangeText={(val) => {
                    setRecoverConfirmPassword(val);
                    setError('');
                  }}
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={handleRecover}
                />
              </View>

              {/* Primary Reset Button */}
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.secondary || '#10b981' }]}
                onPress={handleRecover}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>
                  {loading ? 'Updating Password...' : `✓ ${t('resetPasswordBtn')}`}
                </Text>
              </TouchableOpacity>

              {/* Telegram Support Recovery Assistance */}
              <TouchableOpacity
                style={[styles.supportContactBtn, { backgroundColor: 'rgba(34, 158, 217, 0.12)', borderColor: 'rgba(34, 158, 217, 0.4)' }]}
                onPress={() => Linking.openURL('https://t.me/Somphea_Reak')}
                activeOpacity={0.8}
              >
                <TelegramIcon size={18} variant="circle" />
                <Text style={{ color: '#229ED9', fontSize: 12, fontWeight: '700' }}>
                  {t('contactSupportRecover')}
                </Text>
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.backLinkBtn}
                onPress={() => switchMode('login')}
                activeOpacity={0.7}
              >
                <Text style={{ color: theme.textMuted, fontSize: 13, textDecorationLine: 'underline' }}>
                  ← {lang === 'km' ? 'ត្រឡប់ទៅទំព័រចូលគណនី' : 'Back to Log In'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ==================================================== */}
          {/* Guest Mode Exploration Button */}
          {/* ==================================================== */}
          <View style={[styles.dividerBox, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.guestExploreBtn,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
              onPress={continueAsGuest}
              activeOpacity={0.8}
            >
              <Text style={[styles.guestExploreBtnText, { color: theme.text }]}>
                {t('exploreGuest')} →
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  brandBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  segmentedTabs: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
  },
  alertBox: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  formBox: {
    width: '100%',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  formDesc: {
    fontSize: 11.5,
    marginBottom: 14,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 5,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  prefixBox: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 10,
  },
  inputFlex: {
    flex: 1,
    marginBottom: 0,
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: 10,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 40,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 11,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 12,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  primaryActionBtn: {
    width: '100%',
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  switchAuthRow: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perksBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
  perksText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
  },
  supportContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  backLinkBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  dividerBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    width: '100%',
  },
  guestBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 10,
  },
  guestPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
  },
  orDividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  guestExploreBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestExploreBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
