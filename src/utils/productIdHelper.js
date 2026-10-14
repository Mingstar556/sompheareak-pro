/**
 * Product ID Generator and Validation Helper
 * Guarantees every product has a unique, non-duplicable Product ID / SKU.
 */

export const generateProductId = (existingProducts = [], prefix = 'PRD') => {
  const existingSet = new Set(
    (existingProducts || []).map((p) => String(p.id || '').trim().toUpperCase())
  );

  let maxNum = 1000;
  for (const p of existingProducts || []) {
    const rawId = String(p.id || '').toUpperCase();
    const match = rawId.match(/^([A-Z0-9]+)-(\d+)$/);
    if (match && match[1] === prefix) {
      const num = parseInt(match[2], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  while (existingSet.has(`${prefix}-${nextNum}`)) {
    nextNum += 1;
  }

  return `${prefix}-${nextNum}`;
};

export const isProductIdDuplicate = (candidateId, editingProductId, existingProducts = []) => {
  if (!candidateId || !candidateId.trim()) return false;
  const cleanCandidate = candidateId.trim().toUpperCase();
  const cleanCurrent = editingProductId ? String(editingProductId).trim().toUpperCase() : null;

  return (existingProducts || []).some((p) => {
    const otherId = String(p.id || '').trim().toUpperCase();
    if (!otherId) return false;
    if (cleanCurrent && otherId === cleanCurrent) return false;
    return otherId === cleanCandidate;
  });
};

export const sanitizeProductId = (rawId) => {
  if (!rawId) return '';
  return String(rawId).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
};
