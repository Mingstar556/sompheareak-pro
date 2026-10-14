// ================================================================
// Product Image Resolver Helper for Somphea Reak Studio
// Ensures the upper-half product box always displays what the product
// actually looks like instead of the generic store logo.
// ================================================================

const CHARM_BRACELET_LOCAL = require('../../assets/charm_clean.png');

export const VERIFIED_PRODUCT_IMAGES = {
  // Minifigures
  'PRD-2001': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', // Space Explorer Astronaut Mini Figurine
  'PRD-2002': 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80', // Shadow Assassin Ninja Collectible Figure
  'PRD-2003': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80', // Cyber Mecha Warrior Articulated Mini Figure
  'PRD-2004': 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=600&q=80', // Arcane Grand Wizard Figurine Display

  // Toy Universe
  'PRD-2005': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80', // Solar System Kinetic Desk Orbit Toy
  'PRD-2006': 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80', // Titanium High-Velocity Gyroscope Spinner
  'PRD-2007': 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=600&q=80', // Galaxy Orbital Space Shuttle Set
  'PRD-2008': 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=600&q=80', // Turbo Speed Racer Track Machine

  // Bracelets & Jewelry
  'PRD-2009': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80', // Stainless Steel Cuban Link Silver Bracelet
  'PRD-2010': 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=600&q=80', // 18K Gold Plated Cuban Chain Bracelet
  'PRD-2011': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80', // Matte Black Natural Obsidian Beaded Bracelet
  'PRD-2012': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80', // Rose Gold Magnetic Couple Bracelet Pair
  'PRD-2013': 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=600&q=80', // Sterling Silver Minimalist Unisex Bangle
};

export const CATEGORY_FALLBACK_IMAGES = {
  'minifigure': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  'toy-universe': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
  'bracelet': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
  'custom-bracelet': CHARM_BRACELET_LOCAL,
  'charm': CHARM_BRACELET_LOCAL,
};

export function resolveProductImage(product) {
  if (!product) {
    return { uri: CATEGORY_FALLBACK_IMAGES.bracelet };
  }

  // Handle direct string passed in
  if (typeof product === 'string') {
    const trimmed = product.trim();
    if (trimmed.startsWith('data:image/') || (trimmed.startsWith('http') && !trimmed.includes('logo.jpg'))) {
      return { uri: trimmed };
    }
    if (trimmed.includes('charm_clean')) {
      return CHARM_BRACELET_LOCAL;
    }
    return { uri: CATEGORY_FALLBACK_IMAGES.bracelet };
  }

  const rawImage = typeof product.image === 'string' ? product.image.trim() : '';
  const prodId = String(product.id || '').toUpperCase();
  const prodCat = String(product.cat || product.category || '').toLowerCase();
  const prodName = String(product.name || '').toLowerCase();

  const previewImg = typeof product.braceletPreviewImage === 'string' ? product.braceletPreviewImage.trim() : '';
  if (previewImg.startsWith('data:image/') || (previewImg.startsWith('http://') || previewImg.startsWith('https://'))) {
    return { uri: previewImg };
  }

  // 1. If explicit Base64 image
  if (rawImage.startsWith('data:image/')) {
    return { uri: rawImage };
  }

  // 2. If valid HTTP/HTTPS image URL that is not the store logo
  if ((rawImage.startsWith('http://') || rawImage.startsWith('https://')) && !rawImage.includes('logo.jpg') && !rawImage.includes('logo-light') && !rawImage.includes('logo-dark')) {
    return { uri: rawImage };
  }

  // 3. Italian modular charm bracelet items
  if (rawImage.includes('charm_clean') || prodCat === 'custom-bracelet' || prodCat === 'charm' || prodName.includes('italian charm')) {
    return CHARM_BRACELET_LOCAL;
  }

  // 4. Match verified product ID mapping
  if (prodId && VERIFIED_PRODUCT_IMAGES[prodId]) {
    return { uri: VERIFIED_PRODUCT_IMAGES[prodId] };
  }

  // 5. Keyword-based matching from product title
  if (prodName.includes('astronaut') || prodName.includes('space explorer')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2001'] };
  }
  if (prodName.includes('ninja') || prodName.includes('assassin') || prodName.includes('shadow')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2002'] };
  }
  if (prodName.includes('mecha') || prodName.includes('warrior') || prodName.includes('robot')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2003'] };
  }
  if (prodName.includes('wizard') || prodName.includes('arcane') || prodName.includes('spellcaster')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2004'] };
  }
  if (prodName.includes('solar') || prodName.includes('orbit') || prodName.includes('kinetic')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2005'] };
  }
  if (prodName.includes('gyroscope') || prodName.includes('spinner')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2006'] };
  }
  if (prodName.includes('shuttle') || prodName.includes('rocket')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2007'] };
  }
  if (prodName.includes('racer') || prodName.includes('speed track') || prodName.includes('car')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2008'] };
  }
  if (prodName.includes('cuban') && (prodName.includes('gold') || prodName.includes('18k'))) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2010'] };
  }
  if (prodName.includes('cuban') || prodName.includes('curb link')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2009'] };
  }
  if (prodName.includes('obsidian') || prodName.includes('beaded') || prodName.includes('lava')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2011'] };
  }
  if (prodName.includes('couple') || prodName.includes('magnetic') || prodName.includes('matching')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2012'] };
  }
  if (prodName.includes('bangle') || prodName.includes('silver') || prodName.includes('cuff')) {
    return { uri: VERIFIED_PRODUCT_IMAGES['PRD-2013'] };
  }

  // 6. Category-based fallback (Always real product photography, never store logo!)
  if (CATEGORY_FALLBACK_IMAGES[prodCat]) {
    const catFallback = CATEGORY_FALLBACK_IMAGES[prodCat];
    return typeof catFallback === 'string' ? { uri: catFallback } : catFallback;
  }

  // 7. General luxury jewelry fallback
  return { uri: CATEGORY_FALLBACK_IMAGES['bracelet'] };
}
