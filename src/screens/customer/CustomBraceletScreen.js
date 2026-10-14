import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { resolveCharmImage } from '../../utils/charmImageHelper';
import { INITIAL_CHARMS } from '../../constants/initialData';
import { ModularCharmLink } from '../../components/ModularCharmLink';
import {
  formatShortCharmCode,
  generateBraceletStyleId,
  parseBraceletStyleId,
  charmToToken,
} from '../../utils/braceletIdHelper';
import { generateBraceletSnapshot } from '../../utils/braceletSnapshotHelper';

// Authentic Italian modular charm bracelet constraints
// User requirement: minimum 15 charms up, no maximum limit!
const MIN_CHARMS = 15;

// Available luxury metallic band finishes
const BAND_FINISHES = [
  { id: 'silver', nameKey: 'finishSilver', label: 'Silver Inox 316L', color: '#94a3b8', border: '#cbd5e1', bg: '#1e293b' },
  { id: 'gold', nameKey: 'finishGold', label: '18K Royal Gold', color: '#d4af37', border: '#f59e0b', bg: '#451a03' },
  { id: 'rose', nameKey: 'finishRose', label: 'Rose Gold', color: '#f43f5e', border: '#fb7185', bg: '#4c0519' },
  { id: 'black', nameKey: 'finishBlack', label: 'Obsidian Black', color: '#64748b', border: '#334155', bg: '#020617' },
];

