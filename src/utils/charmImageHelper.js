// Helper to safely resolve PNG images for Italian Charms across Web, Android, iOS

const DEFAULT_CHARM_PNG = require('../../assets/charm_clean.png');
const FLORAL_PNG = require('../../assets/charms/charm_floral.png');
const LOVE_MYSELF_PNG = require('../../assets/charms/charm_love_myself.png');
const WAVES_PNG = require('../../assets/charms/charm_waves.png');
const DUMB_DAYS_PNG = require('../../assets/charms/charm_dumb_days.png');

export function resolveCharmImage(charmOrImage) {
  if (!charmOrImage) {
    return DEFAULT_CHARM_PNG;
  }

  // 1. If passed a charm object (e.g. { id, name, image, ... })
  if (typeof charmOrImage === 'object' && charmOrImage !== null) {
    if (charmOrImage.uri) {
      if (typeof charmOrImage.uri === 'string' && !charmOrImage.uri.includes('charm_clean.png')) {
        return charmOrImage;
      }
    }

    const id = String(charmOrImage.id || charmOrImage.code || charmOrImage.model_no || '').toUpperCase();
    const name = String(charmOrImage.name || '').toLowerCase();
    const rawImg = typeof charmOrImage.image === 'string' ? charmOrImage.image.toLowerCase() : '';

    if (
      id === 'C01' || id === 'C05' || id === 'C09' || id === 'C13' || id === 'C17' || id === 'C21' || id === 'C24' ||
      name.includes('floral') || name.includes('daisy') || rawImg.includes('floral')
    ) {
      return FLORAL_PNG;
    }
    if (
      id === 'C02' || id === 'C06' || id === 'C10' || id === 'C14' || id === 'C18' || id === 'C22' ||
      name.includes('love') || rawImg.includes('love')
    ) {
      return LOVE_MYSELF_PNG;
    }
    if (
      id === 'C03' || id === 'C07' || id === 'C11' || id === 'C15' || id === 'C19' ||
      name.includes('wave') || rawImg.includes('waves')
    ) {
      return WAVES_PNG;
    }
    if (
      id === 'C04' || id === 'C08' || id === 'C12' || id === 'C16' || id === 'C20' || id === 'C23' || id === 'C25' ||
      name.includes('dumb') || rawImg.includes('dumb')
    ) {
      return DUMB_DAYS_PNG;
    }

    if (charmOrImage.image && charmOrImage.image !== charmOrImage) {
      return resolveCharmImage(charmOrImage.image);
    }

    return DEFAULT_CHARM_PNG;
  }

  // 2. If passed a string (image file name, URI, code, or name)
  if (typeof charmOrImage === 'string') {
    const trimmed = charmOrImage.trim();
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { uri: trimmed };
    }
    const low = trimmed.toLowerCase();
    if (low.includes('floral') || low.includes('daisy') || low.includes('c01') || low.includes('c24')) {
      return FLORAL_PNG;
    }
    if (low.includes('love') || low.includes('c02') || low.includes('c21')) {
      return LOVE_MYSELF_PNG;
    }
    if (low.includes('wave') || low.includes('c03') || low.includes('c22')) {
      return WAVES_PNG;
    }
    if (low.includes('dumb') || low.includes('c04') || low.includes('c23') || low.includes('c25')) {
      return DUMB_DAYS_PNG;
    }
    if (low === 'charm_clean.png' || low.endsWith('/charm_clean.png') || low.includes('charm_clean')) {
      return DEFAULT_CHARM_PNG;
    }
    if (trimmed.startsWith('/')) {
      return { uri: trimmed };
    }
  }

  // 3. If passed a number (e.g. required asset)
  if (typeof charmOrImage === 'number') {
    return charmOrImage;
  }

  return DEFAULT_CHARM_PNG;
}
