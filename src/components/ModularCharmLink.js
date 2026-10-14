import React from 'react';
import { View, Image, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { resolveCharmImage } from '../utils/charmImageHelper';
import { INITIAL_CHARMS } from '../constants/initialData';
import {
  formatShortCharmCode,
  generateBraceletStyleId,
  parseBraceletStyleId,
  charmToToken,
  tokenToCharm,
} from '../utils/braceletIdHelper';

// Re-export compact style ID functions for convenience
export {
  formatShortCharmCode,
  generateBraceletStyleId,
  parseBraceletStyleId,
  charmToToken,
  tokenToCharm,
};

/**
 * Helper to extract or reconstruct bracelet link objects from any order item
 */
export function extractBraceletLinks(item, allCharms = []) {
  if (!item) return [];

  // 1. Direct braceletLinks array on item
  if (Array.isArray(item.braceletLinks) && item.braceletLinks.length > 0) {
    return item.braceletLinks;
  }

  const pool = (Array.isArray(allCharms) && allCharms.length > 0) ? allCharms : (INITIAL_CHARMS || []);

  // 2. Parse from item.styleId (supports new compact XXXX-XXXX-XXXX-XXXX, G-XXXX-..., and legacy ITB-...)
  if (item.styleId && typeof item.styleId === 'string' && item.styleId.trim()) {
    const parsed = parseBraceletStyleId(item.styleId, pool);
    if (parsed.links && parsed.links.length > 0) {
      return parsed.links;
    }
  }

  // 3. Parse from item.charms string or item.charmsSummary
  if (item.charms && typeof item.charms === 'string') {
    const styleMatch = item.charms.match(/Style:\s*([A-Za-z0-9-]+)/i);
    if (styleMatch) {
      const parsed = parseBraceletStyleId(styleMatch[1], pool);
      if (parsed.links && parsed.links.length > 0) {
        return parsed.links;
      }
    }
    const parsed = parseBraceletStyleId(item.charms, pool);
    if (parsed.links && parsed.links.length > 0) {
      return parsed.links;
    }
  }

  if (item.charmsSummary && typeof item.charmsSummary === 'string') {
    const styleMatch = item.charmsSummary.match(/Style:\s*([A-Za-z0-9-]+)/i);
    if (styleMatch) {
      const parsed = parseBraceletStyleId(styleMatch[1], pool);
      if (parsed.links && parsed.links.length > 0) {
        return parsed.links;
      }
    }
  }

  // 4. Default mock links if it's an Italian bracelet order without explicit items list
  if (item.isCustom || (item.name && item.name.toLowerCase().includes('italy charm bracelet'))) {
    return (INITIAL_CHARMS || []).slice(0, 15).map((c, idx) => ({
      uid: `link_${idx}`,
      id: formatShortCharmCode(c.id),
      name: c.name,
      image: c.image || 'charm_clean.png',
      engraved: null,
    }));
  }

  return [];
}

/**
 * Compatibility stub for legacy getCharmArtwork callers
 */
export function getCharmArtwork(charm) {
  return null;
}

/**
 * Dimensions based on authentic Italian charm aspect ratio (184 x 158 ≈ 1.1645)
 */
function getLinkDimensions(size) {
  switch (size) {
    case 'workbench':
      return { width: 58, height: 50, engravedFontSize: 16 };
    case 'catalog':
      return { width: 50, height: 43, engravedFontSize: 13 };
    case 'receipt':
      return { width: 44, height: 38, engravedFontSize: 12 };
    case 'strip':
      return { width: 32, height: 28, engravedFontSize: 9 };
    case 'preview':
    case 'large':
      return { width: 82, height: 70, engravedFontSize: 22 };
    default:
      return { width: 58, height: 50, engravedFontSize: 16 };
  }
}

/**
 * Clean Italian Modular Charm Link Component
 * Directly renders the authentic charm PNG image with NO artificial CSS frames or borders,
 * allowing consecutive charm PNGs to connect to each other seamlessly.
 */
export const ModularCharmLink = ({
  charm,
  size = 'workbench',
  isSelected = false,
  isHovered = false,
  style,
}) => {
  const dims = getLinkDimensions(size);
  const imgSource = resolveCharmImage(charm?.image || charm);
  const isCustomUri = Boolean(imgSource && typeof imgSource === 'object' && imgSource.uri);

  return (
    <View
      style={[
        styles.root,
        { width: dims.width, height: dims.height },
        isSelected && styles.selectedLink,
        isHovered && styles.hoveredLink,
        style,
      ]}
    >
      {/* Image fills the box exactly; 'contain' guarantees the WHOLE charm is visible (never cropped) */}
      <Image
        source={imgSource}
        style={[
          styles.charmImage,
          { width: dims.width, height: dims.height },
          Platform.OS === 'web' && { objectFit: 'contain' },
        ]}
        resizeMode="contain"
      />

      {/* Optional engraved text overlay on blank link */}
      {charm?.engraved ? (
        <View style={styles.engravedOverlay} pointerEvents="none">
          <Text style={[styles.engravedText, { fontSize: dims.engravedFontSize }]}>
            {String(charm.engraved).toUpperCase()}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

/**
 * ConnectedBraceletRibbon
 * Displays an authentic continuous horizontal ribbon of interlocking Italian modular charms
 * connected directly edge-to-edge for receipts and order cards.
 */
export const ConnectedBraceletRibbon = ({
  links = [],
  size = 'strip',
  style,
  cardStyle,
}) => {
  if (!Array.isArray(links) || links.length === 0) return null;

  return (
    <View style={[styles.ribbonContainer, cardStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ribbonChainTrack}
      >
        {links.map((link, idx) => (
          <ModularCharmLink
            key={link?.uid || link?.id || idx}
            charm={link}
            size={size}
            style={[
              style,
              idx > 0 && { marginLeft: -2 }, // Directly connects PNG to previous charm PNG!
            ]}
          />
        ))}
      </ScrollView>
    </View>
  );
};

/**
 * FullBraceletReceiptBox
 * A prominent, dedicated full bracelet view box designed specifically
 * for Customer Receipts, Admin Receipts, and Order Summaries.
 * Displays all interlocking charms edge-to-edge in their exact sequence,
 * with connection badge, finish details, and official style ID.
 */
export const FullBraceletReceiptBox = ({
  links = [],
  styleId = '',
  finish = '',
  theme = null,
  containerStyle,
}) => {
  if (!Array.isArray(links) || links.length === 0) return null;
  const count = links.length;

  // Format clean, organized, compact style ID (convert legacy ITB-..., oversized strings, or empty)
  let displayStyleId = styleId;
  if (!displayStyleId || displayStyleId.startsWith('ITB-') || displayStyleId.length > 25) {
    displayStyleId = generateBraceletStyleId(links, finish);
  }

  return (
    <View
      style={[
        styles.receiptBoxContainer,
        {
          backgroundColor: theme?.card || '#111827',
          borderColor: theme?.border || '#374151',
        },
        containerStyle,
      ]}
    >
      {/* Top Header Label */}
      <View style={styles.receiptBoxHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 13 }}>🔗</Text>
          <Text style={[styles.receiptBoxTitle, { color: theme?.text || '#ffffff' }]}>
            Full Italian Bracelet View
          </Text>
          <View style={[styles.receiptBoxBadge, { backgroundColor: 'rgba(212, 175, 55, 0.18)', borderColor: 'rgba(212, 175, 55, 0.5)' }]}>
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: theme?.gold || '#f59e0b' }}>
              {count} LINKS CONNECTED
            </Text>
          </View>
        </View>

        {finish ? (
          <View style={[styles.finishPill, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: theme?.border || 'rgba(255, 255, 255, 0.15)' }]}>
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: theme?.textMuted || '#94a3b8' }}>
              {String(finish).toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Connected Interlocking Charms Chain Track (Horizontal Scroll) */}
      <View style={[styles.receiptBoxChainOuter, { backgroundColor: theme?.inputBg || '#0f172a', borderColor: theme?.border || '#1f2937' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.receiptBoxChainTrack}
        >
          {links.map((charm, idx) => (
            <ModularCharmLink
              key={charm?.uid || charm?.id || idx}
              charm={charm}
              size="receipt"
              style={[idx > 0 && { marginLeft: -2 }]}
            />
          ))}
        </ScrollView>
      </View>

      {/* Footer Info: Style ID & Sequence notice */}
      <View style={styles.receiptBoxFooter}>
        <Text style={[styles.receiptBoxFootnote, { color: theme?.textMuted || '#94a3b8' }]}>
          ✨ Exact customer-assembled sequence ({count} modular links)
        </Text>
        {displayStyleId ? (
          <View style={[styles.receiptBoxStylePill, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }]}>
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: theme?.secondary || '#10b981' }} numberOfLines={1}>
              🆔 {displayStyleId}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  charmImage: {
    backgroundColor: 'transparent',
  },
  customPhotoRadius: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  selectedLink: {
    transform: [{ scale: 1.08 }],
    zIndex: 10,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 6,
  },
  hoveredLink: {
    transform: [{ scale: 1.06 }],
    zIndex: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 6,
  },
  engravedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engravedText: {
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  ribbonContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
    marginTop: 4,
    marginBottom: 4,
    alignSelf: 'stretch',
  },
  ribbonChainTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  receiptBoxContainer: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  receiptBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  receiptBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  receiptBoxBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  finishPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  receiptBoxChainOuter: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  receiptBoxChainTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  receiptBoxFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  receiptBoxFootnote: {
    fontSize: 10,
    fontWeight: '600',
  },
  receiptBoxStylePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
});
