import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClient } from '../api/client';
import { Themes } from '../constants/theme';
import { I18N } from '../constants/translations';
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CHARMS,
} from '../constants/initialData';
import { triggerThemeRipple } from '../components/ThemeTransitionOverlay';

const AppContext = createContext();

export const STORAGE_KEYS = {
  USER: 'sr_mobile_user_v1',
  ADMIN_TOKEN: 'sr_mobile_admin_token_v1',
  THEME: 'sr_mobile_theme_v2',
  LANG: 'sr_mobile_lang_v2',
  CART: 'sr_mobile_cart_v1',
  CATALOG: 'sr_mobile_catalog_v3',
  ACCOUNTS: 'sr_mobile_accounts_v2',
  ORDERS: 'sr_mobile_orders_v2',
};

const FAKE_DEFAULT_CHARM_IDS = new Set([
  'ch_plain', 'ch_plain_001', 'ch_heart', 'ch_star', 'ch_flower', 'ch_butterfly',
  'ch_cat', 'ch_clover', 'ch_moon', 'ch_sun', 'ch_diamond', 'ch_bow', 'ch_dog',
  'rainbow', 'ch_music', 'ch_khmer', 'ch_crown', 'ch_bolt'
]);

const filterRealCharms = (list) => {
  if (!Array.isArray(list)) return [];
  const filtered = list.filter((ch) => ch && !FAKE_DEFAULT_CHARM_IDS.has(ch.id) && !ch.isPlain && !(ch.name && ch.name.toLowerCase().includes('plain stainless')));
  return filtered;
};

