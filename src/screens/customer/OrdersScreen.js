import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { TelegramIcon } from '../../components/TelegramIcon';
import { TelegramAvatar } from '../../components/TelegramAvatar';
import {
  getOrderItemImageSource,
  getOrderItemCategory,
  parseOrderItems,
  formatReceiptNumber,
  getOrderVoucherInfo,
  openTelegramCustomer,
  cleanTelegramUsername,
} from '../../utils/orderReceiptHelper';
import {
  ModularCharmLink,
  ConnectedBraceletRibbon,
  extractBraceletLinks,
  FullBraceletReceiptBox,
} from '../../components/ModularCharmLink';

export const OrdersScreen = () => {
  const { theme, t, userOrders, refreshOrders, user, products = [], charms = [], settings } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const getStatusBadge = (status) => {
    const s = String(status || 'pending').toLowerCase();
    switch (s) {
      case 'approved':
      case 'confirmed':
        return { label: '✓ Confirmed', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' };
      case 'delivering':
        return { label: '🚚 Delivering', bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4' };
      case 'completed':
        return { label: '🎉 Completed', bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
      case 'rejected':
      case 'cancelled':
        return { label: '✕ Rejected', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' };
      default:
        return { label: '⏳ Pending', bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308' };
    }
  };

  const safeOrders = Array.isArray(userOrders) ? userOrders.filter(Boolean) : [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>
          📦 {t('myOrders')}
        </Text>
        <TouchableOpacity
          style={[styles.refreshPill, { borderColor: theme.border, backgroundColor: theme.card }]}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 11, color: theme.textMuted }}>
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {safeOrders.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ fontSize: 48, marginBottom: 14 }}>🧾</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {t('noOrdersYet')}
          </Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            {user ? 'Any orders placed with your account will appear here.' : 'Orders placed in this session will appear here.'}
          </Text>
        </View>
      ) : (
        safeOrders.map((ord, orderIdx) => {
          const badge = getStatusBadge(ord.status);
          const parsedItems = parseOrderItems(ord.items);
          const receiptId = formatReceiptNumber(ord, ord.receipt_number || ord.id || `ORD-${orderIdx + 1}`);
          const isExpanded = !!expandedOrders[ord.id || receiptId];
          const visibleItems = isExpanded || parsedItems.length <= 3 ? parsedItems : parsedItems.slice(0, 3);
          const rate = Number(settings?.exchange_rate) || 4100;

          const subtotalUSD = parsedItems.reduce((sum, it) => sum + (+it.price || 0) * (+it.qty || 1), 0);
          const deliveryUSD = ord.delivery !== undefined ? Number(ord.delivery) : 1.50;
          const voucherInfo = getOrderVoucherInfo(ord);
          const discountUSD = Number(voucherInfo?.discount !== undefined ? voucherInfo.discount : (ord.discount || 0));
          const totalUSD = Number(ord.total) || Math.max(0, subtotalUSD - discountUSD + deliveryUSD);

          return (
            <View
              key={ord.id || receiptId || orderIdx}
              style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              {/* Top Row: Receipt # & Status */}
              <View style={styles.orderTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                  <View style={[styles.receiptPill, { backgroundColor: theme.gold + '20', borderColor: theme.gold }]}>
                    <Text style={[styles.receiptPillText, { color: theme.gold }]}>
                      #{receiptId}
                    </Text>
                  </View>
                  {voucherInfo && (
                    <View style={[styles.receiptPill, { backgroundColor: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec4899' }]}>
                      <Text style={{ color: '#ec4899', fontSize: 10, fontWeight: '800' }}>
                        🎟️ {voucherInfo.code} (-{voucherInfo.pct}%)
                      </Text>
                    </View>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.orderDate, { color: theme.textMuted }]}>
                  {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Recently placed'}
                </Text>
              </View>

              {/* Table Column Header */}
              <View style={styles.receiptTableHeader}>
                <Text style={[styles.receiptTableHeadText, { color: theme.textMuted }]}>
                  DESCRIPTION
                </Text>
                <Text style={[styles.receiptTableHeadText, { color: theme.textMuted }]}>
                  AMOUNT
                </Text>
              </View>

              {/* Items List with Picture on the Left Side */}
              <View style={styles.itemsListContainer}>
                {visibleItems.map((item, idx) => {
                  const itPrice = +item.price || 0;
                  const itQty = +item.qty || 1;
                  const lineUSD = itPrice * itQty;
                  const lineKHR = Math.round(lineUSD * rate);
                  const imgSource = getOrderItemImageSource(item, products, charms);
                  const catLabel = getOrderItemCategory(item, products);
                  const braceletLinks = extractBraceletLinks(item, charms);
                  const isCharmOrBracelet = item.isCustom ||
                    catLabel === 'CHARM' ||
                    catLabel === 'BRACELET' ||
                    (item.name && item.name.toLowerCase().includes('charm')) ||
                    braceletLinks.length > 0;

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.receiptItemRowCard,
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.receiptItemMainRow}>
                        {/* Left Thumbnail: Modular Italian Charm Link or Standard Product Thumbnail */}
                        {isCharmOrBracelet && !(item.image && typeof item.image === 'string' && item.image.startsWith('data:image/')) && !item.braceletPreviewImage ? (
                          <View style={styles.receiptItemThumbWrap}>
                            <ModularCharmLink
                              charm={braceletLinks[0] || item}
                              size="receipt"
                              showHook={false}
                            />
                          </View>
                        ) : (
                          <Image
                            source={imgSource}
                            style={[
                              styles.receiptItemThumb,
                              isCharmOrBracelet && styles.receiptBraceletThumb,
                              { borderColor: theme.border },
                            ]}
                            resizeMode={isCharmOrBracelet ? "contain" : "cover"}
                          />
                        )}

                        <View style={styles.receiptItemDetails}>
                          <Text style={[styles.receiptItemTitle, { color: theme.text }]} numberOfLines={2}>
                            {item?.name || 'Product'}
                          </Text>
                          <View style={styles.receiptItemMetaRow}>
                            <View style={[styles.catBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                              <Text style={[styles.catBadgeText, { color: theme.textMuted }]}>
                                {catLabel}
                              </Text>
                            </View>
                            <View style={[styles.qtyBadge, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '40' }]}>
                              <Text style={[styles.qtyBadgeText, { color: theme.primary }]}>
                                Qty: {itQty}
                              </Text>
                            </View>
                          </View>

                          {item.charms && !item.styleId ? (
                            <Text style={[styles.receiptCharmsNote, { color: theme.gold }]} numberOfLines={2}>
                              ✨ {item.charms}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.receiptItemPriceCol}>
                          <Text style={[styles.receiptItemPriceKhr, { color: theme.gold }]}>
                            {lineKHR.toLocaleString()} ៛
                          </Text>
                          <Text style={[styles.receiptItemPriceUsd, { color: theme.textMuted }]}>
                            ${lineUSD.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {/* Full Custom Bracelet View Box on Receipt */}
                      {braceletLinks.length > 0 && (
                        <FullBraceletReceiptBox
                          links={braceletLinks}
                          styleId={item.styleId}
                          finish={item.bandFinish}
                          theme={theme}
                        />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Collapsible See More Toggle */}
              {parsedItems.length > 3 && (
                <TouchableOpacity
                  style={[styles.seeMoreBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                  onPress={() => toggleOrderExpand(ord.id || receiptId)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.seeMoreText, { color: theme.primary }]}>
                    {isExpanded ? 'SHOW LESS ∧' : `SEE MORE (${parsedItems.length - 3} MORE) ∨`}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {/* Card Bottom Row */}
              <View style={styles.orderBottomRow}>
                <TouchableOpacity
                  onPress={() => setActiveReceipt(ord)}
                  activeOpacity={0.7}
                  style={styles.viewReceiptLink}
                >
                  <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: '800' }}>
                    🧾 View Official Receipt ↗
                  </Text>
                </TouchableOpacity>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.orderTotalKhr, { color: theme.gold }]}>
                    {Math.round(totalUSD * rate).toLocaleString()} ៛
                  </Text>
                  <Text style={[styles.orderTotal, { color: theme.text }]}>
                    ${totalUSD.toFixed(2)} USD
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      {/* Official Receipt Modal */}
      {activeReceipt && (
        <Modal
          visible={!!activeReceipt}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveReceipt(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.receiptHeader}>
                <Text style={[styles.receiptStudio, { color: theme.primary }]}>
                  SOMPHEA REAK STUDIO
                </Text>
                <Text style={[styles.receiptTitle, { color: theme.text }]}>
                  OFFICIAL RECEIPT
                </Text>
                <Text style={[styles.receiptMeta, { color: theme.gold, fontWeight: '700' }]}>
                  Receipt: #{activeReceipt.receipt_number || activeReceipt.id}
                </Text>
                {(() => {
                  const vInfo = getOrderVoucherInfo(activeReceipt);
                  if (!vInfo) return null;
                  return (
                    <View style={[styles.receiptPill, { backgroundColor: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec4899', marginTop: 4, alignSelf: 'center' }]}>
                      <Text style={{ color: '#ec4899', fontSize: 11, fontWeight: '800' }}>
                        🎟️ Voucher Applied: {vInfo.code} (-{vInfo.pct}%)
                      </Text>
                    </View>
                  );
                })()}
                <Text style={[styles.receiptDateMeta, { color: theme.textMuted }]}>
                  {activeReceipt.created_at ? new Date(activeReceipt.created_at).toLocaleString() : 'Recently placed'}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <ScrollView
                style={styles.receiptScroll}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                <View style={styles.receiptField}>
                  <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>Recipient:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TelegramAvatar size={18} ring={false} />
                    <Text style={[styles.receiptVal, { color: theme.text }]}>
                      {activeReceipt.customer_name || activeReceipt.user_id || 'Customer'}
                    </Text>
                  </View>
                </View>
                {activeReceipt.telegram_username ? (
                  <View style={styles.receiptField}>
                    <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>Telegram:</Text>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                      onPress={() => openTelegramCustomer(activeReceipt.telegram_username)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Open Telegram profile"
                    >
                      <TelegramIcon size={14} variant="circle" />
                      <Text style={[styles.receiptVal, { color: '#229ED9', fontWeight: '700' }]}>
                        @{cleanTelegramUsername(activeReceipt.telegram_username)}
                      </Text>
                      <Text style={{ color: '#229ED9', fontSize: 11, fontWeight: '900' }}>↗</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                <View style={styles.receiptField}>
                  <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>Phone:</Text>
                  <Text style={[styles.receiptVal, { color: theme.primary, fontWeight: '800' }]}>
                    📞 {activeReceipt.phone || 'N/A'}
                  </Text>
                </View>
                <View style={styles.receiptField}>
                  <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>Address:</Text>
                  <Text style={[styles.receiptVal, { color: theme.text }]}>
                    📍 {activeReceipt.address || activeReceipt.province || 'N/A'}
                  </Text>
                </View>
                <View style={styles.receiptField}>
                  <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>Payment:</Text>
                  <Text style={[styles.receiptVal, { color: theme.text }]}>
                    💳 {activeReceipt.payment_method || activeReceipt.payment || 'ABA KHQR'}
                  </Text>
                </View>
                <View style={styles.receiptField}>
                  <Text style={[styles.receiptLabel, { color: theme.textMuted }]}>Status:</Text>
                  <Text style={[styles.receiptVal, { color: theme.primary, fontWeight: '800' }]}>
                    {(activeReceipt.status || 'Pending').toUpperCase()}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {/* Table Header inside Modal */}
                <View style={styles.receiptTableHeader}>
                  <Text style={[styles.receiptTableHeadText, { color: theme.textMuted }]}>
                    DESCRIPTION
                  </Text>
                  <Text style={[styles.receiptTableHeadText, { color: theme.textMuted }]}>
                    AMOUNT
                  </Text>
                </View>

                {/* Items in Modal with Thumbnail on Left */}
                <View style={styles.itemsListContainer}>
                  {(() => {
                    const modalItems = parseOrderItems(activeReceipt.items);
                    const rate = Number(settings?.exchange_rate) || 4100;
                    return modalItems.map((it, idx) => {
                      const itPrice = +it.price || 0;
                      const itQty = +it.qty || 1;
                      const lineUSD = itPrice * itQty;
                      const lineKHR = Math.round(lineUSD * rate);
                      const imgSource = getOrderItemImageSource(it, products, charms);
                      const catLabel = getOrderItemCategory(it, products);
                      const braceletLinks = extractBraceletLinks(it, charms);
                      const isCharmOrBracelet = it.isCustom ||
                        catLabel === 'CHARM' ||
                        catLabel === 'BRACELET' ||
                        (it.name && it.name.toLowerCase().includes('charm')) ||
                        braceletLinks.length > 0;

                      return (
                        <View
                          key={idx}
                          style={[
                            styles.receiptItemRowCard,
                            { backgroundColor: theme.inputBg, borderColor: theme.border },
                          ]}
                        >
                          <View style={styles.receiptItemMainRow}>
                            {/* Left Thumbnail: Modular Italian Charm Link or Standard Product Thumbnail */}
                            {isCharmOrBracelet && !(it.image && typeof it.image === 'string' && it.image.startsWith('data:image/')) && !it.braceletPreviewImage ? (
                              <View style={styles.receiptItemThumbWrap}>
                                <ModularCharmLink
                                  charm={braceletLinks[0] || it}
                                  size="receipt"
                                  showHook={false}
                                />
                              </View>
                            ) : (
                              <Image
                                source={imgSource}
                                style={[
                                  styles.receiptItemThumb,
                                  isCharmOrBracelet && styles.receiptBraceletThumb,
                                  { borderColor: theme.border },
                                ]}
                                resizeMode={isCharmOrBracelet ? "contain" : "cover"}
                              />
                            )}

                            <View style={styles.receiptItemDetails}>
                              <Text style={[styles.receiptItemTitle, { color: theme.text }]} numberOfLines={2}>
                                {it?.name || 'Product'}
                              </Text>
                              <View style={styles.receiptItemMetaRow}>
                                <View style={[styles.catBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                  <Text style={[styles.catBadgeText, { color: theme.textMuted }]}>
                                    {catLabel}
                                  </Text>
                                </View>
                                <View style={[styles.qtyBadge, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '40' }]}>
                                  <Text style={[styles.qtyBadgeText, { color: theme.primary }]}>
                                    Qty: {itQty}
                                  </Text>
                                </View>
                              </View>

                              {it.charms && !it.styleId ? (
                                <Text style={[styles.receiptCharmsNote, { color: theme.gold }]} numberOfLines={2}>
                                  ✨ {it.charms}
                                </Text>
                              ) : null}
                            </View>

                            <View style={styles.receiptItemPriceCol}>
                              <Text style={[styles.receiptItemPriceKhr, { color: theme.gold }]}>
                                {lineKHR.toLocaleString()} ៛
                              </Text>
                              <Text style={[styles.receiptItemPriceUsd, { color: theme.textMuted }]}>
                                ${lineUSD.toFixed(2)}
                              </Text>
                            </View>
                          </View>

                          {/* Full Custom Bracelet View Box on Receipt */}
                          {braceletLinks.length > 0 && (
                            <FullBraceletReceiptBox
                              links={braceletLinks}
                              styleId={it.styleId}
                              finish={it.bandFinish}
                              theme={theme}
                            />
                          )}
                        </View>
                      );
                    });
                  })()}
                </View>

                {/* Summary Box */}
                {(() => {
                  const modalItems = parseOrderItems(activeReceipt.items);
                  const rate = Number(settings?.exchange_rate) || 4100;
                  const subtotalUSD = modalItems.reduce((sum, it) => sum + (+it.price || 0) * (+it.qty || 1), 0);
                  const deliveryUSD = activeReceipt.delivery !== undefined ? Number(activeReceipt.delivery) : 1.50;
                  const voucherInfo = getOrderVoucherInfo(activeReceipt);
                  const discountUSD = Number(voucherInfo?.discount !== undefined ? voucherInfo.discount : (activeReceipt.discount || 0));
                  const totalUSD = Number(activeReceipt.total) || Math.max(0, subtotalUSD - discountUSD + deliveryUSD);

                  return (
                    <View style={[styles.receiptSummaryCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>SUBTOTAL</Text>
                        <Text style={[styles.summaryVal, { color: theme.text }]}>
                          {Math.round(subtotalUSD * rate).toLocaleString()} ៛ (${subtotalUSD.toFixed(2)})
                        </Text>
                      </View>

                      {voucherInfo ? (
                        <>
                          <View style={styles.summaryRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={{ fontSize: 11 }}>🎟️</Text>
                              <Text style={[styles.summaryLabel, { color: '#ec4899', fontWeight: '800' }]}>
                                VOUCHER ({voucherInfo.code})
                              </Text>
                            </View>
                            <Text style={[styles.summaryVal, { color: '#ec4899', fontWeight: '800' }]}>
                              -{voucherInfo.pct}% OFF
                            </Text>
                          </View>

                          <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: theme.error }]}>DISCOUNT SAVINGS</Text>
                            <Text style={[styles.summaryVal, { color: theme.error, fontWeight: '700' }]}>
                              -{Math.round(discountUSD * rate).toLocaleString()} ៛ (-${discountUSD.toFixed(2)})
                            </Text>
                          </View>

                          <View style={[styles.summaryRow, { backgroundColor: 'rgba(16, 185, 129, 0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }]}>
                            <Text style={[styles.summaryLabel, { color: theme.secondary || '#10b981', fontWeight: '800' }]}>
                              PRICE AFTER DISCOUNT
                            </Text>
                            <Text style={[styles.summaryVal, { color: theme.secondary || '#10b981', fontWeight: '900' }]}>
                              {Math.round(Math.max(0, subtotalUSD - discountUSD) * rate).toLocaleString()} ៛ (${Math.max(0, subtotalUSD - discountUSD).toFixed(2)})
                            </Text>
                          </View>
                        </>
                      ) : discountUSD > 0 ? (
                        <View style={styles.summaryRow}>
                          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>DISCOUNT</Text>
                          <Text style={[styles.summaryVal, { color: theme.error }]}>
                            -{Math.round(discountUSD * rate).toLocaleString()} ៛ (-${discountUSD.toFixed(2)})
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>DELIVERY CHARGE</Text>
                        <Text style={[styles.summaryVal, { color: theme.text }]}>
                          {Math.round(deliveryUSD * rate).toLocaleString()} ៛ (${deliveryUSD.toFixed(2)})
                        </Text>
                      </View>

                      <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />

                      <View style={styles.summaryTotalRow}>
                        <View>
                          <Text style={[styles.totalDueLabel, { color: theme.text }]}>TOTAL DUE</Text>
                          <Text style={{ fontSize: 10, color: theme.textMuted }}>$1 = {rate.toLocaleString()} ៛ KHR</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.totalDueKhr, { color: theme.gold }]}>
                            {Math.round(totalUSD * rate).toLocaleString()} ៛
                          </Text>
                          <Text style={[styles.totalDueUsd, { color: theme.primary }]}>
                            ${totalUSD.toFixed(2)} USD
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
              </ScrollView>

              <TouchableOpacity
                style={[styles.closeReceiptBtn, { backgroundColor: theme.primary }]}
                onPress={() => setActiveReceipt(null)}
              >
                <Text style={styles.closeReceiptText}>Close Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  refreshPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 11,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderRef: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  itemsSummary: {
    marginVertical: 4,
  },
  itemLine: {
    fontSize: 12,
    marginVertical: 1,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  receiptHeader: {
    alignItems: 'center',
  },
  receiptStudio: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  receiptMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  receiptScroll: {
    maxHeight: 320,
    ...(Platform.OS === 'web' ? {
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      overflowY: 'auto',
    } : {}),
  },
  receiptField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  receiptLabel: {
    fontSize: 11,
  },
  receiptVal: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  receiptSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  receiptItemName: {
    fontSize: 12,
  },
  receiptItemPrice: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  receiptTotalAmt: {
    fontSize: 20,
    fontWeight: '900',
  },
  receiptPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  receiptPillText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  receiptDateMeta: {
    fontSize: 10.5,
    marginTop: 2,
  },
  receiptTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
    marginTop: 8,
    marginBottom: 6,
  },
  receiptTableHeadText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  itemsListContainer: {
    gap: 8,
    marginVertical: 4,
  },
  receiptItemRowCard: {
    flexDirection: 'column',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  receiptItemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  receiptItemThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
  },
  receiptBraceletThumb: {
    width: 64,
    height: 46,
    backgroundColor: '#ffffff',
  },
  receiptItemThumbWrap: {
    width: 52,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptStyleIdBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  receiptStyleIdText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  receiptItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  receiptItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  receiptItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  qtyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  qtyBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  receiptCharmsNote: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  receiptItemPriceCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 68,
  },
  receiptItemPriceKhr: {
    fontSize: 12,
    fontWeight: '800',
  },
  receiptItemPriceUsd: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
  },
  seeMoreText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewReceiptLink: {
    paddingVertical: 4,
  },
  orderTotalKhr: {
    fontSize: 13,
    fontWeight: '800',
  },
  receiptSummaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
    marginBottom: 6,
    gap: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  summaryVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  totalDueLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  totalDueKhr: {
    fontSize: 14,
    fontWeight: '900',
  },
  totalDueUsd: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  closeReceiptBtn: {
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  closeReceiptText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
