import { Charm } from "@/types/store";

export const RESERVED_CHARM_CODES = new Set([
  "S",
  "SILVER",
  "G",
  "GOLD",
  "R",
  "ROSE",
  "ROSEGOLD",
  "B",
  "BLACK",
  "SRB",
  "ALL",
  "NONE",
  "NULL",
  "UNDEFINED",
]);

/**
 * Sanitize a proposed charm code into a clean, 2-5 character alphanumeric string.
 */
export function sanitizeCharmCode(code?: string): string {
  if (!code || typeof code !== "string") return "";
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);
}

/**
 * Derives a human-readable, 2-4 letter mnemonic candidate code from a charm name or ID.
 */
function deriveMnemonicCode(name?: string, id?: string): string {
  if (id === "charm-girlfriend-custom") return "GF1";
  if (id === "charm-cat-custom") return "CAT";
  if (id && id.includes("pinkystar-")) {
    const num = parseInt(id.split("pinkystar-")[1] || "0", 10) + 1;
    return `P${num < 10 ? "0" + num : num}`;
  }
  if (id && id.includes("slay-")) {
    const num = parseInt(id.split("slay-")[1] || "0", 10) + 1;
    return `S${num < 10 ? "0" + num : num}`;
  }

  if (!name || typeof name !== "string") return "";
  const cleaned = name.replace(/[^\w\s]/g, "").trim().toUpperCase();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  // Common keywords to clean, short mnemonics
  if (cleaned.includes("DADDY") || cleaned.includes("DAD")) return "DAD";
  if (cleaned.includes("MOMMY") || cleaned.includes("MOM")) return "MOM";
  if (cleaned.includes("WIFE")) return "WIF";
  if (cleaned.includes("HUSBAND")) return "HUB";
  if (cleaned.includes("GIRLFRIEND")) return "GF1";
  if (cleaned.includes("BOYFRIEND")) return "BF1";
  if (cleaned.includes("CAT")) return "CAT";
  if (cleaned.includes("DOG") || cleaned.includes("PUPPY")) return "DOG";
  if (cleaned.includes("SILVER")) return "SLV";
  if (cleaned.includes("GOLD")) return "GLD";
  if (cleaned.includes("HEART")) return "HRT";
  if (cleaned.includes("STAR")) return "STR";
  if (cleaned.includes("CROSS")) return "CRS";
  if (cleaned.includes("ANGEL")) return "ANG";
  if (cleaned.includes("CROWN")) return "CRN";

  // Acronym from multiple words (e.g. "I Love You" -> "ILY")
  if (words.length >= 3) {
    const acronym = words.map((w) => w[0]).join("").slice(0, 4);
    if (acronym.length >= 2) return acronym;
  }

  // First word letters
  const firstWord = words[0];
  if (firstWord.length >= 3) return firstWord.slice(0, 3);
  return firstWord.slice(0, 2);
}

/**
 * Generate a guaranteed unique, non-duplicating short charm code.
 * Ensures the generated code is not already in existingCharms and is not a reserved word.
 */
export function generateUniqueCharmCode(
  charmInput: Partial<Charm> | string,
  existingCharms: Charm[] = []
): string {
  const charm: Partial<Charm> =
    typeof charmInput === "string" ? { name: charmInput } : charmInput || {};
  const currentId = charm.id;

  const usedCodes = new Set<string>();
  existingCharms.forEach((c) => {
    if (c && c.id !== currentId && c.code && typeof c.code === "string") {
      usedCodes.add(c.code.trim().toUpperCase());
    }
  });

  // 1. If an explicit code was provided and is valid & unused
  const proposed = sanitizeCharmCode(charm.code);
  if (
    proposed &&
    proposed.length >= 2 &&
    !RESERVED_CHARM_CODES.has(proposed) &&
    !usedCodes.has(proposed)
  ) {
    return proposed;
  }

  // 1b. If proposed code exists, try appending a numeric suffix (e.g. DAD -> DA1, DA2, or DAD1)
  if (proposed && proposed.length >= 2 && !RESERVED_CHARM_CODES.has(proposed)) {
    const base = proposed.slice(0, 3);
    for (let i = 1; i <= 99; i++) {
      const candidate = `${base}${i < 10 ? "0" + i : i}`;
      if (!usedCodes.has(candidate) && !RESERVED_CHARM_CODES.has(candidate)) {
        return candidate;
      }
    }
  }

  // 2. Try mnemonic derived from name / ID
  const mnemonic = deriveMnemonicCode(charm.name, charm.id);
  if (
    mnemonic &&
    mnemonic.length >= 2 &&
    !RESERVED_CHARM_CODES.has(mnemonic) &&
    !usedCodes.has(mnemonic)
  ) {
    return mnemonic;
  }
  if (mnemonic && mnemonic.length >= 2 && !RESERVED_CHARM_CODES.has(mnemonic)) {
    const base = mnemonic.slice(0, 3);
    for (let i = 1; i <= 99; i++) {
      const candidate = `${base}${i < 10 ? "0" + i : i}`;
      if (!usedCodes.has(candidate) && !RESERVED_CHARM_CODES.has(candidate)) {
        return candidate;
      }
    }
  }

  // 3. Category prefix or standard prefix "C"
  let prefix = "C";
  const cat = (charm.category || "").toLowerCase();
  if (cat === "cute") prefix = "C";
  else if (cat === "emblem") prefix = "E";
  else if (cat === "anime") prefix = "A";
  else if (cat === "stone") prefix = "T";
  else if (cat === "letter") prefix = "L";

  for (let i = 1; i <= 999; i++) {
    const code = `${prefix}${i < 10 ? "0" + i : i}`;
    if (!usedCodes.has(code) && !RESERVED_CHARM_CODES.has(code)) {
      return code;
    }
  }

  // Fallback random
  return `CH${Math.floor(10 + Math.random() * 89)}`;
}

/**
 * Ensures all charms in an array have unique, non-duplicating codes.
 * Any missing, reserved, or duplicate codes are automatically re-assigned uniquely.
 */
export function ensureUniqueCharmCodes(charms: Charm[]): Charm[] {
  if (!Array.isArray(charms)) return [];
  const assigned: Charm[] = [];
  const usedCodes = new Set<string>();

  charms.forEach((c) => {
    if (!c) return;
    const item: Charm = { ...c };
    let code = sanitizeCharmCode(item.code);

    if (
      !code ||
      code.length < 2 ||
      RESERVED_CHARM_CODES.has(code) ||
      usedCodes.has(code)
    ) {
      code = generateUniqueCharmCode(item, assigned);
    }

    item.code = code;
    usedCodes.add(code);
    assigned.push(item);
  });

  return assigned;
}

/**
 * Return the unique short code for a charm.
 */
export function getCharmCode(c: Charm, catalog?: Charm[]): string {
  if (!c) return "C00";
  if (c.code && typeof c.code === "string" && c.code.trim()) {
    return c.code.trim().toUpperCase();
  }
  return generateUniqueCharmCode(c, catalog || []);
}

export const CHARMS: Charm[] = [];
