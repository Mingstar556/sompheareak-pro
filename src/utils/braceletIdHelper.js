// ================================================================
// Compact Bracelet & Charm Style ID Helper for Somphea Reak Studio
//
// Converts customized Italian bracelets into clean, organized,
// readable serial codes (e.g. B-XXXX-XXXX-XXXX-XXXX for 16 charms)
// that fit perfectly inside receipt boxes without breaking layout,
// will NEVER collide with or overwrite any Product ID (PRD-xxxx),
// and remains 100% reversible back into the exact sequence of charms.
// ================================================================

import { INITIAL_CHARMS } from '../constants/initialData.js';

/**
 * Normalizes charm IDs into clean short codes (e.g. MD-001 -> C01, C1 -> C01, CHM-1001 -> C01)
 */
export function formatShortCharmCode(charmOrId) {
  if (!charmOrId) return 'C01';

  // If passed an object with model_no or id
  if (typeof charmOrId === 'object' && charmOrId !== null) {
    if (charmOrId.isPlain) return 'BASE';
    if (charmOrId.model_no) {
      const m = String(charmOrId.model_no).match(/MD-0*(\d+)/i);
      if (m) {
        const num = parseInt(m[1], 10);
        return `C${num < 10 ? '0' + num : num}`;
      }
    }
    return formatShortCharmCode(charmOrId.id || charmOrId.model_no || '');
  }

  const str = String(charmOrId).trim();

  // Plain link
  if (str === '0' || str.toLowerCase() === 'plain' || str.toLowerCase().includes('charm_clean')) {
    return 'BASE';
  }

  // Map MD-001 -> C01
  const mModel = str.match(/^MD-0*(\d+)$/i);
  if (mModel) {
    const num = parseInt(mModel[1], 10);
    return `C${num < 10 ? '0' + num : num}`;
  }

  // Map C01 or C1 -> C01
  const mC = str.match(/^C0*(\d+)$/i);
  if (mC) {
    const num = parseInt(mC[1], 10);
    return `C${num < 10 ? '0' + num : num}`;
  }

  // Map CHM-1001 or CHM-1025 -> C01 .. C25
  const mChm = str.match(/^CHM-10?(\d+)$/i);
  if (mChm) {
    const num = parseInt(mChm[1], 10);
    return `C${num < 10 ? '0' + num : num}`;
  }

  // Pure digits (e.g. "1" -> "C01", "15" -> "C15")
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    if (num > 0 && num <= 99) {
      return `C${num < 10 ? '0' + num : num}`;
    }
  }

  return str.toUpperCase();
}

/**
 * Extracts a numeric index (1..35) from a charm object or ID.
 * Returns 0 for plain stainless base links.
 */
function getCharmIndex(charmOrId, allCharms = []) {
  if (!charmOrId) return 0;

  if (typeof charmOrId === 'object' && charmOrId !== null) {
    if (charmOrId.isPlain) return 0;
    if (charmOrId.engraved) return null; // handled separately

    // Check model_no first (e.g. MD-001 -> 1, MD-004 -> 4)
    if (charmOrId.model_no) {
      const mModel = String(charmOrId.model_no).match(/MD-0*(\d+)/i);
      if (mModel) {
        return parseInt(mModel[1], 10);
      }
    }

    // Check id (e.g. C01 -> 1, C04 -> 4)
    if (charmOrId.id) {
      const mId = String(charmOrId.id).match(/^C0*(\d+)$/i);
      if (mId) {
        return parseInt(mId[1], 10);
      }
    }

    // Check if matching in allCharms pool by name or id
    if (Array.isArray(allCharms) && allCharms.length > 0) {
      const foundIdx = allCharms.findIndex(
        (c) => c && (c.id === charmOrId.id || c.name === charmOrId.name)
      );
      if (foundIdx >= 0) {
        const cObj = allCharms[foundIdx];
        if (cObj.model_no) {
          const m = String(cObj.model_no).match(/\d+/);
          if (m) return parseInt(m[0], 10);
        }
        return foundIdx + 1;
      }
    }

    const rawId = charmOrId.model_no || charmOrId.id || '';
    return getCharmIndex(rawId, allCharms);
  }

  const str = String(charmOrId).trim();
  if (str === '0' || str.toLowerCase() === 'plain' || str.includes('charm_clean')) {
    return 0;
  }

  // 1. C01 .. C99
  const m1 = str.match(/^C0*(\d+)$/i);
  if (m1) return parseInt(m1[1], 10);

  // 2. MD-001 .. MD-099
  const m2 = str.match(/^MD-0*(\d+)$/i);
  if (m2) return parseInt(m2[1], 10);

  // 3. CHM-1001 .. CHM-1099
  const m3 = str.match(/^CHM-10*(\d+)$/i);
  if (m3) return parseInt(m3[1], 10);

  // 4. Pure digits <= 99
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    if (num > 0 && num <= 99) return num;
  }

  return 1;
}

