import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { AnimatedPressable } from './AnimatedPressable';
import { resolveProductImage } from '../utils/productImageHelper';

export const ProductCard = React.memo(({
  product,
  onAddToCart,
  onCustomize,
  onQuickView,
  cardWidth,
  isAdminMode = false,
  onAdminEdit,
}) => {
  const { theme, t, settings } = useApp();

  const isOutOfStock = (product.stock || 0) <= 0;
  const isLowStock = !isOutOfStock && (product.stock || 0) <= 3;
  const finalPrice = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
  const rate = Number(settings?.exchange_rate) || 4100;

  // Only show Free Delivery badge for the specific product that the admin set
  const isFreeDelivery = product.free_delivery === 1 || product.free_delivery === '1' || product.free_delivery === true;

  // Image source resolution - Displays authentic product photo, never the store logo
  const imageSource = resolveProductImage(product);

  const handleCardPress = () => {
    if (onQuickView) {
      onQuickView(product);
    } else if (product.cat === 'custom-bracelet' && onCustomize) {
      onCustomize(product);
    }
  };

  return (
    <AnimatedPressable
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: isAdminMode ? 'rgba(234, 179, 8, 0.45)' : theme.border,
          width: cardWidth || '48.5%',
        },
      ]}
      onPress={handleCardPress}
      scaleTo={0.98}
    >
      {/* Product Image & Floating Luxury Badges */}
      <View style={styles.imageWrap}>
        <Image source={imageSource} style={styles.image} resizeMode="contain" />

        {/* Discount Badge */}
        {product.discount > 0 && (
          <View style={[styles.discountTag, { backgroundColor: theme.rose || '#f43f5e' }]}>
            <Text style={styles.discountText}>-{product.discount}%</Text>
          </View>
        )}

        {/* Loyalty Points Glass Badge */}
        <View style={styles.pointsTag}>
          <Text style={styles.pointsText}>⭐ +{product.pt !== undefined ? product.pt : (product.points || 1)} pt</Text>
        </View>

        {/* Free Delivery Tag */}
        {isFreeDelivery && (
          <View style={[styles.freeDeliveryBadge, { top: product.discount > 0 ? 32 : 6 }]}>
            <Text style={styles.freeDeliveryBadgeText}>🚚 Free Delivery</Text>
          </View>
        )}

        {/* Admin Direct Edit Trigger (Only visible in Live Admin Mode) */}
        {isAdminMode ? (
          <TouchableOpacity
            style={styles.adminEditBadge}
            onPress={() => onAdminEdit && onAdminEdit(product)}
            activeOpacity={0.8}
            accessibilityLabel={`Admin edit ${product.name}`}
          >
            <Text style={styles.adminEditText}>✏️ Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.quickViewHint}>
            <Text style={styles.quickViewHintText}>🔍 {t('quickView')}</Text>
          </View>
        )}
      </View>

      {/* Details Content */}
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={[styles.categoryName, { color: theme.primary }]} numberOfLines={1}>
            {product.cat?.toUpperCase()}
          </Text>
          <View style={styles.stockStatusRow}>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: isOutOfStock ? (theme.error || '#ef4444') : isLowStock ? (theme.gold || '#f59e0b') : (theme.secondary || '#10b981') },
              ]}
            />
            <Text style={[styles.stockText, { color: isOutOfStock ? theme.error : theme.textMuted }]}>
              {isOutOfStock ? t('outOfStock') : `${product.stock || 0} in stock`}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.text }]}>
            ${finalPrice.toFixed(2)}
          </Text>
          {product.discount > 0 && (
            <Text style={[styles.originalPrice, { color: theme.textMuted }]}>
              ${(+product.price || 0).toFixed(2)}
            </Text>
          )}
          <Text style={[styles.khrPrice, { color: theme.textMuted }]}>
            ≈ {Math.round(finalPrice * rate).toLocaleString()} ៛
          </Text>
        </View>

        {/* Action Button */}
        {product.cat === 'custom-bracelet' ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnCharm, { backgroundColor: theme.secondary || '#10b981' }]}
            onPress={() => onCustomize && onCustomize(product)}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionBtnText, { color: '#ffffff' }]} numberOfLines={1}>
              🔗 {t('designCharmBtn')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: isOutOfStock ? (theme.inputBg || '#1e293b') : (theme.secondary || '#10b981'),
                borderColor: isOutOfStock ? theme.border : (theme.secondaryBorder || 'rgba(16, 185, 129, 0.4)'),
              },
            ]}
            onPress={() => onAddToCart && onAddToCart(product)}
            disabled={isOutOfStock}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionBtnText, { color: isOutOfStock ? theme.textMuted : '#ffffff' }]} numberOfLines={1}>
              {isOutOfStock ? t('soldOut') : `🛒 ${t('addToCart')}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 13,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
    display: 'flex',
    flexDirection: 'column',
  },
  imageWrap: {
    width: '100%',
    height: 128,
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
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
  discountTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  pointsTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(12, 14, 23, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  pointsText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '800',
  },
  adminEditBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  adminEditText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  quickViewHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(9, 11, 17, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  quickViewHintText: {
    color: '#f1f5f9',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  content: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    minHeight: 34,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flexWrap: 'wrap',
    marginVertical: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  originalPrice: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  khrPrice: {
    fontSize: 9,
    fontWeight: '600',
  },
  stockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  stockText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  actionBtn: {
    paddingVertical: 5.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 4,
  },
  actionBtnCharm: {
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.25,
  },
  actionBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  freeDeliveryBadge: {
    position: 'absolute',
    left: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  freeDeliveryBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