export const AppProvider = ({ children }) => {
  // Localization & Theme (Default: Light Mode & Khmer language for both Storefront & Admin)
  const [lang, setLangState] = useState('km');
  const [themeMode, setThemeMode] = useState('light');

  // Customer Authentication & Guest Mode
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [authGateTab, setAuthGateTab] = useState('login');
  const [rememberMe, setRememberMe] = useState(true);

  // Admin Authentication
  const [adminToken, setAdminToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Storefront Data (Initial render is instant 0ms with bundled seed data)
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [charms, setCharms] = useState(INITIAL_CHARMS);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);

  // Cart & Active Voucher
  const [cart, setCart] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Toast System
  const [toastMessage, setToastMessage] = useState(null);

  const theme = Themes[themeMode] || Themes.light;

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Translation helper
  const t = useCallback((key, params = {}) => {
    const dict = I18N[lang] || I18N.km;
    let str = dict[key] || I18N.en[key] || key;
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return str;
  }, [lang]);

  // Load saved local storage on start (User, Theme, Cart & Cached Catalog)
  useEffect(() => {
    (async () => {
      try {
        const [savedTheme, savedLang, savedUser, savedAdminToken, savedCart, savedCatalog, savedOrders] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          AsyncStorage.getItem(STORAGE_KEYS.LANG),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.CART),
          AsyncStorage.getItem(STORAGE_KEYS.CATALOG),
          AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
        ]);

        if (savedTheme) setThemeMode(savedTheme);
        if (savedLang) setLangState(savedLang);
        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedOrders) {
          try {
            const parsedOrders = JSON.parse(savedOrders);
            if (Array.isArray(parsedOrders)) setUserOrders(parsedOrders);
          } catch (e) {}
        }
        if (savedAdminToken) {
          setAdminToken(savedAdminToken);
          setIsAdmin(true);
        }

        // Auto-authenticate if admin token is passed via deep-link (e.g. CLI launcher) or admin-live mode
        if (typeof window !== 'undefined' && window.location) {
          try {
            const rawHash = (window.location.hash || '').toLowerCase();
            const rawSearch = (window.location.search || '').toLowerCase();
            const searchPart = rawSearch || (rawHash.includes('?') ? rawHash.split('?')[1] : '');
            if (searchPart) {
              const urlParams = new URLSearchParams(searchPart);
              const queryToken = urlParams.get('token');
              if (queryToken) {
                setAdminToken(queryToken);
                setIsAdmin(true);
                AsyncStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, queryToken).catch(() => {});
              }
            }
            // If entering admin-live mode without stored token during local development, obtain dev admin authorization
            const isLocalDevHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isLocalDevHost && !savedAdminToken && rawHash.includes('admin-live')) {
              ApiClient.verifyAdminPin('1234').then((authRes) => {
                if (authRes.ok && authRes.token) {
                  setAdminToken(authRes.token);
                  setIsAdmin(true);
                  AsyncStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, authRes.token).catch(() => {});
                }
              }).catch(() => {});
            }
          } catch (tokenErr) {
            console.warn('Could not parse admin query token:', tokenErr);
          }
        }
        if (savedCart) setCart(JSON.parse(savedCart));

        if (savedCatalog) {
          const parsed = JSON.parse(savedCatalog);
          if (parsed.settings) setSettings(prev => ({ ...prev, ...parsed.settings }));
          if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
          if (Array.isArray(parsed.products)) setProducts(parsed.products);
          if (Array.isArray(parsed.categoryFilters)) setCategoryFilters(parsed.categoryFilters);
          if (Array.isArray(parsed.charms)) {
            const clean = filterRealCharms(parsed.charms);
            setCharms(clean);
          }
        }
      } catch (e) {
        console.warn('Error restoring storage', e);
      }
    })();
  }, []);

  // Save Cart Changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart)).catch(() => {});
  }, [cart]);

  // Initial & Background Data Fetch with Cache Persistence
  const refreshCatalog = useCallback(async () => {
    try {
      const [settingsRes, catsRes, prodsRes, charmsRes, filtersRes] = await Promise.all([
        ApiClient.getSettings(),
        ApiClient.getCategories(),
        ApiClient.getProducts(),
        ApiClient.getCharms(),
        ApiClient.getCategoryFilters(),
      ]);

      let updatedSettings = null;
      let updatedCats = null;
      let updatedProds = null;
      let updatedCharms = null;
      let updatedFilters = null;

      if (settingsRes.ok && settingsRes.settings) {
        updatedSettings = settingsRes.settings;
        setSettings(prev => ({ ...prev, ...settingsRes.settings }));
      }
      if (catsRes.ok && Array.isArray(catsRes.categories) && catsRes.categories.length > 0) {
        updatedCats = catsRes.categories;
        setCategories(catsRes.categories);
      }
      if (prodsRes.ok && Array.isArray(prodsRes.products)) {
        updatedProds = prodsRes.products;
        setProducts(prodsRes.products);
      }
      if (charmsRes.ok && Array.isArray(charmsRes.charms)) {
        const clean = filterRealCharms(charmsRes.charms);
        updatedCharms = clean;
        setCharms(clean);
      }
      if (filtersRes.ok && Array.isArray(filtersRes.filters)) {
        updatedFilters = filtersRes.filters;
        setCategoryFilters(filtersRes.filters);
      }

      // Persist latest catalog in local storage for instant offline / next-boot load
      if (updatedSettings !== null || updatedCats !== null || updatedProds !== null || updatedCharms !== null || updatedFilters !== null) {
        AsyncStorage.getItem(STORAGE_KEYS.CATALOG).then(raw => {
          const prev = raw ? JSON.parse(raw) : {};
          const toSave = {
            settings: updatedSettings !== null ? updatedSettings : prev.settings,
            categories: updatedCats !== null ? updatedCats : prev.categories,
            products: updatedProds !== null ? updatedProds : (prev.products || []),
            charms: updatedCharms !== null ? updatedCharms : (prev.charms || []),
            categoryFilters: updatedFilters !== null ? updatedFilters : (prev.categoryFilters || []),
          };
          AsyncStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(toSave)).catch(() => {});
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Failed refreshing catalog from network (using cached data):', err);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  // Refresh current user data
  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    const res = await ApiClient.getUser(user.id);
    const userObj = res.user || (res.id ? res : null);
    if (res.ok && userObj) {
      setUser(userObj);
      if (rememberMe) {
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj)).catch(() => {});
      }
    }
  }, [user?.id, rememberMe]);

  // Refresh user orders (safely merges server orders with locally placed orders)
  const refreshOrders = useCallback(async () => {
    const userQuery = user?.id || user?.username || user?.phone;
    if (userQuery) {
      try {
        const res = await ApiClient.getOrders(userQuery);
        if (res.ok && Array.isArray(res.orders)) {
          setUserOrders((prev) => {
            const map = new Map();
            // Start with server orders
            res.orders.forEach((o) => {
              if (o && o.id) map.set(o.id, o);
            });
            // Merge existing local orders so freshly submitted receipts never vanish
            (Array.isArray(prev) ? prev : []).forEach((o) => {
              if (o && o.id && !map.has(o.id)) {
                map.set(o.id, o);
              }
            });
            const merged = Array.from(map.values());
            AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(merged)).catch(() => {});
            return merged;
          });
        }
      } catch (err) {
        console.warn('Failed refreshing orders from API:', err);
      }
    } else {
      // Guest mode or unauthenticated visitor: restore saved orders from AsyncStorage
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUserOrders(parsed);
          }
        }
      } catch (e) {}
    }

    if (isAdmin && adminToken) {
      try {
        const res = await ApiClient.getOrders(null, adminToken);
        if (res.ok && Array.isArray(res.orders)) {
          setAdminOrders(res.orders);
        }
      } catch (err) {
        console.warn('Failed refreshing admin orders:', err);
      }
    }
  }, [user?.id, user?.username, user?.phone, isAdmin, adminToken]);

  const addSubmittedOrder = useCallback((order) => {
    if (!order) return;
    setUserOrders((prev) => {
      const currentList = Array.isArray(prev) ? prev : [];
      const updated = [order, ...currentList.filter((o) => o && o.id !== order.id)];
      AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setAdminOrders((prev) => {
      const currentList = Array.isArray(prev) ? prev : [];
      return [order, ...currentList.filter((o) => o && o.id !== order.id)];
    });
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [user?.id, user?.username, user?.phone, isAdmin, adminToken, refreshOrders]);

  // Update Order / Receipt Information
  const updateOrder = useCallback(async (orderId, updateData) => {
    try {
      const res = await ApiClient.updateOrder(orderId, updateData, adminToken);
      if (res.ok) {
        const updated = res.order || (res.id ? res : null);
        if (updated) {
          setAdminOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o))
          );
          setUserOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o))
          );
        }
        return { ok: true, order: updated };
      }
      // Offline fallback: update locally
      setAdminOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updateData } : o))
      );
      setUserOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updateData } : o))
      );
      return { ok: true, offline: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, [adminToken]);

  // Wipe Orders History
  const wipeOrders = useCallback(async (mode = 'all') => {
    try {
      const res = await ApiClient.wipeOrders(mode, adminToken);
      if (mode === 'completed_only') {
        const isNotDone = (o) => {
          const s = (o.status || '').toLowerCase();
          return s !== 'completed' && s !== 'approved' && s !== 'rejected' && s !== 'cancelled';
        };
        setAdminOrders((prev) => prev.filter(isNotDone));
        setUserOrders((prev) => prev.filter(isNotDone));
      } else {
        setAdminOrders([]);
        setUserOrders([]);
      }
      return res.ok ? res : { ok: true, deleted_count: 0, offline: true };
    } catch (e) {
      if (mode === 'completed_only') {
        setAdminOrders((prev) => prev.filter((o) => (o.status || '').toLowerCase() === 'pending'));
      } else {
        setAdminOrders([]);
      }
      return { ok: true, offline: true };
    }
  }, [adminToken]);

  // Run Auto Wipe Orders
  const runAutoWipeOrders = useCallback(async () => {
    try {
      const res = await ApiClient.runAutoWipeOrders(adminToken);
      await refreshOrders();
      return res;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, [adminToken, refreshOrders]);

  // Set Language
  const setLang = (newLang) => {
    setLangState(newLang);
    AsyncStorage.setItem(STORAGE_KEYS.LANG, newLang).catch(() => {});
  };

  // Toggle Theme with Circular Expanding Ripple Animation
  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    const handledByRipple = triggerThemeRipple(next, () => {
      setThemeMode(next);
      AsyncStorage.setItem(STORAGE_KEYS.THEME, next).catch(() => {});
    });
    if (!handledByRipple) {
      setThemeMode(next);
      AsyncStorage.setItem(STORAGE_KEYS.THEME, next).catch(() => {});
    }
  };

  // Helper: Get local accounts
  const getLocalAccounts = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalAccount = async (account) => {
    try {
      const accounts = await getLocalAccounts();
      const idx = accounts.findIndex(
        (a) =>
          a.username.toLowerCase() === account.username.toLowerCase() ||
          (a.phone && account.phone && a.phone.replace(/\D/g, '') === account.phone.replace(/\D/g, ''))
      );
      if (idx > -1) {
        accounts[idx] = { ...accounts[idx], ...account };
      } else {
        accounts.push(account);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed saving local account:', e);
    }
  };

  // Customer Registration (Create Account)
  const registerCustomer = async (username, phone, password, remember = true) => {
    const cleanUser = (username || '').trim().replace(/^@/, '');
    const cleanPhone = (phone || '').trim();
    if (!cleanUser) {
      return { ok: false, error: 'Telegram username is required' };
    }
    if (!password || password.length < 4) {
      return { ok: false, error: t('passwordTooShort') };
    }

    try {
      const res = await ApiClient.registerCustomer(cleanUser, cleanPhone, password);
      const userObj = res.user || (res.id ? res : null);
      if (res.ok && userObj) {
        setUser(userObj);
        setRememberMe(remember);
        await saveLocalAccount({ ...userObj, password });
        if (remember) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        }
        showToast(t('accountCreatedSuccess'));
        return { ok: true, user: userObj };
      }

      // Offline / local account fallback
      if (res.networkError || !res.ok) {
        const localAccounts = await getLocalAccounts();
        const exists = localAccounts.find(
          (a) => a.username.toLowerCase() === cleanUser.toLowerCase()
        );
        if (exists && exists.password) {
          return { ok: false, error: 'An account with this Telegram username already exists. Please log in.' };
        }

        const offlineUser = {
          id: 'U_local_' + Math.random().toString(36).slice(2, 8),
          username: cleanUser,
          phone: cleanPhone,
          name: cleanUser,
          points: 10,
          vouchers: [],
          role: 'customer',
        };
        setUser(offlineUser);
        setRememberMe(remember);
        await saveLocalAccount({ ...offlineUser, password });
        if (remember) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(offlineUser));
        }
        showToast(t('accountCreatedSuccess'));
        return { ok: true, user: offlineUser };
      }
      return { ok: false, error: res.error || 'Registration failed' };
    } catch (e) {
      return { ok: false, error: e.message || 'Registration failed' };
    }
  };

  // Customer Login
  const loginCustomer = async (identifier, password = '', remember = true) => {
    const cleanIdent = (identifier || '').trim();
    if (!cleanIdent) {
      return { ok: false, error: 'Phone number or Telegram username required' };
    }

    try {
      const res = await ApiClient.loginUser(cleanIdent, password);
      const userObj = res.user || (res.id ? res : null);
      if (res.ok && userObj) {
        setUser(userObj);
        setRememberMe(remember);
        if (password) await saveLocalAccount({ ...userObj, password });
        if (remember) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        }
        showToast(`✨ ${t('gateConnectedAs')} @${userObj.username}`);
        return { ok: true, user: userObj };
      }

      // If server returned explicit 401 / bad password error
      if (res.status === 401 || (res.error && res.error.toLowerCase().includes('password'))) {
        return { ok: false, error: res.error || t('invalidPassword') };
      }

      // Offline fallback: check local accounts
      if (res.networkError || !res.ok) {
        const localAccounts = await getLocalAccounts();
        const digitsIdent = cleanIdent.replace(/\D/g, '');
        const matched = localAccounts.find((a) => {
          const matchUser = a.username.toLowerCase() === cleanIdent.toLowerCase().replace(/^@/, '');
          const matchPhone = a.phone && digitsIdent && a.phone.replace(/\D/g, '').endsWith(digitsIdent.slice(-8));
          return matchUser || matchPhone;
        });

        if (matched) {
          if (matched.password && password && matched.password !== password) {
            return { ok: false, error: t('invalidPassword') };
          }
          const { password: _p, ...safeUser } = matched;
          setUser(safeUser);
          setRememberMe(remember);
          if (remember) {
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
          }
          showToast(`✨ ${t('gateConnectedAs')} @${safeUser.username}`);
          return { ok: true, user: safeUser };
        }

        // If no password was required or legacy demo user
        if (!password) {
          const cleanUname = cleanIdent.replace(/^@/, '') || 'customer';
          const offlineUser = {
            id: 'U_local_' + Math.random().toString(36).slice(2, 8),
            username: cleanUname,
            phone: cleanIdent,
            name: cleanUname,
            points: 10,
            vouchers: [],
            role: 'customer',
          };
          setUser(offlineUser);
          return { ok: true, user: offlineUser };
        }

        return { ok: false, error: t('accountNotFound') };
      }
      return { ok: false, error: res.error || 'Login failed' };
    } catch (e) {
      return { ok: false, error: e.message || 'Login failed' };
    }
  };

  // Recover Account Password
  const recoverCustomerPassword = async (identifier, newPassword) => {
    const cleanIdent = (identifier || '').trim();
    if (!cleanIdent) {
      return { ok: false, error: 'Phone number or Telegram username required' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: t('passwordTooShort') };
    }

    try {
      const res = await ApiClient.recoverCustomerPassword(cleanIdent, newPassword);
      const userObj = res.user || (res.id ? res : null);
      if (res.ok && userObj) {
        setUser(userObj);
        await saveLocalAccount({ ...userObj, password: newPassword });
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
        showToast(t('passwordResetSuccess'));
        return { ok: true, user: userObj };
      }

      // Offline fallback: check and update local account
      const localAccounts = await getLocalAccounts();
      const digitsIdent = cleanIdent.replace(/\D/g, '');
      const idx = localAccounts.findIndex((a) => {
        const matchUser = a.username.toLowerCase() === cleanIdent.toLowerCase().replace(/^@/, '');
        const matchPhone = a.phone && digitsIdent && a.phone.replace(/\D/g, '').endsWith(digitsIdent.slice(-8));
        return matchUser || matchPhone;
      });

      if (idx > -1) {
        localAccounts[idx].password = newPassword;
        await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(localAccounts));
        const { password: _p, ...safeUser } = localAccounts[idx];
        setUser(safeUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
        showToast(t('passwordResetSuccess'));
        return { ok: true, user: safeUser };
      }

      return { ok: false, error: res.error || t('accountNotFound') };
    } catch (e) {
      return { ok: false, error: e.message || 'Recovery failed' };
    }
  };

  // Customer Logout
  const logoutCustomer = async () => {
    setUser(null);
    setIsGuest(true);
    setSelectedVoucher(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    showToast(t('loginDataCleared'));
  };

  // Admin PIN Login
  const loginAdmin = async (pin) => {
    const trimmedPin = (pin || '').trim();
    const res = await ApiClient.verifyAdminPin(trimmedPin);
    if (res.ok && res.token) {
      setAdminToken(res.token);
      setIsAdmin(true);
      await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, res.token);
      showToast('👑 Admin Authorized');
      // Pass token directly to immediately fetch admin orders without waiting for next render
      ApiClient.getOrders(null, res.token).then((ordersRes) => {
        if (ordersRes.ok && Array.isArray(ordersRes.orders)) {
          setAdminOrders(ordersRes.orders);
        }
      }).catch(() => {});
      return { ok: true };
    }

    return { ok: false, error: res.error || 'Invalid Admin Security PIN' };
  };

  // Admin Direct Token Login (e.g. from CLI deep-link)
  const loginAdminWithToken = async (token) => {
    if (!token) return { ok: false };
    setAdminToken(token);
    setIsAdmin(true);
    await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
    showToast('👑 Admin Authorized');
    refreshOrders();
    return { ok: true };
  };

  // Admin Logout
  const logoutAdmin = async () => {
    setAdminToken(null);
    setIsAdmin(false);
    await AsyncStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    showToast('Admin logged out');
  };

  // Cart operations
  const addToCart = (item, qty = 1) => {
    const itemPoints = Math.max(1, parseInt(item.pt !== undefined ? item.pt : (item.points || 1), 10));
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id && !i.isCustom);
      if (idx > -1 && !item.isCustom) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty, points: itemPoints, pt: itemPoints };
        return next;
      }
      return [...prev, { ...item, qty, points: itemPoints, pt: itemPoints }];
    });
    showToast(`🛒 ${item.name} (${qty}) • +${itemPoints * qty} pt`);
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const updateCartQty = (cartItemId, delta) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.id === cartItemId) {
            const nextQty = i.qty + delta;
            return nextQty > 0 ? { ...i, qty: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, i) => acc + (i.qty || 1), 0);
  const cartSubtotal = cart.reduce((acc, i) => acc + (i.price || 0) * (i.qty || 1), 0);

  const continueAsGuest = () => {
    setIsGuest(true);
    showToast('🛍️ Exploring Storefront as Guest');
  };

  return (
    <AppContext.Provider
      value={{
        // Themes & Language
        lang,
        setLang,
        themeMode,
        theme,
        toggleTheme,
        t,

        // Customer & Guest
        user,
        setUser,
        isGuest,
        setIsGuest,
        authGateTab,
        setAuthGateTab,
        continueAsGuest,
        rememberMe,
        registerCustomer,
        loginCustomer,
        recoverCustomerPassword,
        logoutCustomer,
        refreshUser,

        // Admin
        isAdmin,
        adminToken,
        loginAdmin,
        loginAdminWithToken,
        logoutAdmin,

        // Catalog & Orders
        settings,
        setSettings,
        categories,
        products,
        charms,
        categoryFilters,
        setCategoryFilters,
        userOrders,
        adminOrders,
        refreshCatalog,
        refreshOrders,
        addSubmittedOrder,
        updateOrder,
        wipeOrders,
        runAutoWipeOrders,

        // Cart
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        cartCount,
        cartSubtotal,
        selectedVoucher,
        setSelectedVoucher,

        // Toast
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
