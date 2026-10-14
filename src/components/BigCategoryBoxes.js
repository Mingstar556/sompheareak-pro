import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Image, Platform, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { AnimatedPressable } from './AnimatedPressable';
import { resolveCharmImage } from '../utils/charmImageHelper';

// Sophisticated luxury category accents with subtle jewel tones
const CATEGORY_THEMES = {
  all: {
    border: '#10b981',
    accent: '#34d399',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    glow: 'rgba(16, 185, 129, 0.35)',
    topDark: 'rgba(16, 185, 129, 0.28)',
    topLight: 'rgba(16, 185, 129, 0.18)',
    icon: '✨',
  },
  'custom-bracelet': {
    border: '#d4af37',
    accent: '#fbbf24',
    iconBg: 'rgba(212, 175, 55, 0.15)',
    glow: 'rgba(212, 175, 55, 0.45)',
    topDark: 'rgba(212, 175, 55, 0.32)',
    topLight: 'rgba(212, 175, 55, 0.22)',
    icon: '🇮🇹',
  },
  charms: {
    border: '#d4af37',
    accent: '#fbbf24',
    iconBg: 'rgba(212, 175, 55, 0.15)',
    glow: 'rgba(212, 175, 55, 0.45)',
    topDark: 'rgba(212, 175, 55, 0.32)',
    topLight: 'rgba(212, 175, 55, 0.22)',
    icon: '🇮🇹',
  },
  minifigure: {
    border: '#e11d48',
    accent: '#fb7185',
    iconBg: 'rgba(225, 29, 72, 0.15)',
    glow: 'rgba(225, 29, 72, 0.35)',
    topDark: 'rgba(225, 29, 72, 0.28)',
    topLight: 'rgba(225, 29, 72, 0.18)',
    icon: '🧸',
  },
  'toy-universe': {
    border: '#8b5cf6',
    accent: '#a78bfa',
    iconBg: 'rgba(139, 92, 246, 0.15)',
    glow: 'rgba(139, 92, 246, 0.35)',
    topDark: 'rgba(139, 92, 246, 0.28)',
    topLight: 'rgba(139, 92, 246, 0.18)',
    icon: '🪀',
  },
  bracelet: {
    border: '#06b6d4',
    accent: '#38bdf8',
    iconBg: 'rgba(6, 182, 212, 0.15)',
    glow: 'rgba(6, 182, 212, 0.35)',
    topDark: 'rgba(6, 182, 212, 0.28)',
    topLight: 'rgba(6, 182, 212, 0.18)',
    icon: '💎',
  },
};

const DEFAULT_THEME = {
  border: '#6366f1',
  accent: '#818cf8',
  iconBg: 'rgba(99, 102, 241, 0.15)',
  glow: 'rgba(99, 102, 241, 0.35)',
  topDark: 'rgba(99, 102, 241, 0.28)',
  topLight: 'rgba(99, 102, 241, 0.18)',
  icon: '📦',
};