export const CustomBraceletScreen = ({ onNavigate, initialStyleId }) => {
  const { theme, themeMode, t, lang, settings, charms: serverCharms, addToCart, showToast } = useApp();
  const isDark = themeMode === 'dark';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // User starts with an EMPTY bracelet (starts with nothing as requested)
  const [braceletLinks, setBraceletLinks] = useState([]);
  const [targetSize, setTargetSize] = useState(15); // Default minimum 15 links (No maximum limit)
  const [bandFinish, setBandFinish] = useState('silver');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

  // Packaging box option: 'basic' (free) or 'premium' (extra $0.50)
  const [boxOption, setBoxOption] = useState('basic');
  const BOX_PREMIUM_PRICE = 0.5;

  // View mode for Available Charms Catalog: Default to 'grid' (5 by 5 grid arrangement)
  const [charmsViewMode, setCharmsViewMode] = useState('grid');
  // Track currently picked charm to show its charm code in the search place
  const [pickedCharm, setPickedCharm] = useState(null);

  // Horizontal Scroll Refs & Offsets
  const chainScrollRef = useRef(null);
  const chainScrollOffset = useRef(0);
  const catalogScrollRef = useRef(null);
  const catalogScrollOffset = useRef(0);

  // Style ID Search and Loader Input State
  const [styleSearchInput, setStyleSearchInput] = useState('');

  // Universal Drag & Drop state
  const [draggedWorkbenchIndex, setDraggedWorkbenchIndex] = useState(null);
  const [draggedCatalogCharm, setDraggedCatalogCharm] = useState(null);
  const [hoverSlotIndex, setHoverSlotIndex] = useState(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [dragGhostItem, setDragGhostItem] = useState(null);
  const [dragPointerPos, setDragPointerPos] = useState({ x: 0, y: 0 });

  const dragSessionRef = useRef({
    active: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    sourceIndex: null,
    catalogCharm: null,
  });
  const hoverSlotIndexRef = useRef(null);
  hoverSlotIndexRef.current = hoverSlotIndex;
  const isOverTrashRef = useRef(false);
  isOverTrashRef.current = isOverTrash;

  // Filter states
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const rate = Number(settings?.exchange_rate) || 4100;
  const customPoints = settings.custom_pt || 5;

  // Active finish palette
  const activeFinishObj = BAND_FINISHES.find((f) => f.id === bandFinish) || BAND_FINISHES[0];

  // IDs of legacy or seeded default charms to remove completely
  const FAKE_DEFAULT_CHARM_IDS = useMemo(() => new Set([
    'ch_plain', 'ch_plain_001', 'ch_heart', 'ch_star', 'ch_flower', 'ch_butterfly',
    'ch_cat', 'ch_clover', 'ch_moon', 'ch_sun', 'ch_diamond', 'ch_bow', 'ch_dog',
    'rainbow', 'ch_music', 'ch_khmer', 'ch_crown', 'ch_bolt'
  ]), []);

  // Available charms catalog from database (with fallback to INITIAL_CHARMS containing all 25 charms)
  const availableCharms = useMemo(() => {
    const list = [];
    const sourceList = Array.isArray(serverCharms) && serverCharms.length > 0
      ? serverCharms
      : (INITIAL_CHARMS || []);

    sourceList.forEach((ch) => {
      if (!ch) return;
      if (FAKE_DEFAULT_CHARM_IDS.has(ch.id)) return;
      if (ch.isPlain || (ch.name && ch.name.toLowerCase().includes('plain stainless'))) return;
      list.push({
        id: ch.id,
        name: ch.name,
        category: ch.category || 'Custom',
        price: ch.price !== undefined ? +ch.price : 0,
        isPlain: false,
        image: ch.image || 'charm_clean.png',
        model_no: ch.model_no || ch.id,
      });
    });

    return list;
  }, [serverCharms, FAKE_DEFAULT_CHARM_IDS]);

  // Unique categories for filtering
  const charmCategories = useMemo(() => {
    const cats = new Set(['all']);
    availableCharms.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats);
  }, [availableCharms]);

  // Filtered charms based on search (Matches short code e.g. C01, charm ID, model_no, and name) and category tab
  const filteredCharms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return availableCharms.filter((ch) => {
      const matchCat = activeCategory === 'all' || ch.category === activeCategory;
      const shortCode = formatShortCharmCode(ch.id).toLowerCase();
      const matchSearch =
        !q ||
        ch.name.toLowerCase().includes(q) ||
        (ch.id && ch.id.toLowerCase().includes(q)) ||
        shortCode.includes(q) ||
        (ch.model_no && ch.model_no.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [availableCharms, activeCategory, searchQuery]);

  // Deterministic live Bracelet Style ID
  const currentStyleId = useMemo(() => {
    return generateBraceletStyleId(braceletLinks, bandFinish, availableCharms);
  }, [braceletLinks, bandFinish, availableCharms]);

  // Auto-load style ID if passed from search or navigation
  const initialLoadedRef = useRef(null);
  useEffect(() => {
    if (initialStyleId && initialLoadedRef.current !== initialStyleId && availableCharms && availableCharms.length > 0) {
      initialLoadedRef.current = initialStyleId;
      handleLoadStyleId(initialStyleId);
    }
  }, [initialStyleId, availableCharms]);

  // One-click copy of current Bracelet Style ID
  const handleCopyStyleId = async () => {
    if (!currentStyleId) {
      showToast('⚠️ Bracelet is empty. Add charms to generate a Style ID first.');
      return;
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentStyleId);
      }
    } catch (e) {
      // clipboard fallback
    }
    showToast(`📋 Copied Style ID: ${currentStyleId}\nShare or paste this ID anytime to get this exact bracelet!`);
  };

  // Search & Load Exact Bracelet Style by ID
  const handleLoadStyleId = (rawInput) => {
    const input = (rawInput || styleSearchInput || '').trim();
    if (!input) {
      showToast('⚠️ Please enter or paste a Bracelet Style ID');
      return;
    }

    const { finish: parsedFinish, links: reconstructedLinks } = parseBraceletStyleId(input, availableCharms);

    if (!reconstructedLinks || reconstructedLinks.length === 0) {
      showToast('⚠️ Could not reconstruct any charms from this Style ID');
      return;
    }

    setBandFinish(parsedFinish || bandFinish);
    setBraceletLinks(reconstructedLinks);
    setSelectedSlotIndex(null);
    setStyleSearchInput('');
    showToast(`⚡ Loaded exact style! Reconstructed ${reconstructedLinks.length} Italian charms in ${(parsedFinish || bandFinish).toUpperCase()} band.`);
  };

  // Move charm link left (nudge)
  const handleNudgeLeft = (idx) => {
    if (idx <= 0) return;
    setBraceletLinks((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      return next;
    });
    setSelectedSlotIndex(idx - 1);
  };

  // Move charm link right (nudge)
  const handleNudgeRight = (idx) => {
    if (idx >= braceletLinks.length - 1) return;
    setBraceletLinks((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      return next;
    });
    setSelectedSlotIndex(idx + 1);
  };

  // Scroll Workbench Chain Left/Right smoothly
  const scrollChain = (direction) => {
    const scrollDelta = 260; // scrolls ~2.5 - 3 charms
    const newOffset = direction === 'left'
      ? Math.max(0, chainScrollOffset.current - scrollDelta)
      : chainScrollOffset.current + scrollDelta;
    chainScrollOffset.current = newOffset;
    if (chainScrollRef.current) {
      if (chainScrollRef.current.scrollTo) {
        chainScrollRef.current.scrollTo({ x: newOffset, animated: true });
      } else if (chainScrollRef.current.scrollToOffset) {
        chainScrollRef.current.scrollToOffset({ offset: newOffset, animated: true });
      }
    }
  };

  // Scroll Available Charms Catalog Left/Right smoothly
  const scrollCatalog = (direction) => {
    const scrollDelta = 320;
    const newOffset = direction === 'left'
      ? Math.max(0, catalogScrollOffset.current - scrollDelta)
      : catalogScrollOffset.current + scrollDelta;
    catalogScrollOffset.current = newOffset;
    if (catalogScrollRef.current) {
      if (catalogScrollRef.current.scrollTo) {
        catalogScrollRef.current.scrollTo({ x: newOffset, animated: true });
      } else if (catalogScrollRef.current.scrollToOffset) {
        catalogScrollRef.current.scrollToOffset({ offset: newOffset, animated: true });
      }
    }
  };

  // Add charm to the next available position or selected slot (UNLIMITED MAX CHARMS!)
  const addCharmToBracelet = (charm, targetIndex = null) => {
    setPickedCharm(charm);
    setBraceletLinks((prev) => {
      const next = [...prev];
      const newLink = {
        uid: `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        id: charm.id,
        name: charm.name,
        isPlain: !!charm.isPlain,
        price: charm.isPlain ? 0.0 : (+charm.price || 0),
        image: charm.image || 'charm_clean.png',
        engraved: charm.engraved || null,
      };

      if (targetIndex !== null && targetIndex < next.length) {
        // Direct Replace existing slot
        next[targetIndex] = newLink;
      } else {
        // Append to chain
        next.push(newLink);
      }
      return next;
    });

    showToast(`✨ Added [${charm.id}] ${charm.name}`);
  };

  // Remove charm link at index
  const removeCharmAtIndex = (index) => {
    setBraceletLinks((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setSelectedSlotIndex(null);
    showToast('🗑️ Removed charm from bracelet');
  };

  // Clear entire bracelet back to 0
  const handleClearAll = () => {
    setBraceletLinks([]);
    setSelectedSlotIndex(null);
    showToast('✓ Cleared bracelet');
  };


  // -------------------------------------------------------------
  // Universal Pointer Drag & Drop System (Mouse & Touch Supported)
  // -------------------------------------------------------------
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onPointerMove = (e) => {
      const session = dragSessionRef.current;
      if (!session || !session.active) return;

      const clientX = e.clientX !== undefined
        ? e.clientX
        : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY !== undefined
        ? e.clientY
        : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

      const dx = clientX - session.startX;
      const dy = clientY - session.startY;

      if (!session.hasMoved && Math.hypot(dx, dy) > 16) {
        session.hasMoved = true;
        setIsDraggingActive(true);
        if (session.sourceIndex !== null) {
          setDraggedWorkbenchIndex(session.sourceIndex);
        } else if (session.catalogCharm) {
          setDraggedCatalogCharm(session.catalogCharm);
        }
      }

      if (session.hasMoved) {
        if (e.cancelable && e.type === 'touchmove') {
          e.preventDefault();
        }
        setDragPointerPos({ x: clientX, y: clientY });

        // Hit testing element under pointer (ghost element has pointerEvents: 'none')
        const elem = document.elementFromPoint(clientX, clientY);
        if (elem) {
          const slotElem = elem.closest ? elem.closest('[data-slot-index]') : null;
          if (slotElem) {
            const slotIdx = parseInt(slotElem.getAttribute('data-slot-index'), 10);
            if (!isNaN(slotIdx)) {
              setHoverSlotIndex(slotIdx);
              setIsOverTrash(false);
              return;
            }
          }
          const trashElem = elem.closest ? elem.closest('[data-trash-zone]') : null;
          if (trashElem) {
            setIsOverTrash(true);
            setHoverSlotIndex(null);
            return;
          }
        }
        setHoverSlotIndex(null);
        setIsOverTrash(false);
      }
    };

    const onPointerUp = (e) => {
      const session = dragSessionRef.current;
      if (!session || !session.active) return;

      const hadMoved = session.hasMoved;
      const sourceIdx = session.sourceIndex;
      const catCharm = session.catalogCharm;
      const targetSlot = hoverSlotIndexRef.current;
      const isTrash = isOverTrashRef.current;

      if (hadMoved) {
        if (isTrash && sourceIdx !== null) {
          removeCharmAtIndex(sourceIdx);
        } else if (targetSlot !== null && targetSlot !== undefined) {
          if (sourceIdx !== null) {
            if (sourceIdx !== targetSlot) {
              setBraceletLinks((prev) => {
                const next = [...prev];
                const temp = next[sourceIdx];
                next[sourceIdx] = next[targetSlot];
                next[targetSlot] = temp;
                return next;
              });
              showToast(`⇄ Swapped link #${sourceIdx + 1} with #${targetSlot + 1}`);
            }
          } else if (catCharm) {
            addCharmToBracelet(catCharm, targetSlot);
          }
        } else if (catCharm) {
          // If dropped over the general workbench container
          const clientX = e.clientX !== undefined
            ? e.clientX
            : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0);
          const clientY = e.clientY !== undefined
            ? e.clientY
            : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0);
          const el = document.elementFromPoint(clientX, clientY);
          if (el && el.closest && el.closest('[data-workbench-zone]')) {
            addCharmToBracelet(catCharm);
          }
        }
      } else {
        // Simple tap without dragging
        if (sourceIdx !== null) {
          handleSlotPress(sourceIdx);
        }
      }

      // Reset drag session
      dragSessionRef.current = {
        active: false,
        hasMoved: false,
        startX: 0,
        startY: 0,
        sourceIndex: null,
        catalogCharm: null,
      };
      setIsDraggingActive(false);
      setDraggedWorkbenchIndex(null);
      setDraggedCatalogCharm(null);
      setHoverSlotIndex(null);
      setIsOverTrash(false);
      setDragGhostItem(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, []);

  const handleSlotPointerDown = (index, e) => {
    if (e?.target && e.target.closest && e.target.closest('[data-remove-btn]')) {
      return;
    }
    const clientX = e?.clientX !== undefined
      ? e.clientX
      : (e?.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e?.clientY !== undefined
      ? e.clientY
      : (e?.touches && e.touches[0] ? e.touches[0].clientY : 0);

    dragSessionRef.current = {
      active: true,
      hasMoved: false,
      startX: clientX,
      startY: clientY,
      sourceIndex: index,
      catalogCharm: null,
    };
    setDragGhostItem(braceletLinks[index]);
    setDragPointerPos({ x: clientX, y: clientY });
  };

  const handleCatalogPointerDown = (charm, e) => {
    const clientX = e?.clientX !== undefined
      ? e.clientX
      : (e?.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e?.clientY !== undefined
      ? e.clientY
      : (e?.touches && e.touches[0] ? e.touches[0].clientY : 0);

    dragSessionRef.current = {
      active: true,
      hasMoved: false,
      startX: clientX,
      startY: clientY,
      sourceIndex: null,
      catalogCharm: charm,
    };
    setDragGhostItem(charm);
    setDragPointerPos({ x: clientX, y: clientY });
  };

  // Instant Tap-to-Swap: Tap Slot A, Tap Slot B -> Swapped!
  const handleSlotPress = (index) => {
    if (braceletLinks[index]) {
      setPickedCharm(braceletLinks[index]);
    }
    if (selectedSlotIndex === null) {
      setSelectedSlotIndex(index);
      showToast(`Selected #${index + 1} • Tap another link to swap places`);
    } else if (selectedSlotIndex === index) {
      setSelectedSlotIndex(null);
    } else {
      setBraceletLinks((prev) => {
        const next = [...prev];
        const temp = next[selectedSlotIndex];
        next[selectedSlotIndex] = next[index];
        next[index] = temp;
        return next;
      });
      showToast(`⇄ Swapped link #${selectedSlotIndex + 1} and #${index + 1}`);
      setSelectedSlotIndex(null);
    }
  };

  // Pricing calculations
  const customCharmsCount = braceletLinks.filter((c) => !c.isPlain).length;
  const charmsTotalPrice = braceletLinks.reduce((sum, link) => sum + (link.isPlain ? 0 : (+link.price || 0)), 0);
  const boxPrice = boxOption === 'premium' ? BOX_PREMIUM_PRICE : 0.0;
  const totalPrice = charmsTotalPrice + boxPrice;
  const count = braceletLinks.length;
  const isValidLength = count >= MIN_CHARMS;
  const progressPct = Math.min(100, Math.round((count / MIN_CHARMS) * 100));

  const handleAddToCart = async () => {
    if (!isValidLength) {
      Alert.alert(
        'Minimum 15 Charms Required',
        `An authentic Italian charm bracelet requires at least 15 charms to complete the loop (Current: ${count} charms). Please add ${MIN_CHARMS - count} more charm${MIN_CHARMS - count === 1 ? '' : 's'}.`
      );
      return;
    }

    // Generate exact full bracelet picture from customer's design
    let braceletSnapshot = null;
    try {
      braceletSnapshot = await generateBraceletSnapshot(braceletLinks, bandFinish);
    } catch (e) {
      console.warn('Failed to snapshot bracelet:', e);
    }

    const boxLabel = boxOption === 'premium' ? '🎁 Premium Box (+$0.50)' : '📦 Basic Box ($0.00)';

    const customItem = {
      id: `custom-bracelet-${Date.now()}`,
      name: `Italy Charm Bracelet (${count} Links · ${activeFinishObj.label}${boxOption === 'premium' ? ' · Premium Box' : ''})`,
      price: totalPrice,
      qty: 1,
      isCustom: true,
      points: customPoints,
      charmsSummary: `${count} links (${customCharmsCount} custom charms) [${bandFinish.toUpperCase()}] · ${boxLabel} · Style: ${currentStyleId}`,
      braceletLinks,
      image: braceletSnapshot || 'charm_clean.png',
      braceletPreviewImage: braceletSnapshot || '',
      bandFinish,
      styleId: currentStyleId,
      boxOption,
      boxPrice,
    };

    addToCart(customItem, 1);
    if (showToast) {
      showToast(`✓ Added Italy Bracelet (${count} links) to Cart`);
    }
    if (onNavigate) {
      onNavigate('cart');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.bg }]}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
      {/* ============================================================== */}
      {/* 0. BRACELET STYLE ID SEARCH & LOADER                           */}
      {/* ============================================================== */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.styleEngineHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                Search & Load Bracelet by Style ID
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
              Enter or paste a Style ID (e.g. B-1234-5678-9ABC-DEFG or BG-8x0-1234...) to instantly recreate that exact bracelet.
            </Text>
          </View>
        </View>

        <View style={styles.styleSearchRow}>
          <TextInput
            style={[styles.styleSearchInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            placeholder="Paste Style ID (e.g. B-1234-5678-9ABC-DEFG or BG-8x0-1234...)"
            placeholderTextColor={theme.textMuted}
            value={styleSearchInput}
            onChangeText={setStyleSearchInput}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={() => handleLoadStyleId()}
          />
          <TouchableOpacity
            style={[styles.styleLoadBtn, { backgroundColor: theme.primary }]}
            onPress={() => handleLoadStyleId()}
            activeOpacity={0.8}
          >
            <Text style={styles.styleLoadBtnText}>⚡ Load Style</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ============================================================== */}
      {/* 2. CENTERED BRACELET DISPLAY & WORKBENCH STAGE                 */}
      {/* ============================================================== */}
      <View style={[styles.stageCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.stageHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ fontSize: 16 }}>🇮🇹</Text>
              <Text style={[styles.title, { color: theme.gold, fontSize: 16 }]}>
                {t('customTitle')}
              </Text>
              <View style={[styles.sizeBadge, { backgroundColor: activeFinishObj.bg, borderColor: activeFinishObj.border, marginLeft: 'auto' }]}>
                <Text style={[styles.sizeBadgeText, { color: activeFinishObj.color }]}>
                  {count >= MIN_CHARMS ? `${count} Links Connected ✓` : `Min 15 Charms (${count}/${MIN_CHARMS})`}
                </Text>
              </View>
            </View>
            <Text style={[styles.stageTitle, { color: theme.text, fontSize: 13 }]}>
              {t('braceletPreview', { count })} ({count >= MIN_CHARMS ? 'Ready to Order ✓' : `${count}/${MIN_CHARMS} Min`})
            </Text>
            <Text style={{ fontSize: 12, color: draggedWorkbenchIndex !== null ? theme.primary : selectedSlotIndex !== null ? theme.gold : theme.textMuted, fontWeight: '600', marginTop: 3 }}>
              {draggedWorkbenchIndex !== null
                ? `✨ Dragging charm #${draggedWorkbenchIndex + 1} — drop on any other link to swap places!`
                : selectedSlotIndex !== null
                ? `✨ Charm #${selectedSlotIndex + 1} selected — use ◀ / ▶ arrows or tap another link to swap places!`
                : `✨ Links interlock seamlessly • Drag or nudge with ◀ ▶ to reorder along the band`}
            </Text>
          </View>

          {/* Quick Header Actions */}
          <View style={styles.stageHeaderActions}>
            {count > 0 && (
              <TouchableOpacity onPress={handleClearAll} style={styles.clearBtnPill}>
                <Text style={{ color: theme.error, fontSize: 11, fontWeight: '700' }}>
                  🗑️ {t('clearBtn')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Unique Generated Bracelet Style ID Bar (When bracelet has charms) */}
        {count > 0 && (
          <View style={[styles.currentStyleIdBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: theme.gold }}>
                  🆔 OFFICIAL BRACELET STYLE ID:
                </Text>
                <View style={[styles.styleIdPill, { backgroundColor: theme.gold + '20' }]}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: theme.gold }}>
                    {count} LINKS · {activeFinishObj.label.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.currentStyleIdCode, { color: theme.text }]}
                numberOfLines={1}
                selectable
              >
                {currentStyleId}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.copyStyleBtn, { backgroundColor: theme.secondary || '#10b981' }]}
              onPress={handleCopyStyleId}
              activeOpacity={0.8}
            >
              <Text style={[styles.copyStyleBtnText, { color: '#ffffff' }]}>📋 Copy Style ID</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Bar (0 to 15 Minimum Links) */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarTrack, { backgroundColor: theme.inputBg }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: isValidLength ? theme.primary : theme.gold,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressStatusText, { color: isValidLength ? theme.primary : theme.gold }]}>
            {isValidLength
              ? `✓ Minimum met! (${count} links connected · No limit on max charms)`
              : `Placed ${count}/${MIN_CHARMS} charms (Add ${MIN_CHARMS - count} more to reach minimum of 15)`}
          </Text>
        </View>

        {/* ------------------------------------------------------------ */}
        {/* CENTERED WORKBENCH: Interlocking Italian Charm Bracelet Band  */}
        {/* ------------------------------------------------------------ */}
        <View style={styles.centerStageOuter} dataSet={{ workbenchZone: 'true' }}>
          {count === 0 ? (
            /* EMPTY BRACELET DISPLAY (User Starts with Nothing - Clean Luxury Prompt without + Boxes) */
            <View style={styles.emptyStageBox}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🔗</Text>
              <Text style={[styles.emptyHintTitle, { color: theme.text }]}>
                {t('emptyBracelet')}
              </Text>
              <Text style={[styles.emptyHintSub, { color: theme.textMuted }]}>
                {lang === 'km'
                  ? 'ជ្រើសរើស Charms ពីបញ្ជីខាងក្រោម ឬអូសដាក់ក្នុងខ្សែដៃ។ ចាប់ពី ១៥ ប្រឡោះឡើងទៅ (គ្មានកំណត់ចំនួនអតិបរមាឡើយ)!'
                  : 'Select charms from the catalog below or drag them into the bracelet track. Minimum 15 charms up with NO maximum limit!'}
              </Text>
            </View>
          ) : (
            /* ACTIVE BRACELET LINKS CHAIN (Interlocking & Connecting Edge-to-Edge) */
            <View style={styles.workbenchBandContainer}>
                {/* Left & Right Floating Quick Navigation Buttons */}
                {count > 3 && (
                  <>
                    <TouchableOpacity
                      style={[styles.chainScrollArrowBtn, styles.chainScrollArrowBtnLeft]}
                      onPress={() => scrollChain('left')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chainScrollArrowText}>◀</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.chainScrollArrowBtn, styles.chainScrollArrowBtnRight]}
                      onPress={() => scrollChain('right')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chainScrollArrowText}>▶</Text>
                    </TouchableOpacity>
                  </>
                )}

                <ScrollView
                  ref={chainScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  onScroll={(e) => {
                    chainScrollOffset.current = e.nativeEvent.contentOffset.x;
                  }}
                  scrollEventThrottle={16}
                  contentContainerStyle={styles.centerChainTrack}
                  {...(Platform.OS === 'web' ? {
                    onWheel: (e) => {
                      if (chainScrollRef.current) {
                        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
                        if (delta !== 0) {
                          chainScrollOffset.current = Math.max(0, chainScrollOffset.current + delta);
                          if (chainScrollRef.current.scrollTo) {
                            chainScrollRef.current.scrollTo({ x: chainScrollOffset.current, animated: false });
                          }
                        }
                      }
                    }
                  } : {})}
                >
                  {braceletLinks.map((charm, idx) => {
                    const isSelected = selectedSlotIndex === idx;
                    const isHovered = hoverSlotIndex === idx;
                    const isBeingDragged = draggedWorkbenchIndex === idx;
                    const isFirst = idx === 0;
                    const isLast = idx === count - 1;

                    return (
                      <View
                        key={charm.uid || idx}
                        dataSet={{ slotIndex: idx }}
                        style={[
                          styles.slotWrapper,
                          idx > 0 && { marginLeft: -2 },
                          isBeingDragged && { opacity: 0.35, transform: [{ scale: 0.95 }] },
                          isHovered && { transform: [{ scale: 1.05 }], zIndex: 10 },
                          isSelected && { zIndex: 10 },
                          Platform.OS === 'web' && {
                            cursor: isDraggingActive ? 'grabbing' : 'grab',
                            userSelect: 'none',
                          },
                        ]}
                        onPointerDown={(e) => handleSlotPointerDown(idx, e)}
                      >
                        {/* Modular Italian Interlocking Charm Link Connecting Edge-to-Edge */}
                        <ModularCharmLink
                          charm={charm}
                          size="workbench"
                          showHook={idx > 0}
                          isSelected={isSelected}
                          isHovered={isHovered}
                        />

                        {/* Drag Hover Swap Indicator */}
                        {isHovered && (
                          <View style={styles.hoverSwapBadge} pointerEvents="none">
                            <Text style={styles.hoverSwapBadgeText}>⇄ Drop</Text>
                          </View>
                        )}

                        {/* Interactive Nudge & Reorder Actions (Visible on Selection) */}
                        {isSelected && !isHovered && (
                          <View style={styles.linkActionToolbar}>
                            {!isFirst && (
                              <TouchableOpacity
                                style={styles.nudgeBtn}
                                onPress={(e) => {
                                  if (e && e.stopPropagation) e.stopPropagation();
                                  handleNudgeLeft(idx);
                                }}
                              >
                                <Text style={styles.nudgeBtnText}>◀</Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={[styles.nudgeBtn, { backgroundColor: '#ef4444' }]}
                              onPress={(e) => {
                                if (e && e.stopPropagation) e.stopPropagation();
                                removeCharmAtIndex(idx);
                              }}
                            >
                              <Text style={[styles.nudgeBtnText, { color: '#ffffff' }]}>✕</Text>
                            </TouchableOpacity>

                            {!isLast && (
                              <TouchableOpacity
                                style={styles.nudgeBtn}
                                onPress={(e) => {
                                  if (e && e.stopPropagation) e.stopPropagation();
                                  handleNudgeRight(idx);
                                }}
                              >
                                <Text style={styles.nudgeBtnText}>▶</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Horizontal Scroll Guidance Indicator Pill */}
                {count > 3 && (
                  <View style={styles.chainScrollHintPill} pointerEvents="none">
                    <Text style={styles.chainScrollHintText}>
                      ◀ {lang === 'km' ? 'អូសឆ្វេងស្តាំដើម្បីមើល Charms ទាំងអស់' : 'Scroll left & right to view all links'} ▶ ({count} charms)
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

        {/* ------------------------------------------------------------ */}
        {/* DRAG-TO-TRASH ZONE (Appears during drag)                     */}
        {/* ------------------------------------------------------------ */}
        {isDraggingActive && draggedWorkbenchIndex !== null && (
          <View
            dataSet={{ trashZone: 'true' }}
            style={[
              styles.trashDropZone,
              isOverTrash && { borderColor: theme.error, backgroundColor: 'rgba(239, 68, 68, 0.25)' },
            ]}
          >
            <Text style={{ color: theme.error, fontWeight: '800', fontSize: 13 }}>
              {isOverTrash ? '🗑️ Release mouse or finger to Delete Charm' : t('trashZoneText')}
            </Text>
          </View>
        )}

        {/* Validation Alert */}
        {!isValidLength && count > 0 && (
          <View style={[styles.warningBanner, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.error }]}>
            <Text style={[styles.warningText, { color: theme.error }]}>
              {t('braceletLengthReq', { count })}
            </Text>
          </View>
        )}
      </View>

      {/* ============================================================== */}
      {/* 3. CONFIGURATION & PRICE (On Top of Charm Product Section)     */}
      {/* ============================================================== */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: isValidLength ? (theme.secondary || '#10b981') : theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
            🧾 {t('configPrice')}
          </Text>
          <View style={[
            styles.topStatusPill,
            {
              backgroundColor: isValidLength ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              borderColor: isValidLength ? (theme.secondary || '#10b981') : theme.gold,
            },
          ]}>
            <Text style={{
              fontSize: 11,
              fontWeight: '800',
              color: isValidLength ? (theme.secondary || '#10b981') : theme.gold,
            }}>
              {isValidLength ? '✓ Ready to Order' : `Min 15 (${count}/${MIN_CHARMS})`}
            </Text>
          </View>
        </View>

        {/* Packaging Box Options (Basic vs Premium Box +$0.50) */}
        <View style={styles.boxOptionSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[styles.boxOptionSectionTitle, { color: theme.text }]}>
              🎁 {t('boxPackagingTitle') || 'Bracelet Packaging Option'}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textMuted }}>
              {boxOption === 'premium' ? '✨ Premium Box (+$0.50)' : '📦 Basic Box ($0.00)'}
            </Text>
          </View>

          <View style={styles.boxOptionsGrid}>
            {/* 1. Basic Box Button */}
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
                  <Text style={styles.boxOptionIcon}>📦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.boxOptionTitleText, { color: theme.text }]}>
                    {t('boxBasic')}
                  </Text>
                  <Text style={[styles.boxOptionSubText, { color: theme.secondary || '#10b981' }]}>
                    {t('boxBasicIncluded')}
                  </Text>
                </View>
                <View style={[
                  styles.boxOptionRadio,
                  {
                    borderColor: boxOption === 'basic' ? (theme.secondary || '#10b981') : theme.border,
                    backgroundColor: boxOption === 'basic' ? (theme.secondary || '#10b981') : 'transparent',
                  },
                ]}>
                  {boxOption === 'basic' && <Text style={styles.boxOptionCheckText}>✓</Text>}
                </View>
              </View>
            </TouchableOpacity>

            {/* 2. Premium Box Button (Extra $0.5) */}
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
                  <Text style={styles.boxOptionIcon}>🎁</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.boxOptionTitleText, { color: theme.text }]}>
                      {t('boxPremium')}
                    </Text>
                    <View style={[styles.extraPriceTag, { backgroundColor: theme.gold + '25', borderColor: theme.gold }]}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: theme.gold }}>+0.5$</Text>
                    </View>
                  </View>
                  <Text style={[styles.boxOptionSubText, { color: theme.gold }]}>
                    {t('boxPremiumPrice')}
                  </Text>
                </View>
                <View style={[
                  styles.boxOptionRadio,
                  {
                    borderColor: boxOption === 'premium' ? theme.gold : theme.border,
                    backgroundColor: boxOption === 'premium' ? theme.gold : 'transparent',
                  },
                ]}>
                  {boxOption === 'premium' && <Text style={[styles.boxOptionCheckText, { color: '#000000' }]}>✓</Text>}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 10 }]} />

        <View style={styles.priceRow}>
          <Text style={{ color: theme.textMuted }}>
            {t('baseBand')} ({count} Links · Band Included)
          </Text>
          <Text style={{ color: theme.secondary || '#10b981', fontWeight: '700' }}>
            Included ($0.00)
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={{ color: theme.textMuted }}>
            Custom Charms ({customCharmsCount} item{customCharmsCount === 1 ? '' : 's'})
          </Text>
          <Text style={{ color: theme.text, fontWeight: '700' }}>
            +${charmsTotalPrice.toFixed(2)}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={{ color: theme.textMuted }}>
            {boxOption === 'premium' ? '🎁 Premium Box Packaging' : '📦 Basic Box Packaging'}
          </Text>
          <Text style={{ color: boxOption === 'premium' ? theme.gold : (theme.secondary || '#10b981'), fontWeight: '700' }}>
            {boxOption === 'premium' ? `+$${BOX_PREMIUM_PRICE.toFixed(2)}` : 'Included ($0.00)'}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={{ color: theme.gold, fontWeight: '700' }}>⭐ Reward Points</Text>
          <Text style={{ color: theme.gold, fontWeight: '800' }}>+{customPoints} pt</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.totalRow}>
          <View>
            <Text style={[styles.totalLabel, { color: theme.text }]}>{t('totalAmount')}</Text>
            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
              Rate: $1 USD = {rate.toLocaleString()} ៛ KHR
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.totalVal, { color: theme.secondary || '#10b981' }]}>${totalPrice.toFixed(2)}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.gold, marginTop: 2 }}>
              ≈ {Math.round(totalPrice * rate).toLocaleString()} ៛ KHR
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addToCartBtn,
            { backgroundColor: isValidLength ? (theme.secondary || '#10b981') : '#4b5563' },
          ]}
          onPress={handleAddToCart}
          disabled={!isValidLength}
          activeOpacity={0.8}
        >
          <Text style={styles.addToCartText}>
            {isValidLength
              ? `🛍️ ${t('addCustomBtn')} ($${totalPrice.toFixed(2)})`
              : `⚠️ Need ${MIN_CHARMS - count} more charm${MIN_CHARMS - count === 1 ? '' : 's'} (Min 15) to Add to Cart`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ============================================================== */}
      {/* 4. AVAILABLE CHARMS CATALOG TRAY (With Search & Filters)       */}
      {/* ============================================================== */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.trayHeaderRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              ✨ {t('availableCharms')} ({filteredCharms.length})
            </Text>
            <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
              {lang === 'km'
                ? '៥x៥ ក្រឡា Charms • ចុចដើម្បីបន្ថែម ឬអូសដាក់ក្នុងខ្សែដៃ'
                : '5x5 Charms Grid • Tap to add or drag into bracelet band'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* View Mode Toggle: 5x5 Grid vs Horizontal Scroll Carousel */}
            <TouchableOpacity
              style={[
                styles.viewModeToggleBtn,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
              onPress={() => setCharmsViewMode((prev) => (prev === 'scroll' ? 'grid' : 'scroll'))}
              activeOpacity={0.8}
            >
              <Text style={[styles.viewModeToggleText, { color: theme.text }]}>
                {charmsViewMode === 'scroll' ? '⊞ 5x5 Grid' : '⇄ Scroll'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar (Search by Charm Code or Name) */}
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          placeholder="🔍 Search charms by short code (e.g. C01, C25) or name..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Search Place Picked Charm Code Display (Only show charm code here when customer picks a charm!) */}
        {pickedCharm ? (
          <View style={[styles.pickedCharmNotice, { backgroundColor: theme.inputBg, borderColor: theme.gold }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Text style={{ fontSize: 13 }}>🎯</Text>
              <View style={[styles.pickedCodeBadge, { backgroundColor: theme.gold }]}>
                <Text style={styles.pickedCodeBadgeText}>{formatShortCharmCode(pickedCharm.id)}</Text>
              </View>
              <Text style={[styles.pickedCharmName, { color: theme.text }]} numberOfLines={1}>
                {pickedCharm.name} {pickedCharm.price ? `(+$${(+pickedCharm.price).toFixed(2)})` : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                style={[styles.pickedSearchBtn, { backgroundColor: theme.primary }]}
                onPress={() => setSearchQuery(formatShortCharmCode(pickedCharm.id))}
                activeOpacity={0.8}
              >
                <Text style={styles.pickedSearchBtnText}>Search Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickedClearBtn}
                onPress={() => setPickedCharm(null)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {searchQuery.trim().length > 0 && (
          <View style={[styles.searchActivePill, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6' }]}>
            <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '700' }}>
              🔍 Filtering by "{searchQuery}" ({filteredCharms.length} found)
            </Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '700', marginLeft: 6 }}>✕ Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
          {charmCategories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: active ? (theme.secondary || '#10b981') : theme.inputBg,
                    borderColor: active ? (theme.secondary || '#10b981') : theme.border,
                  },
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.catChipText, { color: active ? '#ffffff' : theme.text }]}>
                  {cat === 'all' ? t('filterAll') : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Charms Section: Empty State or Horizontal Carousel or Multi-Row Grid */}
        {filteredCharms.length === 0 ? (
          <View style={[styles.emptyCharmsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🔗</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>
              {lang === 'km' ? 'មិនទាន់មានតំណាក់ក្នុងស្តុកទេ' : 'No Charms in Catalog'}
            </Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, textAlign: 'center' }}>
              {lang === 'km' ? 'កាតាឡុកត្រូវបានលុបជម្រះ។ តំណាក់អ៊ីតាលីថ្មីៗនឹងមកដល់ឆាប់ៗនេះ!' : 'All charms have been cleared. New Italy charms will be added soon!'}
            </Text>
          </View>
        ) : charmsViewMode === 'scroll' ? (
          <View style={styles.horizontalCharmsWrapper}>
            <TouchableOpacity
              style={[styles.catalogArrowBtn, styles.catalogArrowBtnLeft]}
              onPress={() => scrollCatalog('left')}
              activeOpacity={0.8}
            >
              <Text style={styles.catalogArrowText}>◀</Text>
            </TouchableOpacity>

            <ScrollView
              ref={catalogScrollRef}
              horizontal
              showsHorizontalScrollIndicator={true}
              onScroll={(e) => {
                catalogScrollOffset.current = e.nativeEvent.contentOffset.x;
              }}
              scrollEventThrottle={16}
              contentContainerStyle={styles.charmsHorizontalTrack}
              {...(Platform.OS === 'web' ? {
                onWheel: (e) => {
                  if (catalogScrollRef.current) {
                    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
                    if (delta !== 0) {
                      catalogScrollOffset.current = Math.max(0, catalogScrollOffset.current + delta);
                      if (catalogScrollRef.current.scrollTo) {
                        catalogScrollRef.current.scrollTo({ x: catalogScrollOffset.current, animated: false });
                      }
                    }
                  }
                }
              } : {})}
            >
              {filteredCharms.map((ch) => (
                <TouchableOpacity
                  key={ch.id}
                  style={[
                    styles.charmPickCardHorizontal,
                    {
                      backgroundColor: theme.card,
                      borderColor: ch.isPlain ? theme.border : theme.gold + '50',
                    },
                  ]}
                  onPress={() => addCharmToBracelet(ch)}
                  onPointerDown={(e) => handleCatalogPointerDown(ch, e)}
                  activeOpacity={0.7}
                >
                  {/* Authentic Modular Italian Charm Link (Clean presentation without code) */}
                  <ModularCharmLink
                    charm={ch}
                    size="catalog"
                    showHook={false}
                    style={{ alignSelf: 'center', marginBottom: 6 }}
                  />

                  <Text style={[styles.charmPickName, { color: theme.text }]} numberOfLines={1}>
                    {ch.name}
                  </Text>

                  <Text style={[styles.charmPickPrice, { color: ch.isPlain ? theme.textMuted : theme.gold }]}>
                    {ch.isPlain ? 'Base Link ($0)' : `+$${(+ch.price || 0).toFixed(2)}`}
                  </Text>

                  <Text style={[styles.charmPickKhrPrice, { color: theme.textMuted }]}>
                    {ch.isPlain ? '0 ៛' : `≈ ${Math.round((+ch.price || 0) * rate).toLocaleString()} ៛`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.catalogArrowBtn, styles.catalogArrowBtnRight]}
              onPress={() => scrollCatalog('right')}
              activeOpacity={0.8}
            >
              <Text style={styles.catalogArrowText}>▶</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 5 by 5 Charms Grid: Clean Modular Card without Charm Code */
          <View style={styles.charmsGrid}>
            {filteredCharms.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                style={[
                  styles.charmPickCard,
                  {
                    width: Platform.OS === 'web' ? 'calc(20% - 5px)' : '18.8%',
                    backgroundColor: theme.card,
                    borderColor: ch.isPlain ? theme.border : theme.gold + '40',
                  },
                ]}
                onPress={() => addCharmToBracelet(ch)}
                onPointerDown={(e) => handleCatalogPointerDown(ch, e)}
                activeOpacity={0.7}
              >
                {/* Authentic Modular Italian Charm Link (Clean 5x5 Presentation) */}
                <ModularCharmLink
                  charm={ch}
                  size="catalog"
                  showHook={false}
                  style={{ alignSelf: 'center', marginBottom: 4 }}
                />

                <Text
                  style={[
                    styles.charmPickName,
                    { color: theme.text, fontSize: isDesktop ? 11 : 9 },
                  ]}
                  numberOfLines={1}
                >
                  {ch.name}
                </Text>

                <Text
                  style={[
                    styles.charmPickPrice,
                    {
                      color: ch.isPlain ? theme.textMuted : theme.gold,
                      fontSize: isDesktop ? 11 : 9.5,
                    },
                  ]}
                >
                  {ch.isPlain ? '$0' : `+$${(+ch.price || 0).toFixed(2)}`}
                </Text>

                <Text
                  style={[
                    styles.charmPickKhrPrice,
                    { color: theme.textMuted, fontSize: isDesktop ? 9.5 : 8 },
                  ]}
                  numberOfLines={1}
                >
                  {ch.isPlain ? '0 ៛' : `≈ ${Math.round((+ch.price || 0) * rate).toLocaleString()} ៛`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>

    {/* Floating Drag Ghost (Follows mouse cursor / finger touch across screen) */}
    {isDraggingActive && dragGhostItem && (
      <View
        pointerEvents="none"
        style={[
          styles.floatingGhostCard,
          Platform.OS === 'web'
            ? {
                position: 'fixed',
                left: dragPointerPos.x - 45,
                top: dragPointerPos.y - 58,
              }
            : {
                position: 'absolute',
                left: dragPointerPos.x - 45,
                top: dragPointerPos.y - 58,
              },
          {
            borderColor: isOverTrash ? '#ef4444' : '#10b981',
            backgroundColor: activeFinishObj.bg,
            shadowColor: isOverTrash ? '#ef4444' : '#10b981',
          },
        ]}
      >
        <Image
          source={resolveCharmImage(dragGhostItem.image)}
          style={styles.floatingGhostImg}
          resizeMode="contain"
        />
        <View style={[styles.floatingGhostBadge, { backgroundColor: isOverTrash ? '#ef4444' : '#10b981' }]}>
          <Text style={styles.floatingGhostBadgeText}>
            {isOverTrash ? '🗑️ Delete' : '⇄ Dragging'}
          </Text>
        </View>
      </View>
    )}
  </View>
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
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 11,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  sizeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  sizeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  desc: {
    fontSize: 11,
    lineHeight: 16,
  },
  styleEngineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  styleSearchRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  styleSearchInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 11.5,
    fontWeight: '700',
  },
  styleLoadBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleLoadBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  currentStyleIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
  },
  styleIdPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  currentStyleIdCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  copyStyleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyStyleBtnText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  workbenchBandContainer: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  workbenchContinuousRailTop: {
    position: 'absolute',
    top: 26,
    left: 0,
    right: 0,
    height: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  workbenchContinuousRailBottom: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    right: 0,
    height: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  stageCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 11,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  stageHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  clearBtnPill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressStatusText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  viewToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  viewToggleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  viewToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  centerStageOuter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#07090e',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    marginBottom: 14,
    minHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyStageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  emptySlotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emptySlotGuideTile: {
    width: 62,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotPlus: {
    fontSize: 22,
    fontWeight: '800',
  },
  emptyHintTitle: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyHintSub: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 6,
  },
  centerChainTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    // ScrollView clips anything outside its content box, so reserve room for:
    // selection toolbar (absolute top:-26), select/hover scale-up, and hover badge.
    paddingTop: 36,
    paddingBottom: 16,
    minHeight: 50 + 36 + 16, // workbench charm height + padding
    gap: 0, // Seamless connecting band without wide disjointed box gaps!
  },
  slotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 0, // Seamless edge-to-edge connecting links matching reference photo!
  },
  pureCharmSlot: {
    width: 68,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  pureCharmSlotSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1.5,
    borderColor: '#d4af37',
    transform: [{ scale: 1.05 }],
  },
  pureCharmSlotHovered: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10b981',
    transform: [{ scale: 1.05 }],
  },
  pureCharmImage: {
    width: 64,
    height: 74,
    alignSelf: 'center',
  },
  linkActionToolbar: {
    position: 'absolute',
    top: -26,
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  nudgeBtn: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  charmCardIdBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    zIndex: 2,
  },
  charmCardIdText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  engravedOverlayBadge: {
    position: 'absolute',
    bottom: 5,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  engravedOverlayText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hoverSwapBadge: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 5,
  },
  hoverSwapBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  trashDropZone: {
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ef4444',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginTop: 8,
  },
  centerWristContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  wristLoopFrame: {
    width: '100%',
    maxWidth: 540,
    borderRadius: 24,
    borderWidth: 2,
    padding: 22,
    alignItems: 'center',
  },
  wristLoopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  wristLinkTile: {
    width: 66,
    height: 78,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  wristLinkImg: {
    width: 52,
    height: 58,
    alignSelf: 'center',
  },
  warningBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '700',
  },
  engravedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  engravedInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  engravedInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  engravedAddBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engravedAddBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  trayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  priceTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  priceTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  searchInput: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    marginBottom: 10,
  },
  catChipsScroll: {
    marginBottom: 12,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pickedCharmNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 8,
  },
  pickedCodeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pickedCodeBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pickedCharmName: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  pickedSearchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pickedSearchBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  pickedClearBtn: {
    padding: 3,
  },
  searchActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  topStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  charmsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  charmPickCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  charmPickCenteredImg: {
    alignSelf: 'center',
    marginVertical: 2,
  },
  charmPickName: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  charmPickPrice: {
    fontWeight: '800',
    textAlign: 'center',
  },
  charmPickKhrPrice: {
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  boxOptionSection: {
    marginBottom: 8,
  },
  boxOptionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  boxOptionSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOptionIcon: {
    fontSize: 13,
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
  extraPriceTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  boxOptionRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOptionCheckText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 11,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 17,
    fontWeight: '800',
  },
  addToCartBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
  floatingGhostCard: {
    width: 90,
    height: 114,
    borderRadius: 16,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 20,
    transform: [{ scale: 1.1 }, { rotate: '3deg' }],
  },
  floatingGhostImg: {
    width: 70,
    height: 80,
  },
  floatingGhostBadge: {
    position: 'absolute',
    bottom: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  floatingGhostBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  // Floating Workbench Left & Right Quick Scroll Navigation
  chainScrollArrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1.5,
    borderColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  chainScrollArrowBtnLeft: {
    left: 6,
  },
  chainScrollArrowBtnRight: {
    right: 6,
  },
  chainScrollArrowText: {
    color: '#d4af37',
    fontSize: 15,
    fontWeight: '900',
  },
  chainScrollHintPill: {
    alignSelf: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  chainScrollHintText: {
    fontSize: 11,
    color: '#d4af37',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Horizontal Charms Catalog Carousel
  horizontalCharmsWrapper: {
    position: 'relative',
    width: '100%',
    paddingVertical: 4,
  },
  charmsHorizontalTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
    paddingVertical: 8,
  },
  charmPickCardHorizontal: {
    width: 140,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  charmPickImgHorizontal: {
    width: 64,
    height: 72,
    alignSelf: 'center',
    marginVertical: 4,
  },
  catalogArrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1.5,
    borderColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  catalogArrowBtnLeft: {
    left: 4,
  },
  catalogArrowBtnRight: {
    right: 4,
  },
  catalogArrowText: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '800',
  },
  viewModeToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewModeToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCharmsCard: {
    width: '100%',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
});
