// Icon Update Studio: pure design model, presets and plan access (no DOM, unit-tested).
import type { Tier } from "@/hooks/useSession";

export const COUNTDOWN_STAGES = [
  "24 HOURS", "12 HOURS", "6 HOURS", "5 HOURS", "4 HOURS", "3 HOURS",
  "2 HOURS", "1 HOUR", "45 MINS", "30 MINS", "15 MINS", "NOW!",
] as const;

/** locked = Guest/Free, standard = Starter, advanced = Premium and Scale/Enterprise. */
export type IconAccess = "locked" | "standard" | "advanced";
const RANK: Record<Tier, number> = { guest: -1, free: 0, starter: 1, premium: 2, enterprise: 3 };
export const iconStudioAccess = (tier: Tier): IconAccess =>
  RANK[tier] >= RANK.premium ? "advanced" : RANK[tier] >= RANK.starter ? "standard" : "locked";

export const FONTS = {
  montserrat: { label: "Montserrat Black", family: "Montserrat", weight: 900 },
  lilita: { label: "Lilita One", family: "Lilita One", weight: 400 },
  bebas: { label: "Bebas Neue", family: "Bebas Neue", weight: 400 },
  arial: { label: "Arial Black", family: "Arial Black", weight: 900 },
} as const;
export type FontId = keyof typeof FONTS;
export const FONT_CSS = "https://fonts.googleapis.com/css2?family=Montserrat:wght@900&family=Lilita+One&family=Bebas+Neue&display=swap";

export type GlassStyle = "outline" | "solid" | "none";
export interface IconDesign {
  glass: GlassStyle; glassColor: string; sandColor: string;
  /** Sizes, positions and effect widths are % of the icon edge, so preview and every export size match. */
  glassSize: number; glassX: number; glassY: number;
  text: string; font: FontId; textColor: string; textSize: number; textX: number; textY: number;
  outlineColor: string; outlineWidth: number;
  shadowColor: string; shadowBlur: number; shadowOffset: number;
  dimColor: string; dim: number;
}

export const TEXT_MAX = 24;
export const LIMITS = {
  glassSize: [10, 95], glassX: [0, 100], glassY: [0, 100],
  textSize: [4, 40], textX: [0, 100], textY: [0, 100],
  outlineWidth: [0, 4], shadowBlur: [0, 8], shadowOffset: [0, 5], dim: [0, 85],
} as const satisfies Partial<Record<keyof IconDesign, readonly [number, number]>>;

const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (v: unknown, [lo, hi]: readonly [number, number], fb: number) => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : fb;
  return Math.min(hi, Math.max(lo, n));
};

/** Trims, strips control characters, collapses spaces and caps length. */
export function cleanText(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, TEXT_MAX);
}

export const BASE: IconDesign = {
  glass: "outline", glassColor: "#ffffff", sandColor: "#ffffff",
  glassSize: 52, glassX: 50, glassY: 38,
  text: "24 HOURS", font: "montserrat", textColor: "#ffffff", textSize: 14, textX: 50, textY: 82,
  outlineColor: "#000000", outlineWidth: 1.2,
  shadowColor: "#000000", shadowBlur: 2, shadowOffset: 0.8,
  dimColor: "#000000", dim: 35,
};

/** Coerces untrusted input (e.g. a saved preset) into a valid design. */
export function normalizeDesign(raw: unknown): IconDesign {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const color = (k: keyof IconDesign) => (typeof r[k] === "string" && HEX.test(r[k] as string) ? (r[k] as string).toLowerCase() : (BASE[k] as string));
  const out = { ...BASE } as IconDesign;
  (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).forEach((k) => { (out[k] as number) = clamp(r[k], LIMITS[k], BASE[k] as number); });
  out.glass = (["outline", "solid", "none"] as const).includes(r.glass as GlassStyle) ? (r.glass as GlassStyle) : BASE.glass;
  out.font = typeof r.font === "string" && r.font in FONTS ? (r.font as FontId) : BASE.font;
  out.text = typeof r.text === "string" ? cleanText(r.text) : BASE.text;
  (["glassColor", "sandColor", "textColor", "outlineColor", "shadowColor", "dimColor"] as const).forEach((k) => { out[k] = color(k); });
  return out;
}

export interface Preset { id: string; name: string; advanced?: boolean; design: Partial<IconDesign> }
export const PRESETS: Preset[] = [
  { id: "classic", name: "Classic Countdown", design: {} },
  { id: "bold", name: "Bold Silhouette", design: { glass: "solid", glassSize: 66, glassY: 40, textSize: 22, textY: 86, outlineWidth: 0, shadowBlur: 3, shadowOffset: 0.6, dim: 0 } },
  { id: "urgent", name: "Urgent Red", design: { textColor: "#ff3b3b", outlineWidth: 1.6, dim: 20 } },
  { id: "gold", name: "Gold Rush", design: { glass: "solid", glassColor: "#ffc83d", sandColor: "#fff3c4", textColor: "#ffc83d", outlineColor: "#3a2300", outlineWidth: 1.4, dim: 25, dimColor: "#1a0f00" } },
  { id: "text", name: "Text Only", design: { glass: "none", textSize: 24, textY: 50, dim: 45 } },
  { id: "neon", name: "Neon Glow", advanced: true, design: { glassColor: "#3df5ff", sandColor: "#b8fbff", textColor: "#3df5ff", outlineColor: "#003a40", outlineWidth: 0.6, shadowColor: "#00e5ff", shadowBlur: 5, shadowOffset: 0, dim: 60, dimColor: "#000814" } },
  { id: "corner", name: "Corner Badge", advanced: true, design: { glassSize: 28, glassX: 80, glassY: 20, textSize: 9, textX: 78, textY: 41, dim: 0, outlineWidth: 1 } },
  { id: "midnight", name: "Midnight Drop", advanced: true, design: { glass: "solid", glassSize: 60, glassY: 40, font: "lilita", textSize: 20, textY: 84, dim: 65, dimColor: "#0a0420", shadowBlur: 4 } },
];

/** Applies a preset but keeps the user's current countdown text. */
export const applyPreset = (p: Preset, text: string): IconDesign => normalizeDesign({ ...BASE, ...p.design, text });

export const EXPORTS = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" } as const;
export type ExportFormat = keyof typeof EXPORTS;
export const EXPORT_SIZES = { standard: [512], advanced: [512, 1024] } as const;

export function exportName(text: string, fmt: ExportFormat, index?: number): string {
  const slug = cleanText(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "icon";
  const prefix = index === undefined ? "" : `${String(index + 1).padStart(2, "0")}-`;
  return `${prefix}outrun-icon-${slug}.${fmt === "jpeg" ? "jpg" : fmt}`;
}
