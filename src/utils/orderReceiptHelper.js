// ================================================================
// Order Receipt Helper for Somphea Reak Studio
// Provides thumbnail resolution, category mapping, and parsing
// for official receipt card presentation across Admin & Customer screens.
// ================================================================

import { Linking, Platform } from 'react-native';
import { resolveProductImage, CATEGORY_FALLBACK_IMAGES } from './productImageHelper';
import { resolveCharmImage } from './charmImageHelper';

const CHARM_CLEAN_LOCAL = require('../../assets/charm_clean.png');

/**
 * Resolve product thumbnail image source for any order item
 * Fallbacks cleanly to catalog matching by id, productId, or product name
 */
export function getOrderItemImageSource(item, products = [], charms = []) {
  if (!item) {
    return CHARM_CLEAN_LOCAL;
  }

  // 0. Exact custom bracelet preview image or snapshot
  const preview = item.braceletPreviewImage || item.braceletImage;
  if (preview && typeof preview === 'string' && preview.startsWith('data:image/')) {
    return { uri: preview };
  }

  // 1. Direct image property on item
  const raw = item.image || item.img;
  if (raw) {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return { uri: trimmed };
      }
      if (trimmed.includes('charm_clean') || trimmed.endsWith('.png')) {
        return resolveCharmImage(trimmed);
      }
      return resolveProductImage(trimmed);
    }
    if (typeof raw === 'object' && raw !== null) {
      return raw;
    }
  }

  // 2. Custom bracelet / charm detection
  if (item.isCustom || (item.name && item.name.toLowerCase().includes('bracelet'))) {
    return CHARM_CLEAN_LOCAL;
  }

  // 3. Match against products catalog by id, productId, or name
  if (Array.isArray(products) && products.length > 0) {
    const prodMatch = products.find((p) => {
      if (!p) return false;
      const itemId = item.productId || item.product_id || item.id;
      if (itemId && (p.id === itemId || String(p.id) === String(itemId))) return true;
      if (item.name && p.name && item.name.toLowerCase().trim() === p.name.toLowerCase().trim()) return true;
      return false;
    });

    if (prodMatch) {
      return resolveProductImage(prodMatch);
    }
  }

  // 4. Match against charms catalog by id or name
  if (Array.isArray(charms) && charms.length > 0) {
    const charmMatch = charms.find((c) => {
      if (!c) return false;
      const itemId = item.charmId || item.id;
      if (itemId && (c.id === itemId || String(c.id) === String(itemId))) return true;
      if (item.name && c.name && item.name.toLowerCase().trim() === c.name.toLowerCase().trim()) return true;
      return false;
    });

    if (charmMatch) {
      return resolveCharmImage(charmMatch.image || charmMatch.img);
    }
  }

  // 5. Fallback using item object itself through resolveProductImage
  return resolveProductImage(item);
}

/**
 * Determine a clean category label for receipt display
 */
export function getOrderItemCategory(item, products = []) {
  if (!item) return 'PRODUCT';

  if (item.category || item.cat) {
    return String(item.category || item.cat).toUpperCase();
  }

  if (item.isCustom || (item.name && item.name.toLowerCase().includes('bracelet'))) {
    return 'BRACELET';
  }

  if (Array.isArray(products) && products.length > 0) {
    const p = products.find((prod) => {
      if (!prod) return false;
      const itemId = item.productId || item.product_id || item.id;
      if (itemId && (prod.id === itemId || String(prod.id) === String(itemId))) return true;
      if (item.name && prod.name && item.name.toLowerCase().trim() === prod.name.toLowerCase().trim()) return true;
      return false;
    });

    if (p && (p.category || p.cat)) {
      return String(p.category || p.cat).toUpperCase();
    }
  }

  return 'PRODUCT';
}

/**
 * Safely parse order items from JSON string or Array
 */
