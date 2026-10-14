import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/ProductCard';
import { BigCategoryBoxes } from '../../components/BigCategoryBoxes';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { MovingBanner } from '../../components/MovingBanner';
import { ProductQuickViewModal } from '../../components/ProductQuickViewModal';
import { AdminQuickProductModal } from '../../components/AdminQuickProductModal';
import { AdminQuickCategoryModal } from '../../components/AdminQuickCategoryModal';
import { AdminQuickSettingsModal } from '../../components/AdminQuickSettingsModal';
import { AdminCategoryFiltersModal } from '../../components/AdminCategoryFiltersModal';
import { isBraceletStyleId } from '../../utils/braceletIdHelper';

export const StorefrontHomeScreen = ({
  onNavigate,
  isAdminMode = false,
  onAdminEditCategories,
  adminTriggerAction,
  onAdminTriggerHandled,
}) => {
  const {
    theme,
    lang,
    t,
    settings,
    categories,
    products,
    categoryFilters,
    refreshCatalog,
    addToCart,
    adminToken,
    showToast,
  } = useApp();

  const { width } = useWindowDimensions();

  // Fluid Product Grid: 2 columns on mobile phone, 3 columns on tablet
  const isTablet = width > 500;
  const gridGap = isTablet ? 10 : 8;
  const productCardWidth = isTablet
    ? (Platform.OS === 'web' ? 'calc(33.333% - 7px)' : '31.5%')
    : '48.5%';

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedFilterId, setSelectedFilterId] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [refreshing, setRefreshing] = useState(false);

  // Quick View Product Modal
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Admin Live Mode Modals
  const [editProductModalVisible, setEditProductModalVisible] = useState(false);
  const [targetProduct, setTargetProduct] = useState(null);
  const [editCategoryModalVisible, setEditCategoryModalVisible] = useState(false);
  const [targetCategory, setTargetCategory] = useState(null);
  const [editSettingsModalVisible, setEditSettingsModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Reset active filter when changing category
  useEffect(() => {
    setSelectedFilterId('all');
  }, [selectedCat]);

  // Respond to Admin Live Toolbar Action triggers
  useEffect(() => {
    if (!adminTriggerAction) return;
    if (adminTriggerAction.type === 'add-product') {
      setTargetProduct(null);
      setEditProductModalVisible(true);
      if (onAdminTriggerHandled) onAdminTriggerHandled();
    } else if (adminTriggerAction.type === 'add-category') {
      setTargetCategory(null);
      setEditCategoryModalVisible(true);
      if (onAdminTriggerHandled) onAdminTriggerHandled();
    } else if (adminTriggerAction.type === 'edit-settings') {
      setEditSettingsModalVisible(true);
      if (onAdminTriggerHandled) onAdminTriggerHandled();
    } else if (adminTriggerAction.type === 'manage-filters') {
      setFilterModalVisible(true);
      if (onAdminTriggerHandled) onAdminTriggerHandled();
    }
  }, [adminTriggerAction, onAdminTriggerHandled]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCatalog();
    setRefreshing(false);
  };

  // Active filters relevant to the currently selected category
  const currentCategoryFilters = useMemo(() => {
    if (!Array.isArray(categoryFilters)) return [];
    if (selectedCat === 'all') {
      return categoryFilters;
    }
    return categoryFilters.filter(
      (f) => f.category_id === selectedCat || f.category_id === 'all'
    );
  }, [categoryFilters, selectedCat]);

  // Count products matching a specific filter within current category scope
  const getFilterCount = useCallback((filter) => {
    if (!filter) return 0;
    const pids = new Set(Array.isArray(filter.product_ids) ? filter.product_ids : []);
    const kwTerms = (filter.match_keywords || '')
      .toLowerCase()
      .split(/[,;\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    return products.filter((p) => {
      const matchCat = selectedCat === 'all' || p.cat === selectedCat;
      if (!matchCat) return false;
      if (pids.has(p.id)) return true;
      if (kwTerms.length > 0) {
        const textToMatch = `${p.name || ''} ${p.bio || p.description || p.desc || ''}`.toLowerCase();
        return kwTerms.some((term) => textToMatch.includes(term));
      }
      return false;
    }).length;
  }, [products, selectedCat]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const matchCat = selectedCat === 'all' || p.cat === selectedCat;
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.cat?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    // Apply active category filter tag if selected
    if (selectedFilterId !== 'all') {
      const activeFilter = (categoryFilters || []).find((f) => f.id === selectedFilterId);
      if (activeFilter) {
        const pids = new Set(Array.isArray(activeFilter.product_ids) ? activeFilter.product_ids : []);
        const kwTerms = (activeFilter.match_keywords || '')
          .toLowerCase()
          .split(/[,;\s]+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 2);

        list = list.filter((p) => {
          // 1. Explicitly selected product IDs
          if (pids.has(p.id)) return true;
          // 2. Keyword match in name or description/bio
          if (kwTerms.length > 0) {
            const textToMatch = `${p.name || ''} ${p.bio || p.description || p.desc || ''}`.toLowerCase();
            return kwTerms.some((term) => textToMatch.includes(term));
          }
          return false;
        });
      }
    }

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => {
        const pa = a.discount > 0 ? a.price * (1 - a.discount / 100) : a.price;
        const pb = b.discount > 0 ? b.price * (1 - b.discount / 100) : b.price;
        return pa - pb;
      });
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => {
        const pa = a.discount > 0 ? a.price * (1 - a.discount / 100) : a.price;
        const pb = b.discount > 0 ? b.price * (1 - b.discount / 100) : b.price;
        return pb - pa;
      });
    } else if (sortBy === 'points') {
      list = [...list].sort((a, b) => (b.pt !== undefined ? b.pt : (b.points || 1)) - (a.pt !== undefined ? a.pt : (a.points || 1)));
    } else if (sortBy === 'stock') {
      list = [...list].sort((a, b) => (b.stock || 0) - (a.stock || 0));
    }

    return list;
  }, [products, selectedCat, search, sortBy, selectedFilterId, categoryFilters]);

  const handleAddToCart = useCallback((p, quantity = 1) => {
    addToCart(p, typeof quantity === 'number' ? quantity : 1);
  }, [addToCart]);

  const handleCustomize = useCallback(() => {
    if (onNavigate) onNavigate('custom-bracelet');
  }, [onNavigate]);

  // Admin inline editing handlers
  const handleOpenEditProduct = (prod) => {
    setTargetProduct(prod);
    setEditProductModalVisible(true);
  };

  const handleProductSaved = async (savedData, isDeleted = false) => {
    await refreshCatalog();
    showToast(isDeleted ? '🗑️ Product removed' : '✓ Product updated live in database!');
  };

  const handleCategorySaved = async (savedData, isDeleted = false) => {
    await refreshCatalog();
    showToast(isDeleted ? '🗑️ Category removed' : '✓ Category updated live in database!');
  };

  const handleSettingsSaved = async () => {
    await refreshCatalog();
    showToast('✓ Store settings updated live!');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={styles.innerContainer}>
        {/* Dynamic Moving Banner with Continuous Ticker & Category Hero Carousel */}
        <MovingBanner
          onNavigate={onNavigate}
          onSelectCategory={setSelectedCat}
          isAdminMode={isAdminMode}
          onAdminEditSettings={() => setEditSettingsModalVisible(true)}
        />

        {/* Featured Collections & Custom Italy Charm Spotlight */}
        <BigCategoryBoxes
          categories={categories}
          selectedCat={selectedCat}
          onSelectCat={setSelectedCat}
          products={products}
          onOpenCustomBracelet={handleCustomize}
          isAdminMode={isAdminMode}
          onAdminEditCategories={onAdminEditCategories}
          onOpenAddCategory={() => {
            setTargetCategory(null);
            setEditCategoryModalVisible(true);
          }}
          onOpenEditCategory={(cat) => {
            setTargetCategory(cat);
            setEditCategoryModalVisible(true);
          }}
        />

        {/* Section Header & Active Filter Feedback (General Shop / Collections Header) */}
        <View style={styles.sectionHeader}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {selectedCat === 'all'
                  ? t('generalShopTitle')
                  : `${categories.find((c) => c.id === selectedCat)?.icon || '🛍️'} ${
                      lang === 'km'
                        ? categories.find((c) => c.id === selectedCat)?.kh || selectedCat
                        : categories.find((c) => c.id === selectedCat)?.name || selectedCat
                    }`}
              </Text>
              {selectedCat !== 'all' && (
                <TouchableOpacity
                  style={[styles.clearFilterPill, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  onPress={() => setSelectedCat('all')}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '700' }}>✕ Show All</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.sectionCount, { color: theme.textMuted }]}>
              {t('resultsFound', { n: filteredProducts.length })}
            </Text>
          </View>

          {isAdminMode && (
            <TouchableOpacity
              style={[styles.addProdBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                setTargetProduct(null);
                setEditProductModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.addProdBtnText}>+ Add Product</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Clean Luxury Search Bar (Placed below General Shop title) */}
        <View style={styles.searchRow}>
          <View style={styles.searchIconWrap}>
            <Text style={{ fontSize: 15 }}>🔍</Text>
          </View>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setSearch('')}
              activeOpacity={0.7}
            >
              <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Italian Bracelet Style ID Detected Card */}
        {isBraceletStyleId(search.trim()) ? (
          <TouchableOpacity
            style={[
              styles.styleIdFoundCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.gold || '#d4af37',
              },
            ]}
            onPress={() => onNavigate('custom-bracelet', { initialStyleId: search.trim() })}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Text style={{ fontSize: 13 }}>✨</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: theme.gold, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Italian Bracelet Style ID Found
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }} numberOfLines={1}>
                  {search.trim().toUpperCase()}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                  Tap to load & recreate this exact custom bracelet!
                </Text>
              </View>
              <View style={[styles.styleIdOpenBadge, { backgroundColor: theme.primary }]}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Open →</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Dynamic Category Filter Place (Adjustable by Admin, Shoppable by Customer) */}
        {(currentCategoryFilters.length > 0 || isAdminMode) && (
          <View style={[styles.filterPlaceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.filterPlaceHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text style={{ fontSize: 13 }}>🏷️</Text>
                <Text style={[styles.filterPlaceTitle, { color: theme.text }]}>
                  {lang === 'km' ? 'តម្រង' : 'Filters'}
                </Text>
                <View style={[styles.filterCatBadge, { backgroundColor: theme.primary + '18' }]}>
                  <Text style={[styles.filterCatBadgeText, { color: theme.primary }]}>
                    {selectedCat === 'all'
                      ? (lang === 'km' ? 'ទាំងអស់' : 'All')
                      : (categories.find((c) => c.id === selectedCat)?.name || selectedCat)}
                  </Text>
                </View>
              </View>

              {isAdminMode && (
                <TouchableOpacity
                  style={[styles.adminAdjustFilterBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setFilterModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.adminAdjustFilterBtnText}>
                    {lang === 'km' ? '⚙️ កែសម្រួល Filters' : '⚙️ Adjust Filters'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsScroll}
            >
              {/* "All" Filter Pill */}
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: selectedFilterId === 'all' ? theme.primary : theme.inputBg,
                    borderColor: selectedFilterId === 'all' ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedFilterId('all')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: selectedFilterId === 'all' ? '#ffffff' : theme.text,
                      fontWeight: selectedFilterId === 'all' ? '800' : '600',
                    },
                  ]}
                >
                  {lang === 'km' ? 'ទាំងអស់' : 'All'}
                </Text>
              </TouchableOpacity>

              {/* Dynamic Filter Pills */}
              {currentCategoryFilters.map((flt) => {
                const isSelected = selectedFilterId === flt.id;
                const count = getFilterCount(flt);
                const displayName = lang === 'km' && flt.name_km ? flt.name_km : flt.name;

                return (
                  <TouchableOpacity
                    key={flt.id}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.inputBg,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedFilterId(flt.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: isSelected ? '#ffffff' : theme.text,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {displayName}
                    </Text>
                    <View
                      style={[
                        styles.filterCountBadge,
                        {
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.28)' : (theme.primary + '18'),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterCountBadgeText,
                          {
                            color: isSelected ? '#ffffff' : theme.primary,
                          },
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Quick Add Filter Button for Admin inside pill list */}
              {isAdminMode && (
                <TouchableOpacity
                  style={[styles.filterPillAdd, { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}
                  onPress={() => setFilterModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterPillAddText, { color: theme.primary }]}>
                    + {lang === 'km' ? 'បន្ថែម Filter' : 'Add Filter'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* D2C Fast Sort Controls */}
        <View style={styles.sortContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortScrollContent}
          >
            <Text style={[styles.sortPrefixText, { color: theme.textMuted }]}>
              ⚡ {t('sortBy')}:
            </Text>
            {[
              { id: 'featured', label: t('sortFeatured') },
              { id: 'price-asc', label: t('sortPriceAsc') },
              { id: 'price-desc', label: t('sortPriceDesc') },
              { id: 'points', label: t('sortPoints') },
              { id: 'stock', label: lang === 'km' ? 'ក្នុងស្តុកមុនគេ' : 'In Stock First' },
            ].map((opt) => {
              const isSelected = sortBy === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.sortPill,
                    {
                      backgroundColor: isSelected ? (theme.secondary || '#10b981') : theme.inputBg,
                      borderColor: isSelected ? (theme.secondary || '#10b981') : theme.border,
                    },
                  ]}
                  onPress={() => setSortBy(opt.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sortPillText,
                      {
                        color: isSelected ? '#ffffff' : theme.textMuted,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Products Grid (4 by 4 on PC, 2 by 2 on Phone) */}
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
            <Text style={[styles.emptyText, { color: theme.text, fontSize: 16, fontWeight: '700' }]}>
              {t('noItemsCat')}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
              {search ? 'Try clearing your search term.' : 'New items arrive weekly.'}
            </Text>
            {selectedCat !== 'all' && (
              <TouchableOpacity
                style={[styles.emptyResetBtn, { backgroundColor: theme.secondary || '#10b981' }]}
                onPress={() => setSelectedCat('all')}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>View All Products</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                cardWidth={productCardWidth}
                onAddToCart={handleAddToCart}
                onCustomize={handleCustomize}
                onQuickView={setQuickViewProduct}
                isAdminMode={isAdminMode}
                onAdminEdit={handleOpenEditProduct}
              />
            ))}
          </View>
        )}

        {/* Boutique Ownership & Legal Footer */}
        <View style={[styles.storeFooter, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerBrand, { color: theme.gold }]}>
            សម្ភារៈ • Somphea Reak Studio
          </Text>
          <Text style={[styles.footerTagline, { color: theme.textMuted }]}>
            {lang === 'km' ? 'ព្រះរាជាណាចក្រកម្ពុជា • គ្រឿងអលង្ការ និងតុក្កតាប្រណីត' : 'Cambodia Kingdom of Wonder • Premium Collectibles & Italy Charms'}
          </Text>
          <Text style={[styles.footerCopyright, { color: theme.textMuted }]}>
            © 2026 Somphea Reak Studio. All Rights Reserved. Phnom Penh, Cambodia.
          </Text>
        </View>
      </View>

      {/* Customer Product Quick View Modal */}
      <ProductQuickViewModal
        visible={!!quickViewProduct}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={(prod, q) => {
          addToCart(prod, q);
          if (onNavigate) onNavigate('checkout');
        }}
        onCustomize={handleCustomize}
      />

      {/* Admin Quick Edit Product Modal */}
      {isAdminMode && (
        <AdminQuickProductModal
          visible={editProductModalVisible}
          product={targetProduct}
          categories={categories}
          adminToken={adminToken}
          theme={theme}
          onClose={() => setEditProductModalVisible(false)}
          onSaved={handleProductSaved}
        />
      )}

      {/* Admin Quick Edit/Add Category Modal */}
      {isAdminMode && (
        <AdminQuickCategoryModal
          visible={editCategoryModalVisible}
          category={targetCategory}
          categories={categories}
          adminToken={adminToken}
          theme={theme}
          onClose={() => setEditCategoryModalVisible(false)}
          onSaved={handleCategorySaved}
        />
      )}

      {/* Admin Quick Edit Settings Modal */}
      {isAdminMode && (
        <AdminQuickSettingsModal
          visible={editSettingsModalVisible}
          settings={settings}
          adminToken={adminToken}
          theme={theme}
          onClose={() => setEditSettingsModalVisible(false)}
          onSaved={handleSettingsSaved}
        />
      )}

      {/* Admin Category Filters Modal */}
      {isAdminMode && (
        <AdminCategoryFiltersModal
          visible={filterModalVisible}
          initialCategoryId={selectedCat === 'all' ? (categories[0]?.id || 'all') : selectedCat}
          categories={categories}
          products={products}
          categoryFilters={categoryFilters}
          adminToken={adminToken}
          theme={theme}
          onClose={() => setFilterModalVisible(false)}
          onSaved={async () => {
            await refreshCatalog();
          }}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  innerContainer: {
    width: '100%',
  },
  announcement: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.2,
  },
  adminInlineBtn: {
    backgroundColor: '#eab308',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  adminInlineBtnText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  heroCard: {
    padding: 26,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 7,
  },
  heroContent: {
    width: '100%',
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  heroPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  heroPillText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroEditionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroEditionText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  heroDesc: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 720,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  heroBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  heroBtnText: {
    color: '#090b11',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  heroSecondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heroSecondaryBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },
  heroAdminBtn: {
    backgroundColor: '#334155',
  },
  heroAdminBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  trustItem: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchRow: {
    position: 'relative',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconWrap: {
    position: 'absolute',
    left: 10,
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingLeft: 34,
    paddingRight: 32,
    fontSize: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sortContainer: {
    marginBottom: 12,
    width: '100%',
  },
  sortScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  sortPrefixText: {
    fontSize: 11,
    fontWeight: '800',
    marginRight: 2,
  },
  sortPill: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortPillText: {
    fontSize: 10.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  sectionCount: {
    fontSize: 11,
    marginTop: 2,
  },
  clearFilterPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  addProdBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addProdBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    width: '100%',
    rowGap: 8,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    width: '100%',
  },
  emptyText: {
    fontSize: 15,
  },
  emptyResetBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  styleIdFoundCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14,
    elevation: 3,
  },
  styleIdOpenBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  filterPlaceCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  filterPlaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterPlaceTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  filterCatBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  filterCatBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  adminAdjustFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  adminAdjustFilterBtnText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  filterPillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
  },
  filterCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    alignItems: 'center',
  },
  filterCountBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  filterPillAdd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  filterPillAddText: {
    fontSize: 11,
    fontWeight: '800',
  },
  storeFooter: {
    marginTop: 28,
    marginBottom: 16,
    paddingTop: 18,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerTagline: {
    fontSize: 11,
    textAlign: 'center',
  },
  footerCopyright: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
