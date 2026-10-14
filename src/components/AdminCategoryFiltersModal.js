import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { ApiClient } from '../api/client';
import { resolveProductImage } from '../utils/productImageHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp, STORAGE_KEYS } from '../context/AppContext';

export const AdminCategoryFiltersModal = ({
  visible,
  initialCategoryId = 'all',
  categories = [],
  products = [],
  categoryFilters = [],
  adminToken,
  onClose,
  onSaved,
  theme,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const appContext = typeof useApp === 'function' ? useApp() : null;
  const setCategoryFilters = appContext?.setCategoryFilters;
  const showToast = appContext?.showToast;

  // Selected Category Tab
  const [selectedCatId, setSelectedCatId] = useState(initialCategoryId || 'all');

  // Modes: 'list' (viewing filters of selected category) | 'edit' (editing/adding a filter)
  const [mode, setMode] = useState('list');
  const [editingFilter, setEditingFilter] = useState(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formNameKm, setFormNameKm] = useState('');
  const [formTargetCat, setFormTargetCat] = useState('all');
  const [formKeywords, setFormKeywords] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [productSearch, setProductSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [smartMatchStatus, setSmartMatchStatus] = useState('');

  // Keep selected category synced when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedCatId(initialCategoryId || (categories[0]?.id || 'all'));
      setMode('list');
      setEditingFilter(null);
      setSmartMatchStatus('');
    }
  }, [visible, initialCategoryId, categories]);

  // Filters for current category
  const activeCategoryFilters = useMemo(() => {
    if (!Array.isArray(categoryFilters)) return [];
    if (selectedCatId === 'all') {
      return categoryFilters;
    }
    return categoryFilters.filter(
      (f) => f.category_id === selectedCatId || f.category_id === 'all'
    );
  }, [categoryFilters, selectedCatId]);

  // Products available in the target category for assignment
  const targetCategoryProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    if (formTargetCat === 'all') {
      return products;
    }
    return products.filter((p) => p.cat === formTargetCat);
  }, [products, formTargetCat]);

  // Products filtered by search in the selection list
  const filteredTargetProducts = useMemo(() => {
    const q = (productSearch || '').trim().toLowerCase();
    if (!q) return targetCategoryProducts;
    return targetCategoryProducts.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      const bio = (p.bio || p.description || p.desc || '').toLowerCase();
      return name.includes(q) || id.includes(q) || bio.includes(q);
    });
  }, [targetCategoryProducts, productSearch]);

  // Open Edit Mode for New Filter
  const handleStartAdd = () => {
    setEditingFilter(null);
    setFormName('');
    setFormNameKm('');
    setFormTargetCat(selectedCatId === 'all' ? (categories[0]?.id || 'all') : selectedCatId);
    setFormKeywords('');
    setSelectedProductIds(new Set());
    setProductSearch('');
    setSmartMatchStatus('');
    setMode('edit');
  };

  // Open Edit Mode for Existing Filter
  const handleStartEdit = (flt) => {
    setEditingFilter(flt);
    setFormName(flt.name || '');
    setFormNameKm(flt.name_km || flt.name || '');
    setFormTargetCat(flt.category_id || selectedCatId || 'all');
    setFormKeywords(flt.match_keywords || '');
    const pids = Array.isArray(flt.product_ids) ? flt.product_ids : [];
    setSelectedProductIds(new Set(pids));
    setProductSearch('');
    setSmartMatchStatus('');
    setMode('edit');
  };

  // Toggle selection for a product
  const toggleProduct = (prodId) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(prodId)) {
        next.delete(prodId);
      } else {
        next.add(prodId);
      }
      return next;
    });
  };

  const selectAllProducts = () => {
    const next = new Set(selectedProductIds);
    filteredTargetProducts.forEach((p) => next.add(p.id));
    setSelectedProductIds(next);
  };

  const clearSelectedProducts = () => {
    setSelectedProductIds(new Set());
  };

  // Smart Match by Similar Name & Product Description
  const handleSmartMatch = () => {
    const rawKeywords = [formKeywords, formName]
      .filter(Boolean)
      .join(',')
      .toLowerCase();

    const terms = rawKeywords
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);

    if (terms.length === 0) {
      Alert.alert(
        'Add Keywords or Name',
        'Please enter a Filter Name or Keywords above to match against product names and descriptions.'
      );
      return;
    }

    const matched = new Set(selectedProductIds);
    let newMatchesCount = 0;

    targetCategoryProducts.forEach((p) => {
      const name = (p.name || '').toLowerCase();
      const bio = (p.bio || p.description || p.desc || '').toLowerCase();
      const combined = `${name} ${bio}`;

      const isMatch = terms.some((term) => combined.includes(term));
      if (isMatch) {
        if (!matched.has(p.id)) {
          newMatchesCount++;
        }
        matched.add(p.id);
      }
    });

    setSelectedProductIds(matched);
    setSmartMatchStatus(`✓ Matched ${matched.size} product(s) (+${newMatchesCount} newly added)`);
  };

  // Save Filter to Backend Database (with instant local & offline fallback resilience)
  const handleSaveFilter = async () => {
    const cleanName = formName.trim();
    if (!cleanName) {
      Alert.alert('Validation Error', 'Please enter a filter name.');
      return;
    }

    setSubmitting(true);
    const filterId = editingFilter?.id || `flt-${formTargetCat}-${Date.now().toString(36)}`;
    const payload = {
      id: filterId,
      category_id: formTargetCat,
      name: cleanName,
      name_km: (formNameKm || cleanName).trim(),
      match_keywords: formKeywords.trim(),
      product_ids: Array.from(selectedProductIds),
      sort_order: editingFilter?.sort_order || 0,
      created_at: editingFilter?.created_at || new Date().toISOString(),
    };

    let savedFilter = payload;
    let savedOnServer = false;

    try {
      const res = await ApiClient.createCategoryFilter(payload, adminToken);
      if (res && res.ok && res.filter) {
        savedFilter = res.filter;
        savedOnServer = true;
      } else {
        console.warn('Backend category filter save returned non-ok (using resilient client persistence):', res?.error || res?.status);
      }
    } catch (netErr) {
      console.warn('Network error during category filter save (using resilient client persistence):', netErr);
    }

    // Seamlessly update AppContext state so UI reflects it immediately
    if (typeof setCategoryFilters === 'function') {
      setCategoryFilters((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        const idx = list.findIndex((f) => f.id === savedFilter.id);
        if (idx > -1) {
          list[idx] = savedFilter;
        } else {
          list.push(savedFilter);
        }
        return list;
      });
    }

    // Persist to local cache in AsyncStorage
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS?.CATALOG || 'sr_mobile_catalog_v3');
      const catalog = raw ? JSON.parse(raw) : {};
      const currentList = Array.isArray(catalog.categoryFilters) ? [...catalog.categoryFilters] : (Array.isArray(categoryFilters) ? [...categoryFilters] : []);
      const idx = currentList.findIndex((f) => f.id === savedFilter.id);
      if (idx > -1) {
        currentList[idx] = savedFilter;
      } else {
        currentList.push(savedFilter);
      }
      catalog.categoryFilters = currentList;
      await AsyncStorage.setItem(STORAGE_KEYS?.CATALOG || 'sr_mobile_catalog_v3', JSON.stringify(catalog));
    } catch (e) {
      console.warn('Failed to update category filters in AsyncStorage:', e);
    }

    setSubmitting(false);

    if (showToast) {
      showToast(savedOnServer ? '✓ Filter Saved' : '✓ Filter Saved (Active)');
    }

    if (onSaved) {
      onSaved(savedFilter);
    }

    setMode('list');
    setEditingFilter(null);
  };

  // Delete Filter (with instant local & offline fallback resilience)
  const handleDeleteFilter = (flt) => {
    Alert.alert(
      'Delete Filter',
      `Are you sure you want to delete filter "${flt.name}"? Products will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await ApiClient.deleteCategoryFilter(flt.id, adminToken);
            } catch (err) {
              console.warn('Notice: deleteCategoryFilter network:', err);
            }

            // Remove from AppContext state
            if (typeof setCategoryFilters === 'function') {
              setCategoryFilters((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                return list.filter((f) => f.id !== flt.id);
              });
            }

            // Remove from AsyncStorage catalog cache
            try {
              const raw = await AsyncStorage.getItem(STORAGE_KEYS?.CATALOG || 'sr_mobile_catalog_v3');
              if (raw) {
                const catalog = JSON.parse(raw);
                if (Array.isArray(catalog.categoryFilters)) {
                  catalog.categoryFilters = catalog.categoryFilters.filter((f) => f.id !== flt.id);
                  await AsyncStorage.setItem(STORAGE_KEYS?.CATALOG || 'sr_mobile_catalog_v3', JSON.stringify(catalog));
                }
              }
            } catch (e) {
              console.warn('Failed to remove filter from AsyncStorage:', e);
            }

            setSubmitting(false);
            if (showToast) showToast('🗑️ Filter Deleted');
            if (onSaved) onSaved(flt, true);
            setMode('list');
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme?.card || '#161b2e',
              borderColor: theme?.border || '#334155',
              maxWidth: isTablet ? 720 : 430,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme?.border || 'rgba(255,255,255,0.08)' }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.headerTitle, { color: theme?.text || '#ffffff' }]}>
                  {mode === 'edit'
                    ? editingFilter
                      ? '✏️ Edit Product Filter'
                      : '➕ Add Product Filter'
                    : '🏷️ Category Product Filters'}
                </Text>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN ONLY</Text>
                </View>
              </View>
              <Text style={[styles.headerSub, { color: theme?.textMuted || '#94a3b8' }]}>
                {mode === 'edit'
                  ? 'Assign products manually or auto-match by name & description'
                  : 'Customize customer filter pills for each category'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={{ color: theme?.textMuted || '#94a3b8', fontSize: 16, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mode 1: LIST FILTERS PER CATEGORY */}
          {mode === 'list' ? (
            <View style={{ flex: 1 }}>
              {/* Category Selector Tabs */}
              <View style={styles.catTabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabScroll}>
                  <TouchableOpacity
                    style={[
                      styles.catTabPill,
                      selectedCatId === 'all' && styles.catTabPillActive,
                      {
                        backgroundColor: selectedCatId === 'all' ? (theme?.primary || '#10b981') : (theme?.inputBg || 'rgba(255,255,255,0.05)'),
                        borderColor: selectedCatId === 'all' ? (theme?.primary || '#10b981') : (theme?.border || '#334155'),
                      },
                    ]}
                    onPress={() => setSelectedCatId('all')}
                  >
                    <Text
                      style={[
                        styles.catTabPillText,
                        { color: selectedCatId === 'all' ? '#ffffff' : (theme?.textMuted || '#94a3b8') },
                      ]}
                    >
                      🌐 All Categories
                    </Text>
                  </TouchableOpacity>

                  {categories.map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    const countForCat = (categoryFilters || []).filter((f) => f.category_id === cat.id).length;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catTabPill,
                          isSelected && styles.catTabPillActive,
                          {
                            backgroundColor: isSelected ? (theme?.primary || '#10b981') : (theme?.inputBg || 'rgba(255,255,255,0.05)'),
                            borderColor: isSelected ? (theme?.primary || '#10b981') : (theme?.border || '#334155'),
                          },
                        ]}
                        onPress={() => setSelectedCatId(cat.id)}
                      >
                        <Text style={{ fontSize: 12 }}>{cat.icon || '🛍️'}</Text>
                        <Text
                          style={[
                            styles.catTabPillText,
                            { color: isSelected ? '#ffffff' : (theme?.text || '#ffffff') },
                          ]}
                        >
                          {cat.name || cat.kh}
                        </Text>
                        {countForCat > 0 && (
                          <View style={styles.catCountBadge}>
                            <Text style={styles.catCountText}>{countForCat}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Add Filter Action Bar */}
              <View style={styles.topActionBar}>
                <Text style={[styles.activeCatLabel, { color: theme?.textMuted || '#94a3b8' }]}>
                  {selectedCatId === 'all'
                    ? 'Filters across all categories'
                    : `Filters on: ${categories.find((c) => c.id === selectedCatId)?.name || selectedCatId}`}
                </Text>

                <TouchableOpacity
                  style={[styles.primaryAddBtn, { backgroundColor: theme?.primary || '#10b981' }]}
                  onPress={handleStartAdd}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryAddBtnText}>➕ Add Filter to {selectedCatId === 'all' ? 'Category' : (categories.find((c) => c.id === selectedCatId)?.name || 'Category')}</Text>
                </TouchableOpacity>
              </View>

              {/* Filters List */}
              <ScrollView style={styles.listScroll} contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
                {activeCategoryFilters.length === 0 ? (
                  <View style={[styles.emptyBox, { borderColor: theme?.border || '#334155' }]}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🏷️</Text>
                    <Text style={[styles.emptyTitle, { color: theme?.text || '#ffffff' }]}>
                      No custom filters yet on this category
                    </Text>
                    <Text style={[styles.emptySub, { color: theme?.textMuted || '#94a3b8' }]}>
                      Add filters like "Anime Series", "Marvel", or "Limited Edition" so customers can easily narrow down items.
                    </Text>
                    <TouchableOpacity
                      style={[styles.emptyAddBtn, { backgroundColor: theme?.primary || '#10b981' }]}
                      onPress={handleStartAdd}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.emptyAddBtnText}>➕ Create First Filter</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  activeCategoryFilters.map((flt) => {
                    const assignedCount = Array.isArray(flt.product_ids) ? flt.product_ids.length : 0;
                    const catObj = categories.find((c) => c.id === flt.category_id);

                    return (
                      <View
                        key={flt.id}
                        style={[
                          styles.filterItemCard,
                          {
                            backgroundColor: theme?.inputBg || 'rgba(255,255,255,0.03)',
                            borderColor: theme?.border || '#334155',
                          },
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={[styles.filterItemName, { color: theme?.text || '#ffffff' }]}>
                              🏷️ {flt.name}
                            </Text>
                            {flt.name_km && flt.name_km !== flt.name && (
                              <Text style={[styles.filterItemKm, { color: theme?.textMuted || '#94a3b8' }]}>
                                ({flt.name_km})
                              </Text>
                            )}
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            <View style={styles.catMetaPill}>
                              <Text style={styles.catMetaText}>
                                {catObj ? `${catObj.icon || ''} ${catObj.name}` : (flt.category_id || 'All')}
                              </Text>
                            </View>

                            <View style={[styles.productCountPill, { backgroundColor: assignedCount > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)' }]}>
                              <Text style={[styles.productCountText, { color: assignedCount > 0 ? '#10b981' : '#94a3b8' }]}>
                                📦 {assignedCount} Product{assignedCount === 1 ? '' : 's'} assigned
                              </Text>
                            </View>

                            {flt.match_keywords ? (
                              <View style={styles.keywordPill}>
                                <Text style={styles.keywordPillText} numberOfLines={1}>
                                  🔍 Matches: {flt.match_keywords}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        <View style={styles.filterActions}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.editBtn, { borderColor: theme?.border || '#334155' }]}
                            onPress={() => handleStartEdit(flt)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.editBtnText}>✏️ Edit</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, styles.deleteBtn]}
                            onPress={() => handleDeleteFilter(flt)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.deleteBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          ) : (
            /* Mode 2: EDIT / ADD FILTER FORM */
            <ScrollView style={styles.formScroll} contentContainerStyle={styles.formScrollContent} showsVerticalScrollIndicator={false}>
              {/* Back to List Button */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setMode('list')}
                activeOpacity={0.7}
              >
                <Text style={{ color: theme?.primary || '#10b981', fontSize: 12, fontWeight: '800' }}>
                  ← Back to Filters List
                </Text>
              </TouchableOpacity>

              {/* Target Category Selector */}
              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme?.textMuted || '#94a3b8' }]}>
                  Category ("cag") this filter belongs to:
                </Text>
                <View style={styles.catPickerGrid}>
                  <TouchableOpacity
                    style={[
                      styles.catChoicePill,
                      formTargetCat === 'all' && styles.catChoicePillActive,
                      {
                        backgroundColor: formTargetCat === 'all' ? (theme?.primary || '#10b981') : (theme?.inputBg || '#1e293b'),
                        borderColor: formTargetCat === 'all' ? (theme?.primary || '#10b981') : (theme?.border || '#334155'),
                      },
                    ]}
                    onPress={() => setFormTargetCat('all')}
                  >
                    <Text style={{ color: formTargetCat === 'all' ? '#fff' : (theme?.text || '#fff'), fontSize: 11, fontWeight: '700' }}>
                      🌐 All Categories
                    </Text>
                  </TouchableOpacity>

                  {categories.map((cat) => {
                    const isSelected = formTargetCat === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catChoicePill,
                          isSelected && styles.catChoicePillActive,
                          {
                            backgroundColor: isSelected ? (theme?.primary || '#10b981') : (theme?.inputBg || '#1e293b'),
                            borderColor: isSelected ? (theme?.primary || '#10b981') : (theme?.border || '#334155'),
                          },
                        ]}
                        onPress={() => setFormTargetCat(cat.id)}
                      >
                        <Text style={{ fontSize: 11 }}>{cat.icon || '🛍️'}</Text>
                        <Text style={{ color: isSelected ? '#fff' : (theme?.text || '#fff'), fontSize: 11, fontWeight: '700' }}>
                          {cat.name || cat.kh}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter Name Fields */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme?.textMuted || '#94a3b8' }]}>
                    Filter Name (English) *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme?.inputBg || '#1e293b',
                        borderColor: theme?.border || '#334155',
                        color: theme?.text || '#ffffff',
                      },
                    ]}
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="e.g. Marvel Heroes, Anime, Silver"
                    placeholderTextColor={theme?.textMuted || '#64748b'}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme?.textMuted || '#94a3b8' }]}>
                    Filter Name (Khmer)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme?.inputBg || '#1e293b',
                        borderColor: theme?.border || '#334155',
                        color: theme?.text || '#ffffff',
                      },
                    ]}
                    value={formNameKm}
                    onChangeText={setFormNameKm}
                    placeholder="e.g. វីរបុរស Marvel"
                    placeholderTextColor={theme?.textMuted || '#64748b'}
                  />
                </View>
              </View>

              {/* SECTION: SMART AUTO-MATCH BY NAME & DESCRIPTION */}
              <View style={[styles.smartMatchCard, { borderColor: theme?.border || '#334155' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.smartMatchTitle}>
                    ⚡ Match by Similar Name & Product Description
                  </Text>
                  <Text style={styles.smartMatchTip}>Auto-assigns matching items</Text>
                </View>
                <Text style={[styles.smartMatchDesc, { color: theme?.textMuted || '#94a3b8' }]}>
                  Type keywords (separated by commas). Clicking "Match Now" will scan all product names and descriptions in this category and automatically select matching products below!
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 }}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        backgroundColor: theme?.inputBg || '#0f172a',
                        borderColor: theme?.border || '#334155',
                        color: theme?.text || '#ffffff',
                      },
                    ]}
                    value={formKeywords}
                    onChangeText={setFormKeywords}
                    placeholder="Keywords: marvel, avengers, iron man, anime..."
                    placeholderTextColor={theme?.textMuted || '#64748b'}
                  />

                  <TouchableOpacity
                    style={[styles.smartMatchBtn, { backgroundColor: '#0284c7' }]}
                    onPress={handleSmartMatch}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.smartMatchBtnText}>⚡ Match Now</Text>
                  </TouchableOpacity>
                </View>

                {smartMatchStatus ? (
                  <Text style={styles.smartMatchSuccessText}>{smartMatchStatus}</Text>
                ) : null}
              </View>

              {/* SECTION: MANUAL PRODUCT SELECTION */}
              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View>
                    <Text style={[styles.fieldLabel, { color: theme?.text || '#ffffff' }]}>
                      Select Products for this Filter ({selectedProductIds.size} Selected)
                    </Text>
                    <Text style={{ fontSize: 10, color: theme?.textMuted || '#94a3b8' }}>
                      Click on any product to check/uncheck it for this filter
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity style={styles.miniBtn} onPress={selectAllProducts} activeOpacity={0.7}>
                      <Text style={styles.miniBtnText}>Select All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniBtn} onPress={clearSelectedProducts} activeOpacity={0.7}>
                      <Text style={styles.miniBtnText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Search within product list */}
                <TextInput
                  style={[
                    styles.input,
                    {
                      height: 34,
                      fontSize: 11.5,
                      marginBottom: 8,
                      backgroundColor: theme?.inputBg || '#1e293b',
                      borderColor: theme?.border || '#334155',
                      color: theme?.text || '#ffffff',
                    },
                  ]}
                  value={productSearch}
                  onChangeText={setProductSearch}
                  placeholder="🔍 Quick filter products by name or SKU..."
                  placeholderTextColor={theme?.textMuted || '#64748b'}
                />

                {/* Product Checkbox Selection List */}
                <View style={[styles.productSelectionBox, { borderColor: theme?.border || '#334155' }]}>
                  {filteredTargetProducts.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: theme?.textMuted || '#94a3b8', fontSize: 11.5 }}>
                        {targetCategoryProducts.length === 0
                          ? `No products currently exist in ${formTargetCat}. Add products first or select 'All Categories'.`
                          : 'No products match your search.'}
                      </Text>
                    </View>
                  ) : (
                    filteredTargetProducts.map((p) => {
                      const isChecked = selectedProductIds.has(p.id);
                      const imageSource = resolveProductImage(p);

                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            styles.productSelectRow,
                            isChecked && styles.productSelectRowChecked,
                            {
                              backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                              borderBottomColor: theme?.border || 'rgba(255,255,255,0.06)',
                            },
                          ]}
                          onPress={() => toggleProduct(p.id)}
                          activeOpacity={0.7}
                        >
                          {/* Checkbox Icon */}
                          <View
                            style={[
                              styles.checkboxBox,
                              isChecked && { backgroundColor: theme?.primary || '#10b981', borderColor: theme?.primary || '#10b981' },
                            ]}
                          >
                            <Text style={styles.checkboxCheck}>{isChecked ? '✓' : ''}</Text>
                          </View>

                          {/* Product Thumbnail */}
                          <View style={styles.productThumbWrap}>
                            <Image source={imageSource} style={styles.productThumb} resizeMode="contain" />
                          </View>

                          {/* Info */}
                          <View style={{ flex: 1, paddingLeft: 8 }}>
                            <Text style={[styles.productName, { color: theme?.text || '#ffffff' }]} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                              <Text style={styles.productSku}>{p.id}</Text>
                              <Text style={{ fontSize: 10, color: theme?.gold || '#d4af37', fontWeight: '800' }}>
                                ${Number(p.price || 0).toFixed(2)}
                              </Text>
                              <Text style={{ fontSize: 9.5, color: theme?.textMuted || '#94a3b8' }}>
                                Stock: {p.stock ?? 0}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </View>

              {/* Bottom Actions */}
              <View style={styles.formFooter}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme?.border || '#334155' }]}
                  onPress={() => setMode('list')}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: theme?.text || '#ffffff', fontSize: 12, fontWeight: '700' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme?.primary || '#10b981' }]}
                  onPress={handleSaveFilter}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>
                    {submitting ? 'Saving...' : '💾 Save Filter & Sync Live'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  card: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 3.5,
    borderWidth: 0.8,
    borderColor: '#eab308',
    alignSelf: 'center',
  },
  adminBadgeText: {
    color: '#fbbf24',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    lineHeight: 9.5,
  },
  closeBtn: {
    padding: 6,
  },
  catTabContainer: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  catTabScroll: {
    paddingHorizontal: 12,
    gap: 6,
  },
  catTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    gap: 4,
  },
  catTabPillActive: {
    elevation: 2,
  },
  catTabPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  catCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  catCountText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  topActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  activeCatLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  primaryAddBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  primaryAddBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  listScroll: {
    flex: 1,
  },
  listScrollContent: {
    padding: 12,
    gap: 8,
  },
  filterItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterItemName: {
    fontSize: 13,
    fontWeight: '800',
  },
  filterItemKm: {
    fontSize: 11,
  },
  catMetaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catMetaText: {
    fontSize: 9.5,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  productCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  productCountText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  keywordPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 160,
  },
  keywordPillText: {
    fontSize: 9,
    color: '#38bdf8',
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  editBtnText: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 11,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 16,
    marginBottom: 12,
  },
  emptyAddBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    padding: 12,
    gap: 10,
  },
  backBtn: {
    paddingVertical: 4,
    marginBottom: 2,
  },
  formGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  catPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  catChoicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  catChoicePillActive: {
    elevation: 2,
  },
  input: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  smartMatchCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
  },
  smartMatchTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#38bdf8',
  },
  smartMatchTip: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontWeight: '600',
  },
  smartMatchDesc: {
    fontSize: 10.5,
    lineHeight: 15,
  },
  smartMatchBtn: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartMatchBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  smartMatchSuccessText: {
    marginTop: 6,
    color: '#10b981',
    fontSize: 10.5,
    fontWeight: '700',
  },
  miniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  miniBtnText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },
  productSelectionBox: {
    borderRadius: 10,
    borderWidth: 1,
    maxHeight: 220,
    overflow: 'hidden',
  },
  productSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  productSelectRowChecked: {
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  productThumbWrap: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginLeft: 8,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productThumb: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  productSku: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontWeight: '700',
  },
  formFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
