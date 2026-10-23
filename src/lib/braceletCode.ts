import { Charm } from "@/types/store";
import { getCharmCode, CHARMS } from "@/data/charms";

export type BraceletFinish = "silver" | "gold" | "rose" | "black";

const FINISH_MAP: Record<string, BraceletFinish> = {
  S: "silver",
  SILVER: "silver",
  G: "gold",
  GOLD: "gold",
  R: "rose",
  ROSE: "rose",
  ROSEGOLD: "rose",
  B: "black",
  BLACK: "black",
};

const FINISH_CODE_MAP: Record<BraceletFinish, string> = {
  silver: "S",
  gold: "G",
  rose: "R",
  black: "B",
};

/**
 * Generate a shareable, short bracelet style code.
 * Example: "SRB-S:GF1-P01-P02-P03-P04-P05-P06-P07-P08-P09-P10-P11-P12-P13-P14-CAT"
 */
export function generateBraceletCode(
  finish: BraceletFinish,
  slots: (Charm | null | { charm: Charm })[]
): string {
  const finishCode = FINISH_CODE_MAP[finish] || "S";
  const charmCodes: string[] = [];

  slots.forEach((item) => {
    if (!item) return;
    const c = "charm" in item ? item.charm : item;
    if (c) {
      charmCodes.push(getCharmCode(c));
    }
  });

  if (charmCodes.length === 0) return "";

  return `SRB-${finishCode}:${charmCodes.join("-")}`;
}

/**
 * Generate a shareable URL to give to friends
 */
export function generateBraceletShareUrl(code: string): string {
  if (!code) return "";
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  return `${origin}/italy-bracelet?code=${encodeURIComponent(code)}`;
}

/**
 * Parse a shared bracelet code string or URL and resolve it against available charms catalog.
 * Supports flexible formats:
 * - "SRB-S:GF1-P01-P02..."
 * - "SRB-SILVER:GF1,P01,P02..."
 * - Full URL: "https://.../italy-bracelet?code=SRB-S:GF1-P01..."
 * - List of codes: "GF1-P01-P02" or "GF1, P01, P02"
 */
export function parseBraceletCode(
  input: string,
  catalog: Charm[] = []
): { finish: BraceletFinish; charms: Charm[] } | null {
  if (!input || typeof input !== "string") return null;

  let trimmed = input.trim();
  // Strip surrounding quotes if any
  trimmed = trimmed.replace(/^["']+|["']+$/g, "").trim();

  // If a URL was pasted, extract the code/style parameter
  if (trimmed.includes("code=")) {
    const match = trimmed.match(/[?&]code=([^&#\s]+)/i);
    if (match && match[1]) {
      trimmed = decodeURIComponent(match[1]);
    }
  } else if (trimmed.includes("style=")) {
    const match = trimmed.match(/[?&]style=([^&#\s]+)/i);
    if (match && match[1]) {
      trimmed = decodeURIComponent(match[1]);
    }
  }

  if (trimmed.length < 2) return null;

  let finish: BraceletFinish = "silver";
  let charmTokenString = trimmed;

  // Check for "SRB-<FINISH>:<CODES>" pattern or "<FINISH>:<CODES>"
  if (trimmed.toUpperCase().startsWith("SRB-") || trimmed.includes(":")) {
    const parts = trimmed.split(":");
    const headerPart = parts[0].toUpperCase().replace("SRB-", "").trim();
    if (FINISH_MAP[headerPart]) {
      finish = FINISH_MAP[headerPart];
    }
    charmTokenString = parts.slice(1).join(":");
  }

  // Split tokens by hyphen, comma, period, slash, semicolon, or whitespace
  const rawTokens = charmTokenString
    .split(/[\s,\.\-_/;]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (rawTokens.length === 0) return null;

  // Merge catalog with static CHARMS so we never miss a charm
  const allCharmsMap = new Map<string, Charm>();
  const combinedList = [...(catalog || []), ...CHARMS];
  combinedList.forEach((c) => {
    if (c && c.id && !allCharmsMap.has(c.id)) {
      allCharmsMap.set(c.id, c);
    }
  });
  const fullCatalog = Array.from(allCharmsMap.values());

  // Build lookup index for charms: by code, id, or lower-cased name
  const codeMap = new Map<string, Charm>();
  fullCatalog.forEach((c) => {
    const code = getCharmCode(c).toUpperCase();
    codeMap.set(code, c);
    codeMap.set(c.id.toUpperCase(), c);
    codeMap.set(c.id.replace(/^charm-/, "").toUpperCase(), c);
    codeMap.set(c.name.toUpperCase(), c);
  });

  const matchedCharms: Charm[] = [];

  rawTokens.forEach((token) => {
    // If the token itself is a finish identifier e.g. "SILVER", set finish if not yet set
    if (FINISH_MAP[token] && matchedCharms.length === 0) {
      finish = FINISH_MAP[token];
      return;
    }

    const found = codeMap.get(token);
    if (found) {
      matchedCharms.push(found);
    } else {
      // Fuzzy substring search if exact token match failed
      const fuzzy = fullCatalog.find(
        (c) =>
          getCharmCode(c).toUpperCase() === token ||
          c.name.toUpperCase().includes(token) ||
          c.id.toUpperCase().includes(token)
      );
      if (fuzzy) {
        matchedCharms.push(fuzzy);
      }
    }
  });

  if (matchedCharms.length === 0) return null;

  return {
    finish,
    charms: matchedCharms,
  };
}