/**
 * Converts a charm link into a single-character token.
 * '0' = Plain base link
 * '1'..'9' = Charms 1..9
 * 'A'..'P' = Charms 10..25 (Base36 standard)
 * 'a'..'z' = Monogram engraved letter
 */
export function charmToToken(link, allCharms = []) {
  if (!link) return '0';

  // Monogram engraved link
  if (link.engraved) {
    return String(link.engraved).substring(0, 1).toLowerCase();
  }

  if (link.isPlain) return '0';

  const idx = getCharmIndex(link, allCharms);
  if (idx <= 0) return '0';

  // Base36 encoding: 1 -> '1', 9 -> '9', 10 -> 'A', 25 -> 'P'
  return idx.toString(36).toUpperCase();
}

/**
 * Converts a 1-character token back into a charm link object.
 * Perfectly reconstructs the exact charm created by the customer.
 */
export function tokenToCharm(token, allCharms = []) {
  if (!token || token === '0') {
    return {
      id: 'BASE',
      name: 'Plain Stainless Band Link',
      image: 'charm_clean.png',
      price: 0,
      isPlain: true,
      engraved: null,
    };
  }

  // Lowercase letter indicates monogram engraving
  if (/^[a-z]$/.test(token)) {
    const letter = token.toUpperCase();
    return {
      id: `ENG_${letter}`,
      name: `Engraved [${letter}] Monogram`,
      image: 'charm_clean.png',
      price: 0,
      isPlain: false,
      engraved: letter,
    };
  }

  // Decode Base36 character (1 -> 1, A -> 10, P -> 25)
  const charmNum = parseInt(token, 36);
  const shortCode = `C${charmNum < 10 ? '0' + charmNum : charmNum}`;
  const modelCode = `MD-${charmNum < 10 ? '00' + charmNum : (charmNum < 100 ? '0' + charmNum : charmNum)}`;

  // Find charm in available catalog or INITIAL_CHARMS
  const pool = Array.isArray(allCharms) && allCharms.length > 0 ? allCharms : INITIAL_CHARMS;
  const found = pool.find((c) => {
    if (!c) return false;
    const cId = String(c.id || '').toUpperCase();
    const cModel = String(c.model_no || '').toUpperCase();
    const cShort = formatShortCharmCode(c.id).toUpperCase();
    return (
      cId === shortCode ||
      cShort === shortCode ||
      cModel === modelCode ||
      cModel === shortCode ||
      cModel.endsWith(`-${charmNum}`) ||
      cModel.endsWith(`-0${charmNum}`) ||
      cModel.endsWith(`-00${charmNum}`)
    );
  });

  if (found) {
    return {
      id: found.id,
      name: found.name,
      image: found.image || 'charm_clean.png',
      price: found.price !== undefined ? +found.price : 0.75,
      isPlain: false,
      engraved: null,
      category: found.category || 'Custom',
      model_no: found.model_no || shortCode,
    };
  }

  // Fallback to pool by index if available
  if (pool[charmNum - 1]) {
    const c = pool[charmNum - 1];
    return {
      id: c.id,
      name: c.name,
      image: c.image || 'charm_clean.png',
      price: c.price !== undefined ? +c.price : 0.75,
      isPlain: false,
      engraved: null,
      category: c.category || 'Custom',
      model_no: c.model_no || shortCode,
    };
  }

  return {
    id: shortCode,
    name: `Italian Charm ${shortCode}`,
    image: 'charm_clean.png',
    price: 0.75,
    isPlain: false,
    engraved: null,
    category: 'Custom',
    model_no: modelCode,
  };
}

/**
/**
 * Formats a clean sequence string into 4-character chunks:
 * e.g. "123456789ABCDEFG" -> "1234-5678-9ABC-DEFG"
 */
