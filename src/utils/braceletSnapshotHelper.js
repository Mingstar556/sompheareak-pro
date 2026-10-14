// ================================================================
// Italian Modular Charm Bracelet Snapshot Helper
// Generates an exact composite picture of the customer's custom-designed
// bracelet with interlocking charms edge-to-edge.
// ================================================================

import { Platform, Image } from 'react-native';
import { resolveCharmImage } from './charmImageHelper';

const FINISH_PALETTES = {
  silver: { border: '#cbd5e1', bg: '#1e293b', top: '#f1f5f9', bottom: '#94a3b8' },
  gold: { border: '#f59e0b', bg: '#451a03', top: '#fef08a', bottom: '#d97706' },
  rose: { border: '#fb7185', bg: '#4c0519', top: '#fecdd3', bottom: '#e11d48' },
  black: { border: '#334155', bg: '#020617', top: '#475569', bottom: '#0f172a' },
};

/**
 * Extracts a usable web image URL from a React Native image source
 */
function getWebImageUrl(rawSource) {
  if (!rawSource) return '';
  if (typeof rawSource === 'string') return rawSource;
  if (typeof rawSource === 'object' && rawSource !== null) {
    if (typeof rawSource.uri === 'string') return rawSource.uri;
    if (typeof rawSource.default === 'string') return rawSource.default;
  }
  try {
    const resolved = Image.resolveAssetSource(rawSource);
    if (resolved?.uri) return resolved.uri;
  } catch {
    // ignore
  }
  return '';
}

/**
 * Generates an exact PNG data URL of the entire interlocking Italian bracelet
 * in the customer's custom designed sequence.
 */
export async function generateBraceletSnapshot(braceletLinks, bandFinish = 'silver') {
  if (!Array.isArray(braceletLinks) || braceletLinks.length === 0) {
    return null;
  }

  // Only canvas drawing is needed on Web environment
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  try {
    const count = braceletLinks.length;
    const linkW = 58;
    const linkH = 50;
    const overlap = 2; // Real interlocking overlap connecting edge-to-edge
    const totalW = count * (linkW - overlap) + overlap;

    const scale = 2; // 2x retina sharpness
    const canvas = document.createElement('canvas');
    canvas.width = totalW * scale;
    canvas.height = linkH * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const finishColors = FINISH_PALETTES[bandFinish] || FINISH_PALETTES.silver;

    // Load all link images in parallel with safe 2-second timeout
    const loadPromises = braceletLinks.map((link) => {
      return new Promise((resolve) => {
        if (!link || link.engraved) {
          return resolve(null); // Engraved links drawn manually
        }

        const resolvedSource = resolveCharmImage(link.image || link);
        let srcUrl = getWebImageUrl(resolvedSource);

        if (!srcUrl) {
          // Fallback static asset mapping
          const raw = String(link.image || link.id || '').toLowerCase();
          if (raw.includes('floral') || raw.includes('daisy') || raw.includes('c01')) {
            srcUrl = '/assets/charms/charm_floral.png';
          } else if (raw.includes('love') || raw.includes('c02')) {
            srcUrl = '/assets/charms/charm_love_myself.png';
          } else if (raw.includes('wave') || raw.includes('c03')) {
            srcUrl = '/assets/charms/charm_waves.png';
          } else if (raw.includes('dumb') || raw.includes('c04')) {
            srcUrl = '/assets/charms/charm_dumb_days.png';
          } else {
            srcUrl = '/assets/charm_clean.png';
          }
        }

        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        const timer = setTimeout(() => {
          resolve(null);
        }, 2000);

        img.onload = () => {
          clearTimeout(timer);
          resolve(img);
        };

        img.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };

        img.src = srcUrl;
      });
    });

    const loadedImgs = await Promise.all(loadPromises);

    // Draw consecutive interlocking links
    braceletLinks.forEach((link, idx) => {
      const x = idx * (linkW - overlap);
      const img = loadedImgs[idx];

      if (img) {
        // Draw real charm PNG image
        ctx.drawImage(img, x, 0, linkW, linkH);
      } else {
        // Draw metallic link background
        const grad = ctx.createLinearGradient(x, 0, x, linkH);
        grad.addColorStop(0, finishColors.top);
        grad.addColorStop(0.5, finishColors.bg);
        grad.addColorStop(1, finishColors.bottom);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, 0, linkW, linkH, 4) : ctx.rect(x, 0, linkW, linkH);
        ctx.fill();

        ctx.strokeStyle = finishColors.border;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Render engraved letter if present
        if (link?.engraved) {
          ctx.fillStyle = '#0f172a';
          ctx.font = '900 16px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(link.engraved).toUpperCase(), x + linkW / 2, linkH / 2);
        }
      }
    });

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('[generateBraceletSnapshot] Failed to generate snapshot:', err);
    return null;
  }
}