export const BigCategoryBoxes = ({
  categories = [],
  selectedCat = 'all',
  onSelectCat,
  products = [],
  onOpenCustomBracelet,
  isAdminMode = false,
  onAdminEditCategories,
  onOpenAddCategory,
  onOpenEditCategory,
}) => {
  const { theme, themeMode, lang, charms } = useApp();
  const { width } = useWindowDimensions();

  const isDark = themeMode === 'dark';
  const isDesktop = width >= 768;

  // Fluid 2-column mobile dimensions - Sleek landscape ratio (~1.9:1)
  const gap = 8;
  const boxWidth = '48.5%';
  const boxMinHeight = 88;
  const topHalfHeight = 36;
  const iconCircleSize = 30;
  const iconTopPos = Math.round(topHalfHeight - iconCircleSize / 2); // 21px

  const getTopHalfBg = (cfg, isSelected) => {
    if (isDark) {
      return isSelected ? `${cfg.border}48` : (cfg.topDark || `${cfg.border}28`);
    }
    return isSelected ? `${cfg.border}2e` : (cfg.topLight || `${cfg.border}18`);
  };

  const getProductCount = (catId) => {
    if (catId === 'all') return products.length;
    return products.filter((p) => p.cat === catId).length;
  };

  const allItemsCount = products.length;

  return (
    <View style={styles.container}>
      {/* ============================================================== */}
      {/* 👑 ATELIER SHOWCASE: Italian Modular Charm Studio               */}
      {/* ============================================================== */}
      <AnimatedPressable
        style={[
          styles.atelierCard,
          {
            backgroundColor: isDark ? '#0f1422' : '#ffffff',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.45)' : 'rgba(212, 175, 55, 0.6)',
            shadowColor: '#d4af37',
          },
        ]}
        onPress={() => {
          if (onOpenCustomBracelet) onOpenCustomBracelet();
          else if (onSelectCat) onSelectCat('bracelet');
        }}
        scaleTo={0.99}
      >
        <View style={styles.atelierTopRow}>
          <View style={styles.atelierPill}>
            <Text style={styles.atelierPillText}>
              ✨ {lang === 'km' ? 'ស្ទូឌីយោគ្រឿងអលង្ការអុីតាលី' : 'ATELIER SPECIAL • MODULAR JEWELRY'}
            </Text>
          </View>
          <View style={styles.atelierBestsellerBadge}>
            <Text style={styles.atelierBestsellerText}>
              ⭐ {lang === 'km' ? 'ពេញនិយមបំផុត' : 'BESTSELLER'}
            </Text>
          </View>
        </View>

        <View style={styles.atelierContent}>
          <View style={styles.atelierInfo}>
            <Text style={[styles.atelierTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              🇮🇹 {lang === 'km' ? 'ខ្សែដៃអុីតាលីផ្ទាល់ខ្លួន (Custom Charm Studio)' : 'Custom Italian Charm Atelier'}
            </Text>
            <Text style={[styles.atelierSubtitle, { color: theme.textMuted }]}>
              {lang === 'km'
                ? 'រៀបចំខ្សែដៃផ្ទាល់ខ្លួនជាមួយ Charm អុីតាលី 9mm គុណភាពខ្ពស់ • ផ្លាស់ប្តូរ និងតម្រៀបតំណភ្ជាប់តាមចិត្ត'
                : 'Curate your signature 9mm stainless steel Italian charm bracelet with collectible links & charms.'}
            </Text>

            {/* Micro Charm Preview Chain - Only shown when charms exist in store */}
            {charms && charms.length > 0 ? (
              <View style={styles.charmChainContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.charmChain}
                >
                  {charms.map((ch, idx) => (
                    <View
                      key={ch.id || idx}
                      style={[
                        styles.charmPreviewPill,
                        {
                          backgroundColor: isDark ? '#161b2e' : '#f8fafc',
                          borderColor: 'rgba(212, 175, 55, 0.4)',
                        },
                      ]}
                    >
                      <Image
                        source={resolveCharmImage(ch.image)}
                        style={{ width: 22, height: 22 }}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={[styles.emptyCharmNotice, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : theme.border }]}>
                <Text style={{ fontSize: 11.5, color: theme.textMuted, fontWeight: '700' }}>
                  {lang === 'km' ? '✨ មិនទាន់មានតំណាក់ក្នុងស្តុកទេ (០ ម៉ូដ) • ម៉ូតថ្មីៗនឹងមកដល់ឆាប់ៗ' : '✨ Catalog Cleared (0 Charms) • New designs arriving soon'}
                </Text>
              </View>
            )}

            {/* Quick Metrics */}
            <View style={styles.atelierMetrics}>
              <View style={[styles.metricChip, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>
                <Text style={[styles.metricText, { color: theme.text }]}>
                  💎 {charms && charms.length > 0 ? `${charms.length} ${lang === 'km' ? 'ម៉ូតតំណាក់' : 'Modular Charms'}` : (lang === 'km' ? '០ ម៉ូដក្នុងស្តុក' : '0 Charms')}
                </Text>
              </View>
              {charms && charms.length > 0 ? (
                <View style={[styles.metricChip, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>
                  <Text style={[styles.metricText, { color: theme.text }]}>
                    💵 {lang === 'km' ? 'ចាប់ពី $0.75' : 'From $0.75'}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.metricChip, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Text style={[styles.metricText, { color: '#fbbf24' }]}>
                  ⭐ +5 Loyalty Pts
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.atelierCtaWrap}>
            <View style={[styles.atelierCtaBtn, { backgroundColor: theme.secondary || '#10b981' }]}>
              <Text style={styles.atelierCtaBtnText}>
                🎨 {lang === 'km' ? 'រចនាខ្សែដៃឥឡូវនេះ' : 'Customize Now'} →
              </Text>
            </View>
          </View>
        </View>
      </AnimatedPressable>

      {/* ============================================================== */}
      {/* Section Header: Featured Collections                           */}
      {/* ============================================================== */}
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {lang === 'km' ? 'បណ្តុំប្រភេទផលិតផល' : 'Featured Collections'}
          </Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            {lang === 'km' ? 'ជ្រើសរើសប្រភេទដើម្បីមើលទំនិញ' : 'Explore luxury collectibles, modular jewelry & gifts'}
          </Text>
        </View>

        {isAdminMode && (
          <TouchableOpacity
            style={[styles.adminCatBtn, { backgroundColor: theme.primary || '#10b981' }]}
            onPress={onOpenAddCategory || onAdminEditCategories}
            activeOpacity={0.8}
            accessibilityLabel="Add New Category"
          >
            <Text style={styles.adminCatBtnText}>➕ Add Category</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ============================================================== */}
      {/* Professional Category Boxes Grid                               */}
      {/* ============================================================== */}
      <View style={styles.grid}>
        {/* 'All Products' Box */}
        {(() => {
          const cfg = CATEGORY_THEMES.all;
          const isSelected = selectedCat === 'all';
          const topBg = getTopHalfBg(cfg, isSelected);
          return (
            <AnimatedPressable
              style={[
                styles.box,
                {
                  width: boxWidth,
                  minHeight: boxMinHeight,
                  backgroundColor: isDark ? theme.card : '#ffffff',
                  borderColor: isSelected ? cfg.border : (isDark ? 'rgba(255, 255, 255, 0.1)' : theme.border),
                  borderWidth: isSelected ? 2 : 1,
                  shadowColor: isSelected ? cfg.border : '#000',
                },
                isSelected && styles.activeBoxGlow,
              ]}
              onPress={() => onSelectCat('all')}
              scaleTo={0.97}
            >
              {/* Top Half: Tinted Category Color Accent */}
              <View
                style={[
                  styles.boxTopHalf,
                  {
                    height: topHalfHeight,
                    backgroundColor: topBg,
                    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <View style={styles.topSheen} />
              </View>

              {/* Centered Category Logo Badge */}
              <View style={[styles.iconCircleWrap, { top: iconTopPos }]}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      width: iconCircleSize,
                      height: iconCircleSize,
                      borderRadius: iconCircleSize / 2,
                      backgroundColor: isDark ? '#111524' : '#ffffff',
                      borderColor: isSelected ? cfg.border : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'),
                    },
                  ]}
                >
                  <Text style={[styles.iconText, { fontSize: isDesktop ? 20 : 18 }]}>
                    {cfg.icon}
                  </Text>
                </View>
              </View>

              {/* Bottom Half: Category Title & Count */}
              <View style={[styles.boxBottomHalf, { paddingTop: Math.round(iconCircleSize / 2 + 5) }]}>
                <Text
                  style={[
                    styles.boxTitle,
                    { color: isSelected ? (isDark ? '#34d399' : '#059669') : theme.text },
                  ]}
                  numberOfLines={1}
                >
                  {lang === 'km' ? 'ទាំងអស់' : 'All Products'}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)')
                        : (isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)'),
                      borderColor: isSelected ? 'rgba(16, 185, 129, 0.4)' : 'transparent',
                      borderWidth: isSelected ? 1 : 0,
                    },
                  ]}
                >
                  <Text style={[styles.countText, { color: isSelected ? '#10b981' : theme.textMuted }]}>
                    {allItemsCount} {lang === 'km' ? 'មុខ' : 'items'}
                  </Text>
                </View>
              </View>
            </AnimatedPressable>
          );
        })()}

        {/* Dynamic Category Boxes */}
        {categories.map((cat, index) => {
          const isSelected = selectedCat === cat.id;
          const count = getProductCount(cat.id);
          const displayName = lang === 'km' ? (cat.kh || cat.name) : (cat.en || cat.name);
          const cfg = CATEGORY_THEMES[cat.id] || DEFAULT_THEME;
          const topBg = getTopHalfBg(cfg, isSelected);

          return (
            <AnimatedPressable
              key={cat.id}
              style={[
                styles.box,
                {
                  width: boxWidth,
                  minHeight: boxMinHeight,
                  backgroundColor: isDark ? theme.card : '#ffffff',
                  borderColor: isSelected ? cfg.border : (isDark ? 'rgba(255, 255, 255, 0.1)' : theme.border),
                  borderWidth: isSelected ? 2 : 1,
                  shadowColor: isSelected ? cfg.border : '#000',
                },
                isSelected && styles.activeBoxGlow,
              ]}
              onPress={() => onSelectCat(cat.id)}
              scaleTo={0.97}
            >
              {/* Top Half: Tinted Category Color Accent */}
              <View
                style={[
                  styles.boxTopHalf,
                  {
                    height: topHalfHeight,
                    backgroundColor: topBg,
                    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <View style={styles.topSheen} />
              </View>

              {/* Admin Direct Category Edit Button (Only visible in Live Admin Mode) */}
              {isAdminMode && (
                <TouchableOpacity
                  style={styles.adminEditCatBadge}
                  onPress={(e) => {
                    if (e && e.stopPropagation) e.stopPropagation();
                    if (onOpenEditCategory) onOpenEditCategory(cat);
                  }}
                  activeOpacity={0.8}
                  accessibilityLabel={`Admin Edit Category ${displayName}`}
                >
                  <Text style={styles.adminEditCatBadgeText}>✏️ Edit</Text>
                </TouchableOpacity>
              )}

              {/* Centered Category Logo Badge */}
              <View style={[styles.iconCircleWrap, { top: iconTopPos }]}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      width: iconCircleSize,
                      height: iconCircleSize,
                      borderRadius: iconCircleSize / 2,
                      backgroundColor: isDark ? '#111524' : '#ffffff',
                      borderColor: isSelected ? cfg.border : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'),
                    },
                  ]}
                >
                  <Text style={[styles.iconText, { fontSize: isDesktop ? 20 : 18 }]}>
                    {cat.icon || cfg.icon || '📦'}
                  </Text>
                </View>
              </View>

              {/* Bottom Half: Category Title & Count */}
              <View style={[styles.boxBottomHalf, { paddingTop: Math.round(iconCircleSize / 2 + 5) }]}>
                <Text
                  style={[
                    styles.boxTitle,
                    { color: isSelected ? cfg.accent : theme.text },
                  ]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>

                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? `${cfg.border}26` : `${cfg.border}1a`)
                        : (isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)'),
                      borderColor: isSelected ? `${cfg.border}4d` : 'transparent',
                      borderWidth: isSelected ? 1 : 0,
                    },
                  ]}
                >
                  <Text style={[styles.countText, { color: isSelected ? cfg.accent : theme.textMuted }]}>
                    {count} {lang === 'km' ? 'មុខ' : 'items'}
                  </Text>
                </View>
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  atelierCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 11,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  atelierTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  atelierPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  atelierPillText: {
    color: '#d4af37',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  atelierBestsellerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  atelierBestsellerText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  atelierContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  atelierInfo: {
    flex: 1,
    minWidth: 140,
  },
  atelierTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  atelierSubtitle: {
    fontSize: 11,
    lineHeight: 15.5,
    marginBottom: 8,
  },
  charmChainContainer: {
    width: '100%',
    marginBottom: 10,
  },
  charmChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
    paddingRight: 8,
  },
  charmPreviewPill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyCharmNotice: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  atelierMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metricChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricText: {
    fontSize: 10,
    fontWeight: '700',
  },
  atelierCtaWrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  atelierCtaBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  atelierCtaBtnText: {
    color: '#090b11',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  adminCatBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  adminCatBtnText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '800',
  },
  adminEditCatBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#eab308',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 6,
  },
  adminEditCatBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: 8,
  },
  box: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'column',
  },
  activeBoxGlow: {
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  boxTopHalf: {
    width: '100%',
    position: 'relative',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  iconCircleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  iconText: {
    textAlign: 'center',
  },
  boxBottomHalf: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  boxTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    lineHeight: 14.5,
    textAlign: 'center',
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  countText: {
    fontSize: 8.5,
    fontWeight: '700',
  },
});