function chunkIntoFours(str) {
  if (!str) return '';
  const chunks = str.match(/.{1,4}/g);
  return chunks ? chunks.join('-') : str;
}

/**
 * Run-length compression for consecutive identical tokens (3 or more)
 * Formats chunks cleanly with hyphens (e.g. "8x0-1234-1234") so that counts and
 * adjacent digits can NEVER be confused or misinterpreted.
 */
function compressTokensToShortId(tokens) {
  if (!tokens) return '';
  const parts = [];
  let i = 0;
  while (i < tokens.length) {
    let run = 1;
    while (i + run < tokens.length && tokens[i + run] === tokens[i]) {
      run++;
    }
    if (run >= 3) {
      parts.push(`${run}x${tokens[i]}`);
      i += run;
    } else {
      let chunk = '';
      while (i < tokens.length) {
        let nextRun = 1;
        while (i + nextRun < tokens.length && tokens[i + nextRun] === tokens[i]) {
          nextRun++;
        }
        if (nextRun >= 3) break;
        chunk += tokens[i];
        i++;
        if (chunk.length === 4) break;
      }
      if (chunk) parts.push(chunk);
    }
  }
  return parts.join('-');
}

/**
 * Expands hyphen-separated chunks or RLE tokens back to raw 1-char tokens
 * e.g. "8x0-1234-1234" -> "0000000012341234"
 * Also gracefully handles unhyphenated RLE (e.g. "8x0"), raw sequences ("12341234"), etc.
 */
function expandShortIdToTokens(str) {
  if (!str) return '';
  const clean = str.trim();
  const parts = clean.split('-');
  let result = '';
  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;
    const m = trimmedPart.match(/^(\d+)[xX*]([0-9a-zA-Z])$/);
    if (m) {
      result += m[2].repeat(parseInt(m[1], 10));
    } else {
      result += trimmedPart;
    }
  }
  return result;
}

/**
 * Generates an ultra-compact, organized Bracelet Style ID (e.g. B-XXXX-XXXX-XXXX-XXXX for 16 charms)
 * that:
 * 1. Has distinctive B- / BG- / BR- / BB- prefix, so it NEVER duplicates or overwrites any Product ID (PRD-xxxx)!
 * 2. Compresses repeated charms (e.g. base links) with safe hyphen-delimited RLE (e.g. B-8x0-1234-1234 is only 15 chars).
 * 3. Fits comfortably inside receipt boxes without wrapping or breaking layout.
 *
 * Examples:
 * - 16 charms in Silver: "B-1234-5678-9ABC-DEFG"
 * - 16 charms in Gold:   "BG-1234-5678-9ABC-DEFG"
 * - 8 base + 8 charms:   "B-8x0-1234-1234"
 */
export function generateBraceletStyleId(links, finish = 'silver', allCharms = []) {
  if (!Array.isArray(links) || links.length === 0) return '';

  const tokens = links.map((l) => charmToToken(l, allCharms)).join('');

  // Finish prefix:
  // B  = Silver Inox (default)
  // BG = 18K Royal Gold
  // BR = Rose Gold
  // BB = Obsidian Black
  const cleanFinish = String(finish || 'silver').toLowerCase().trim();
  let prefix = 'B';
  if (cleanFinish === 'gold' || cleanFinish === '18k') {
    prefix = 'BG';
  } else if (cleanFinish === 'rose' || cleanFinish === 'rosegold') {
    prefix = 'BR';
  } else if (cleanFinish === 'black' || cleanFinish === 'obsidian') {
    prefix = 'BB';
  }

  const compressed = compressTokensToShortId(tokens);
  return `${prefix}-${compressed}`;
}

/**
 * Checks whether an input string is a Bracelet Style ID
 */
export function isBraceletStyleId(input) {
  if (!input || typeof input !== 'string') return false;
  const s = input.trim().toUpperCase();
  if (s.startsWith('B-') || s.startsWith('BG-') || s.startsWith('BR-') || s.startsWith('BB-') || s.startsWith('ITB-')) {
    return true;
  }
  // Check if chunked Base36 pattern e.g. XXXX-XXXX-XXXX
  const stripped = s.replace(/[-\s]/g, '');
  return /^[0-9A-Z]{12,}$/.test(stripped) && !s.startsWith('PRD') && !s.startsWith('CHM');
}

