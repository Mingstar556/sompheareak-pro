import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { AnimatedPressable } from './AnimatedPressable';
import { resolveProductImage } from '../utils/productImageHelper';

// Tailored luxury product bio generator based on product details and category
const getProductBio = (product, lang) => {
  if (product?.bio && product.bio.trim()) return product.bio.trim();
  if (product?.description && product.description.trim()) return product.description.trim();
  if (product?.desc && product.desc.trim()) return product.desc.trim();

  const cat = (product?.cat || '').toLowerCase();
  if (cat === 'custom-bracelet') {
    return lang === 'km'
      ? 'ខ្សែដៃអ៊ីតាលីដែកអ៊ីណុក 316L គុណភាពខ្ពស់ មិនច្រេះ មិនប្រតិកម្មស្បែក ធន់នឹងទឹក ១០០%។ រៀបចំ និងផ្គុំមន្តស្នេហ៍ (Charms) ចាប់ពី ១៥ ប្រឡោះឡើងទៅតាមចំណូលចិត្តរបស់អ្នក។'
      : 'Authentic Italian modular charm bracelet base handcrafted with medical-grade 316L surgical stainless steel. Features expandable internal spring links that connect seamlessly edge-to-edge. Completely waterproof, tarnish-proof, and hypoallergenic. Personalize with your choice of charms to tell your story.';
  }
  if (cat === 'minifigure') {
    return lang === 'km'
      ? 'តុក្កតាប្រមូលកម្រ Collector-Grade Mini Figure ផលិតពីជ័រ ABS កម្រិតខ្ពស់ ពណ៌ច្បាស់ស្អាត មិនងាយរបក។ ស័ក្តិសមបំផុតសម្រាប់ដាក់តាំងលម្អលើតុការងារ ឬប្រមូលជាអនុស្សាវរីយ៍។'
      : 'Collector-grade collectible figure crafted with precision high-density ABS molding and vibrant UV-cured paints. Features articulated display poses and authentic character accessories. Perfect for desktop display or showcase collections.';
  }
  if (cat === 'bracelet') {
    return lang === 'km'
      ? 'គ្រឿងអលង្ការខ្សែដៃដែកអ៊ីណុក 316L ប្រណិត មិនច្រេះ មិនប្រែពណ៌ ធន់នឹងញើស និងទឹក ១០០%។ រចនាម៉ូតទាន់សម័យ សាកសមសម្រាប់ទាំងបុរស និងនារី។'
      : 'Heavyweight luxury stainless steel jewelry engineered for durability and everyday wear. 100% waterproof, sweatproof, and skin-friendly. Features a secure precision clasp with high-mirror metallic luster.';
  }
  if (cat === 'toy-universe') {
    return lang === 'km'
      ? 'ប្រដាប់ក្មេងលេងបែបវិទ្យាសាស្ត្រ និងតុក្កតា kinetic desk toy គុណភាពខ្ពស់ ជំនួយដល់ការផ្តោតអារម្មណ៍ និងការសម្រាកខួរក្បាល។'
      : 'Interactive kinetic engineering toy built with premium weighted components and smooth low-friction mechanisms. Designed for tactile focus, scientific appreciation, and elegant desktop aesthetics.';
  }
  return lang === 'km'
    ? 'ផលិតផលគុណភាពខ្ពស់ ធានាភាពត្រឹមត្រូវ ១០០% ពី Somphea Reak Studio។ ដឹកជញ្ជូនរហ័សទូទាំងប្រទេសកម្ពុជា។'
    : 'Premium quality curated by Somphea Reak Studio. Backed by our 100% authentic satisfaction guarantee, secure packaging, and fast express delivery across Cambodia.';
};