export function parseOrderItems(rawItems) {
  if (!rawItems) return [];
  if (Array.isArray(rawItems)) return rawItems;
  if (typeof rawItems === 'string') {
    try {
      const parsed = JSON.parse(rawItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Dual currency formatting (KHR and USD)
 */
export function formatCurrencyPair(amountInUSD, rate = 4100) {
  const usd = Number(amountInUSD) || 0;
  const khr = Math.round(usd * rate);
  return {
    usdFormatted: `$${usd.toFixed(2)}`,
    khrFormatted: `${khr.toLocaleString()} ៛`,
    usdNumber: usd,
    khrNumber: khr,
  };
}

/**
 * Formats receipt number strictly into date and time format:
 * xxxx-xx-xx Txx.xx (e.g. 2026-10-12 T22.15)
 */
export function formatReceiptNumber(orderOrDate, fallbackId = '') {
  if (!orderOrDate) return fallbackId || '';

  let dateVal = orderOrDate;
  let id = fallbackId;

  if (typeof orderOrDate === 'object' && orderOrDate !== null) {
    const existing = orderOrDate.receipt_number || '';
    if (/^\d{4}-\d{2}-\d{2}\s*T\d{2}\.\d{2}/i.test(existing)) {
      return existing;
    }
    dateVal = orderOrDate.created_at || orderOrDate.createdAt || orderOrDate.date;
    id = orderOrDate.receipt_number || orderOrDate.id || fallbackId;
  }

  if (!dateVal) return id || '';

  const str = String(dateVal).trim();
  const match = str.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2})[:\.](\d{2})/i);
  if (match) {
    return `${match[1]} T${match[2]}.${match[3]}`;
  }

  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} T${hh}.${min}`;
    }
  } catch (e) {}

  return id || str;
}

/**
 * Checks if an order matches a search query by receipt number (xxxx-xx-xx Txx.xx),
 * old receipt number, order ID, customer name, phone, etc.
 * Supports # prefix, compact datetime (e.g. 2026-10-12T22.15), colons (22:15), etc.
 */
export function matchesReceiptSearch(order, query) {
  if (!query || !query.trim()) return true;
  if (!order) return false;

  const rawQ = query.trim().toLowerCase();
  const qClean = rawQ.replace(/^receipt\s*#?/i, '').replace(/^[#]/, '').trim();
  if (!qClean) return true;

  const qNorm = qClean.replace(/[:]/g, '.');
  const qCompact = qClean.replace(/[\s\-_:\.t]/g, '');

  const formattedReceipt = formatReceiptNumber(order).toLowerCase();
  const formattedNorm = formattedReceipt.replace(/[:]/g, '.');
  const formattedCompact = formattedReceipt.replace(/[\s\-_:\.t]/g, '');

  const rawReceipt = String(order.receipt_number || '').toLowerCase();
  const rawReceiptNorm = rawReceipt.replace(/[:]/g, '.');
  const rawReceiptCompact = rawReceipt.replace(/[\s\-_:\.t]/g, '');

  const orderId = String(order.id || '').toLowerCase();
  const orderIdCompact = orderId.replace(/[\s\-_:\.t]/g, '');

  const createdAt = String(order.created_at || order.createdAt || '').toLowerCase().replace(/[:]/g, '.');
  const createdAtCompact = createdAt.replace(/[\s\-_:\.t]/g, '');

  let custName = String(order.customer_name || '').toLowerCase();
  let phone = String(order.phone || '').toLowerCase();
  if (order.contact && typeof order.contact === 'object') {
    custName = custName || String(order.contact.name || '').toLowerCase();
    phone = phone || String(order.contact.phone || '').toLowerCase();
  }

  // Exact or substring match on formatted/raw receipt
  if (formattedReceipt.includes(qClean) || formattedNorm.includes(qNorm)) return true;
  if (rawReceipt.includes(qClean) || rawReceiptNorm.includes(qNorm)) return true;

  // Compact match (handles missing/extra spaces, missing 'T', dash/colon variations)
  if (qCompact.length >= 3) {
    if (formattedCompact.includes(qCompact)) return true;
    if (rawReceiptCompact.includes(qCompact)) return true;
    if (orderIdCompact.includes(qCompact)) return true;
    if (createdAtCompact.includes(qCompact)) return true;
  }

  // Order ID, created_at, customer name, phone
  if (orderId.includes(qClean) || createdAt.includes(qNorm)) return true;
  if (custName.includes(qClean) || phone.includes(qClean)) return true;

  return false;
}

/**
 * Safely extracts voucher details (code, pct, discount amount) from an order
 */
export function getOrderVoucherInfo(order) {
  if (!order) return null;

  let contact = {};
  if (typeof order.contact === 'string') {
    try { contact = JSON.parse(order.contact); } catch { contact = {}; }
  } else if (order.contact && typeof order.contact === 'object') {
    contact = order.contact;
  }

  const rawCode = order.voucher || order.voucher_code || contact.voucher || contact.voucher_code || null;
  const discount = Number(order.discount !== undefined ? order.discount : (contact.discount !== undefined ? contact.discount : 0)) || 0;
  const subtotal = Number(order.subtotal !== undefined ? order.subtotal : (contact.subtotal !== undefined ? contact.subtotal : 0)) || 0;

  const codeStr = rawCode ? String(rawCode).trim() : '';
  const hasValidCode = codeStr && !['null', 'none', 'undefined', 'false', '0'].includes(codeStr.toLowerCase());

  let pct = Number(order.voucher_pct !== undefined ? order.voucher_pct : (contact.voucher_pct !== undefined ? contact.voucher_pct : 0)) || 0;
  if (pct <= 0 && discount > 0 && subtotal > 0) {
    pct = Math.min(100, Math.round((discount / subtotal) * 100));
  }

  if (hasValidCode || discount > 0) {
    return {
      code: hasValidCode ? codeStr.toUpperCase() : 'VOUCHER',
      pct: pct > 0 ? pct : 10,
      discount: discount,
      subtotalAfterDiscount: Math.max(0, subtotal - discount),
    };
  }

  return null;
}

/**
 * Clean and normalize a Telegram username / handle
 * Strips leading @, t.me links, web prefixes, and query parameters
 */
export function cleanTelegramUsername(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  str = str.replace(/^(https?:\/\/)?(www\.)?t\.me\//i, '');
  str = str.replace(/^@+/, '');
  str = str.split(/[/?#]/)[0];
  return str.trim();
}

/**
 * Open customer Telegram profile in browser or Telegram app
 * Handles web (window.open with blank target) and native platforms (Linking.openURL)
 */
export function openTelegramCustomer(username) {
  const clean = cleanTelegramUsername(username);
  if (!clean) return false;
  const url = `https://t.me/${clean}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.open) {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    } catch {
      // Fallback if window.open is restricted
    }
  }

  Linking.openURL(url).catch((err) => {
    console.warn('Could not open Telegram URL:', err);
  });
  return true;
}