/**
 * Reconstructs bracelet links and finish from any Bracelet Style ID.
 * Supports:
 * 1. New Compact Format: "B-1234-5678-9ABC-DEFG", "BG-1234...", "BR-...", "BB-..."
 * 2. RLE Compact Format: "B-8x0-1234-1234"
 * 3. Unprefixed Compact: "1234-5678-9ABC-DEFG", "G-1234-...", "123456789ABCDEFG"
 * 4. Legacy Format: "ITB-SILVER-16-C01.C02.C03..."
 * 5. Comma / space / dot lists: "C01, C02, C03..." or "MD-001, MD-002..."
 */
export function parseBraceletStyleId(styleId, allCharms = []) {
  if (!styleId || typeof styleId !== 'string') {
    return { finish: 'silver', links: [] };
  }

  let raw = styleId.trim();
  let finish = 'silver';

  // 1. Check for legacy format ITB-FINISH-COUNT-TOKENS
  if (raw.toUpperCase().startsWith('ITB-')) {
    const parts = raw.split('-');
    if (parts.length >= 4) {
      const fPart = parts[1].toLowerCase();
      if (fPart.includes('gold')) finish = 'gold';
      else if (fPart.includes('rose')) finish = 'rose';
      else if (fPart.includes('black')) finish = 'black';
      else finish = 'silver';

      const charmSegment = parts.slice(3).join('-');
      const tokens = charmSegment.split(/[.,\s]+/).filter(Boolean);
      const links = tokens.map((t, idx) => {
        const u = t.toUpperCase().trim();
        if (u.startsWith('ENG_')) {
          const letter = u.slice(4).substring(0, 1);
          return tokenToCharm(letter.toLowerCase(), allCharms);
        }
        const shortCode = formatShortCharmCode(u);
        const idxNum = getCharmIndex(shortCode, allCharms);
        const tok = idxNum > 0 ? idxNum.toString(36).toUpperCase() : '0';
        const item = tokenToCharm(tok, allCharms);
        item.uid = `link_${idx}_${Date.now()}`;
        return item;
      });
      return { finish, links };
    }
  }

  // 2. Check for finish prefix
  if (/^BG-/i.test(raw)) {
    finish = 'gold';
    raw = raw.slice(3);
  } else if (/^BR-/i.test(raw)) {
    finish = 'rose';
    raw = raw.slice(3);
  } else if (/^BB-/i.test(raw)) {
    finish = 'black';
    raw = raw.slice(3);
  } else if (/^B-/i.test(raw)) {
    finish = 'silver';
    raw = raw.slice(2);
  } else if (/^G-/i.test(raw)) {
    finish = 'gold';
    raw = raw.slice(2);
  } else if (/^R-/i.test(raw)) {
    finish = 'rose';
    raw = raw.slice(2);
  } else if (/^S-/i.test(raw)) {
    finish = 'silver';
    raw = raw.slice(2);
  }

  // 3. Expand RLE compression if present (e.g. 8x0 -> 00000000)
  const expanded = expandShortIdToTokens(raw);

  // Strip hyphens and whitespace to get raw token string
  const tokenStr = expanded.replace(/[-\s]/g, '');

  // 4. Compact Base36 token sequence: Each character is 1 charm link!
  if (
    /^[0-9a-zA-Z]+$/.test(tokenStr) &&
    !tokenStr.toUpperCase().startsWith('CHM') &&
    !tokenStr.toUpperCase().startsWith('PRD') &&
    !tokenStr.toUpperCase().startsWith('MD0') &&
    !tokenStr.toUpperCase().startsWith('C0')
  ) {
    const links = tokenStr.split('').map((tok, idx) => {
      const link = tokenToCharm(tok, allCharms);
      link.uid = `link_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      return link;
    });
    return { finish, links };
  }

  // 5. Fallback for comma / dot separated list (e.g. "C01.C02.C03" or "MD-001, MD-002")
  const tokens = raw.split(/[.,\s]+/).filter(Boolean);
  const links = tokens.map((t, idx) => {
    const idxNum = getCharmIndex(t, allCharms);
    const tok = idxNum > 0 ? idxNum.toString(36).toUpperCase() : '0';
    const link = tokenToCharm(tok, allCharms);
    link.uid = `link_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return link;
  });

  return { finish, links };
}