export const ProductQuickViewModal = ({
  visible,
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  onCustomize,
}) => {
  const { theme, themeMode, t, lang, showToast, settings } = useApp();
  const isDark = themeMode === 'dark';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [qty, setQty] = useState(1);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [boxOption, setBoxOption] = useState('basic');
  const BOX_PREMIUM_PRICE = 0.5;

  if (!product) return null;

  const isBraceletProduct = product.cat === 'custom-bracelet' ||
    product.cat === 'bracelet' ||
    (product.name && product.name.toLowerCase().includes('bracelet')) ||
    (product.name && product.name.toLowerCase().includes('ital'));

  const rate = Number(settings?.exchange_rate) || 4100;

  // Only show Free Delivery badge for the specific product that the admin set
  const isFreeDelivery = product.free_delivery === 1 || product.free_delivery === '1' || product.free_delivery === true;

  const isOutOfStock = (product.stock || 0) <= 0;
  const isLowStock = !isOutOfStock && (product.stock || 0) <= 3;
  const baseDiscountedPrice = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
  const boxExtra = (isBraceletProduct && boxOption === 'premium') ? BOX_PREMIUM_PRICE : 0;
  const finalPrice = baseDiscountedPrice + boxExtra;
  const subtotal = finalPrice * qty;

  // Resolve product image source - Displays authentic product photo, never the store logo
  const imageSource = resolveProductImage(product);

  const handleAdd = () => {
    const itemToAdd = isBraceletProduct ? {
      ...product,
      price: finalPrice,
      boxOption,
      boxPrice: boxExtra,
      charmsSummary: boxOption === 'premium' ? '🎁 Premium Box (+$0.50)' : '📦 Basic Box ($0.00)',
    } : product;
    if (onAddToCart) onAddToCart(itemToAdd, qty);
    showToast(`✓ Added ${qty}x ${product.name} to cart`);
    onClose();
  };

  const handleBuy = () => {
    const itemToAdd = isBraceletProduct ? {
      ...product,
      price: finalPrice,
      boxOption,
      boxPrice: boxExtra,
      charmsSummary: boxOption === 'premium' ? '🎁 Premium Box (+$0.50)' : '📦 Basic Box ($0.00)',
    } : product;
    if (onBuyNow) onBuyNow(itemToAdd, qty);
    onClose();
  };

  const bioText = getProductBio(product, lang);
  const pointsEarned = (product.pt !== undefined ? product.pt : (product.points || 1)) * qty;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.78)' }]}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                maxWidth: isDesktop ? 860 : 412,
                flexDirection: isDesktop ? 'row' : 'column',
              },
            ]}
          >
            {/* Top Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            {/* ========================================================== */}
            {/* 1. BIG PICTURE SHOWCASE (Hero image with badges & zoom)     */}
            {/* ========================================================== */}
            <View
              style={[
                styles.imageBox,
                {
                  width: isDesktop ? 380 : '100%',
                  height: isDesktop ? '100%' : 190,
                  minHeight: isDesktop ? 480 : 190,
                  backgroundColor: '#ffffff',
                },
              ]}
            >
              <Image
                source={imageSource}
                style={styles.image}
                resizeMode="contain"
              />

              {/* Floating Badges */}
              <View style={styles.floatingBadgesContainer}>
                {product.discount > 0 && (
                  <View style={[styles.discountBadge, { backgroundColor: '#f43f5e' }]}>
                    <Text style={styles.discountText}>-{product.discount}% OFF</Text>
                  </View>
                )}

                <View style={[styles.pointsBadge, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]}>
                  <Text style={{ color: '#eab308', fontWeight: '800', fontSize: 11 }}>
                    ⭐ +{product.pt !== undefined ? product.pt : (product.points || 1)} Stars
                  </Text>
                </View>

                {isFreeDelivery && (
                  <View style={[styles.pointsBadge, { backgroundColor: 'rgba(16, 185, 129, 0.92)' }]}>
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>
                      🚚 Free Delivery
                    </Text>
                  </View>
                )}
              </View>

              {/* Product ID Pill on Big Picture */}
              {product.id ? (
                <View style={styles.productIdPill}>
                  <Text style={styles.productIdPillText}>🆔 {product.id}</Text>
                </View>
              ) : null}

              {/* Zoom Button */}
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => setIsZoomOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.zoomBtnText}>🔍 {lang === 'km' ? 'ពង្រីករូប' : 'Enlarge'}</Text>
              </TouchableOpacity>
            </View>

            {/* ========================================================== */}
            {/* 2. PRODUCT DETAILS & BIO CONTENT PANEL                    */}
            {/* ========================================================== */}
            <ScrollView
              style={[styles.scrollPanel, { flex: isDesktop ? 1 : undefined }]}
              contentContainerStyle={styles.detailsContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Category & Stock Row */}
              <View style={styles.metaRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.categoryBadge, { backgroundColor: theme.secondaryBg || 'rgba(16, 185, 129, 0.12)' }]}>
                    <Text style={[styles.categoryText, { color: theme.secondary || '#10b981' }]}>
                      {product.cat?.toUpperCase()}
                    </Text>
                  </View>
                  {isFreeDelivery && (
                    <View style={[styles.categoryBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
                      <Text style={{ color: theme.secondary || '#10b981', fontSize: 10, fontWeight: '800' }}>
                        🚚 Free Delivery
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.stockBadge}>
                  <View
                    style={[
                      styles.stockDot,
                      { backgroundColor: isOutOfStock ? theme.error : isLowStock ? theme.gold : (theme.secondary || '#10b981') },
                    ]}
                  />
                  <Text style={[styles.stockText, { color: isOutOfStock ? theme.error : theme.textMuted }]}>
                    {isOutOfStock ? t('outOfStock') : `${t('inStock')}: ${product.stock} units`}
                  </Text>
                </View>
              </View>

              {/* Product Title */}
              <Text style={[styles.name, { color: theme.text }]}>
                {product.name}
              </Text>

              {/* Price Row */}
              <View style={styles.priceRow}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={[styles.price, { color: theme.secondary || '#10b981' }]}>
                    ${finalPrice.toFixed(2)}
                  </Text>
                  {product.discount > 0 && (
                    <Text style={[styles.oldPrice, { color: theme.textMuted }]}>
                      ${(+product.price || 0).toFixed(2)}
                    </Text>
                  )}
                </View>
                {product.discount > 0 && (
                  <View style={styles.savingsPill}>
                    <Text style={styles.savingsPillText}>
                      Save ${(product.price - finalPrice).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.khrPrice, { color: theme.textMuted }]}>
                ≈ {Math.round(finalPrice * rate).toLocaleString()} ៛ • Earns {pointsEarned} loyalty points
              </Text>

              {/* ======================================================== */}
              {/* 3. PRODUCT BIO & DESCRIPTION SECTION                     */}
              {/* ======================================================== */}
              <View style={[styles.bioSection, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Text style={{ fontSize: 14 }}>📖</Text>
                  <Text style={[styles.bioSectionTitle, { color: theme.gold }]}>
                    {lang === 'km' ? 'ព័ត៌មានលម្អិត & ការពិពណ៌នា (Product Bio)' : 'Product Bio & Details'}
                  </Text>
                </View>
                <Text style={[styles.bioText, { color: theme.text }]}>
                  {bioText}
                </Text>
              </View>

              {/* Key Features & Specifications Badges */}
              <View style={styles.specsGrid}>
                <View style={[styles.specItem, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={styles.specIcon}>💎</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specTitle, { color: theme.text }]}>
                      {product.cat === 'custom-bracelet' || product.cat === 'bracelet' ? '316L Stainless Steel' : 'Collector Quality'}
                    </Text>
                    <Text style={[styles.specSub, { color: theme.textMuted }]}>
                      {product.cat === 'custom-bracelet' || product.cat === 'bracelet' ? 'Waterproof & Rust-proof' : 'High-density ABS resin'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.specItem, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={styles.specIcon}>🚚</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specTitle, { color: theme.text }]}>Express Shipping</Text>
                    <Text style={[styles.specSub, { color: theme.textMuted }]}>Phnom Penh 1-Day • Provinces 1-2 Days</Text>
                  </View>
                </View>

                <View style={[styles.specItem, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={styles.specIcon}>💵</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specTitle, { color: theme.text }]}>Verified Payments</Text>
                    <Text style={[styles.specSub, { color: theme.textMuted }]}>Cash on Delivery (COD) & ABA KHQR</Text>
                  </View>
                </View>

                <View style={[styles.specItem, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={styles.specIcon}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specTitle, { color: theme.text }]}>100% Genuine</Text>
                    <Text style={[styles.specSub, { color: theme.textMuted }]}>Somphea Reak Studio Warranty</Text>
                  </View>
                </View>
              </View>

              {/* Bracelet Packaging Option (Basic vs Premium Box +$0.50) */}
              {isBraceletProduct && (
                <View style={styles.boxOptionSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={[styles.boxOptionTitle, { color: theme.text }]}>
                      🎁 {lang === 'km' ? 'ជម្រើសប្រអប់ខ្សែដៃ (Packaging)' : 'Bracelet Packaging Option:'}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      {boxOption === 'premium' ? '✨ Premium Box (+$0.50)' : '📦 Basic Box ($0.00)'}
                    </Text>
                  </View>

                  <View style={styles.boxOptionsGrid}>
                    <TouchableOpacity
                      style={[
                        styles.boxOptionCard,
                        {
                          backgroundColor: boxOption === 'basic'
                            ? (isDark ? 'rgba(16, 185, 129, 0.08)' : '#ecfdf5')
                            : theme.inputBg,
                          borderColor: boxOption === 'basic' ? (theme.secondary || '#10b981') : theme.border,
                          borderWidth: boxOption === 'basic' ? 2 : 1.5,
                        },
                        boxOption === 'basic' && isDark && {
                          shadowColor: theme.secondary || '#10b981',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.75,
                          shadowRadius: 10,
                          elevation: 6,
                          ...(Platform.OS === 'web' ? {
                            boxShadow: '0 0 12px rgba(16, 185, 129, 0.45)',
                          } : {}),
                        },
                      ]}
                      onPress={() => setBoxOption('basic')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.boxOptionCardInner}>
                        <View style={[
                          styles.boxOptionIconWrap,
                          boxOption === 'basic' && isDark && {
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            borderColor: 'rgba(16, 185, 129, 0.35)',
                            borderWidth: 1,
                          },
                        ]}>
                          <Text style={{ fontSize: 16 }}>📦</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.boxOptionTitleText, { color: theme.text }]}>
                            {lang === 'km' ? 'ប្រអប់ធម្មតា' : 'Basic Box'}
                          </Text>
                          <Text style={[styles.boxOptionSubText, { color: theme.secondary || '#10b981' }]}>
                            Included ($0)
                          </Text>
                        </View>
                        {boxOption === 'basic' && (
                          <View style={[styles.boxRadioActive, { backgroundColor: theme.secondary || '#10b981' }]}>
                            <Text style={styles.boxRadioCheck}>✓</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.boxOptionCard,
                        {
                          backgroundColor: boxOption === 'premium'
                            ? (isDark ? 'rgba(212, 175, 55, 0.10)' : '#fefce8')
                            : theme.inputBg,
                          borderColor: boxOption === 'premium' ? (theme.gold || '#d4af37') : theme.border,
                          borderWidth: boxOption === 'premium' ? 2 : 1.5,
                        },
                        boxOption === 'premium' && isDark && {
                          shadowColor: theme.gold || '#d4af37',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.8,
                          shadowRadius: 12,
                          elevation: 7,
                          ...(Platform.OS === 'web' ? {
                            boxShadow: '0 0 14px rgba(212, 175, 55, 0.5)',
                          } : {}),
                        },
                      ]}
                      onPress={() => setBoxOption('premium')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.boxOptionCardInner}>
                        <View style={[
                          styles.boxOptionIconWrap,
                          boxOption === 'premium' && isDark && {
                            backgroundColor: 'rgba(212, 175, 55, 0.18)',
                            borderColor: 'rgba(212, 175, 55, 0.4)',
                            borderWidth: 1,
                          },
                        ]}>
                          <Text style={{ fontSize: 16 }}>🎁</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Text style={[styles.boxOptionTitleText, { color: theme.text }]}>
                              {lang === 'km' ? 'ប្រអប់ប្រណិត' : 'Premium Box'}
                            </Text>
                            <View style={[styles.extraBadge, { backgroundColor: theme.gold + '25', borderColor: theme.gold }]}>
                              <Text style={{ fontSize: 8.5, fontWeight: '900', color: theme.gold }}>+0.5$</Text>
                            </View>
                          </View>
                          <Text style={[styles.boxOptionSubText, { color: theme.gold }]}>
                            +$0.50
                          </Text>
                        </View>
                        {boxOption === 'premium' && (
                          <View style={[styles.boxRadioActive, { backgroundColor: theme.gold }]}>
                            <Text style={[styles.boxRadioCheck, { color: '#000000' }]}>✓</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ======================================================== */}
              {/* 4. QUANTITY SELECTOR & TOTAL CALCULATION                 */}
              {/* ======================================================== */}
              {!isOutOfStock && product.cat !== 'custom-bracelet' && (
                <View style={styles.qtyRow}>
                  <View>
                    <Text style={[styles.qtyLabel, { color: theme.text }]}>
                      {lang === 'km' ? 'ចំនួនទិញ:' : 'Select Quantity:'}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      Subtotal: ${subtotal.toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.qtyBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setQty(Math.max(1, qty - 1))}
                    >
                      <Text style={[styles.qtyBtnText, { color: theme.text }]}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.qtyVal, { color: theme.text }]}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setQty(Math.min(product.stock || 99, qty + 1))}
                    >
                      <Text style={[styles.qtyBtnText, { color: theme.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ======================================================== */}
              {/* 5. ADD TO CART & ACTIONS                                 */}
              {/* ======================================================== */}
              {product.cat === 'custom-bracelet' ? (
                <View style={{ gap: 8, marginTop: 10 }}>
                  <AnimatedPressable
                    style={[styles.customActionBtn, { backgroundColor: theme.secondary || '#10b981' }]}
                    onPress={() => {
                      if (onCustomize) onCustomize(product);
                      onClose();
                    }}
                    scaleTo={0.96}
                  >
                    <Text style={styles.customActionBtnText}>
                      🔗 {lang === 'km' ? 'រចនាខ្សែដៃអ៊ីតាលី (Custom Italy Charms) →' : 'Design Italian Charm Bracelet (15+ Links) →'}
                    </Text>
                  </AnimatedPressable>

                  <TouchableOpacity
                    style={[styles.cartBtn, { backgroundColor: theme.secondaryDark || '#059669' }]}
                    onPress={handleAdd}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.cartBtnText}>
                      🛒 {t('addToCart')} Starter Band (${finalPrice.toFixed(2)})
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : isOutOfStock ? (
                <View style={[styles.outOfStockBox, { backgroundColor: theme.inputBg }]}>
                  <Text style={[styles.outOfStockText, { color: theme.error }]}>
                    📦 {t('outOfStock')} (Restocking Soon)
                  </Text>
                </View>
              ) : (
                <View style={styles.actionsGrid}>
                  <TouchableOpacity
                    style={[styles.cartBtn, { backgroundColor: theme.secondary || '#10b981' }]}
                    onPress={handleAdd}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.cartBtnText}>
                      🛒 {t('addToCart')} • ${subtotal.toFixed(2)}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.buyBtn, { backgroundColor: theme.secondaryDark || '#059669' }]}
                    onPress={handleBuy}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.buyBtnText}>
                      ⚡ {t('buyNow')} ({qty}x)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* FULLSCREEN PICTURE MODAL                                      */}
      {/* ============================================================== */}
      {isZoomOpen && (
        <Modal
          visible={isZoomOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsZoomOpen(false)}
        >
          <View style={styles.fullscreenOverlay}>
            <TouchableOpacity
              style={styles.fullscreenCloseBtn}
              onPress={() => setIsZoomOpen(false)}
            >
              <Text style={styles.fullscreenCloseText}>✕ Close Fullscreen</Text>
            </TouchableOpacity>

            <Image
              source={imageSource}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 999,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  imageBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 16,
  },
  image: {
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
  floatingBadgesContainer: {
    position: 'absolute',
    top: 14,
    left: 14,
    gap: 6,
    zIndex: 10,
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  discountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  productIdPill: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  productIdPillText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  zoomBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  zoomBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollPanel: {
    maxHeight: '100%',
  },
  detailsContent: {
    padding: 14,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  categoryText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stockDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  name: {
    fontSize: 16.5,
    fontWeight: '800',
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
  },
  oldPrice: {
    fontSize: 15,
    textDecorationLine: 'line-through',
  },
  savingsPill: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  savingsPillText: {
    color: '#f43f5e',
    fontSize: 11,
    fontWeight: '800',
  },
  khrPrice: {
    fontSize: 12,
    marginTop: -4,
  },
  bioSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  bioSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  bioText: {
    fontSize: 12,
    lineHeight: 18,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  specItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  specIcon: {
    fontSize: 16,
  },
  specTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  specSub: {
    fontSize: 9,
    marginTop: 1,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  qtyVal: {
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 10,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  cartBtn: {
    flex: 1.2,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cartBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  buyBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af37',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  customActionBtn: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customActionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  outOfStockBox: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    fontSize: 13,
    fontWeight: '800',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 30,
    right: 20,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullscreenCloseText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  fullscreenImage: {
    width: '92%',
    height: '80%',
  },
  boxOptionSection: {
    marginBottom: 12,
  },
  boxOptionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  boxOptionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  boxOptionCard: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  boxOptionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boxOptionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOptionTitleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  boxOptionSubText: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
  },
  extraBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  boxRadioActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxRadioCheck: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 11,
  },
});
