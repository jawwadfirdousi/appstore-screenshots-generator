import type {
  LocaleDefinition,
  MockupScreenArea,
  ScreenshotConfig,
  SlideConfig,
} from "./types";
import { resolveAssetPath } from "./path-utils";
import contentConfig from "../../public/content/config.json";

// REQUIREMENT: User-editable copy / images / locales live in
// /public/content/config.json so the repo can be open-sourced as a
// generic App Store screenshot generator. System defaults below
// (theme tokens, typography, mockup screen-area math, App Store size
// presets) stay in code because they are universal iOS marketing
// concerns, not app-specific content.

// REQUIREMENT: Screen area percentages derived from mockup pixel measurements
// iPhone: MK_W=469, MK_H=958, offsets: left=24, top=22, screenW=421, screenH=914, rx=52, ry=57
const IPHONE_SCREEN_AREA: MockupScreenArea = {
  leftPct: (24 / 469) * 100,
  topPct: (22 / 958) * 100,
  widthPct: (421 / 469) * 100,
  heightPct: (914 / 958) * 100,
  borderRadiusXPct: (52 / 421) * 100,
  borderRadiusYPct: (57 / 914) * 100,
};

// iPad portrait: MK_W=1150, MK_H=1500, offsets: left=55, top=58, screenW=1040, screenH=1384, rx=38, ry=38
// (rotated 90° from the original landscape mockup; bezel values swap)
const IPAD_SCREEN_AREA: MockupScreenArea = {
  leftPct: (55 / 1150) * 100,
  topPct: (58 / 1500) * 100,
  widthPct: (1040 / 1150) * 100,
  heightPct: (1384 / 1500) * 100,
  borderRadiusXPct: (38 / 1040) * 100,
  borderRadiusYPct: (38 / 1384) * 100,
};

const SYSTEM_THEME = {
  accent: "#10B981",
  accentBright: "#34D399",
  accentSoft: "rgba(16, 185, 129, 0.14)",
  accentPanel: "rgba(16, 185, 129, 0.22)",
  text: "#F5FAF7",
  textDark: "#0D1713",
  muted: "#9EB1A8",
  mutedDark: "#5A6A62",
  line: "rgba(255, 255, 255, 0.08)",
  lineDark: "rgba(13, 23, 19, 0.10)",
};

const SYSTEM_TYPOGRAPHY = {
  titleSize: 126,
  eyebrowSize: 34,
  bodySize: 40,
  chipSize: 30,
  fontFamily:
    '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const SYSTEM_MOCKUPS = [
  {
    id: "iphone-17-pro-max",
    label: "iPhone 17 Pro Max",
    exportSlug: "17-pro-max",
    src: "/17-pro-max-mockup.png",
    aspectRatio: "469/958",
    screenArea: IPHONE_SCREEN_AREA,
  },
  {
    id: "ipad-pro",
    label: "iPad Pro",
    exportSlug: "ipad-pro",
    src: "/ipad-mockup.png",
    aspectRatio: "1150/1500",
    screenArea: IPAD_SCREEN_AREA,
  },
] as const;

const SYSTEM_SIZES = [
  // iPhone
  { label: 'iPhone 6.9"', w: 1320, h: 2868 },
  { label: 'iPhone 6.5"', w: 1284, h: 2778 },
  { label: 'iPhone 6.3"', w: 1206, h: 2622 },
  { label: 'iPhone 6.1"', w: 1125, h: 2436 },
  // iPad 13" / 12.9" portrait + landscape
  { label: 'iPad 13" P', w: 2064, h: 2752 },
  { label: 'iPad 13" L', w: 2752, h: 2064 },
  { label: 'iPad 12.9" P', w: 2048, h: 2732 },
  { label: 'iPad 12.9" L', w: 2732, h: 2048 },
];

// ---------------------------------------------------------------------------
// Content config (loaded from /public/content/config.json) — runtime checked
// ---------------------------------------------------------------------------

interface ContentConfigShape {
  locales: LocaleDefinition[];
  activeLocale?: string;
  slides: SlideConfig[];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validateContentConfig(raw: unknown): ContentConfigShape {
  if (!isObject(raw)) {
    throw new Error("content/config.json must be a JSON object.");
  }
  const { locales, slides, activeLocale } = raw;
  if (!Array.isArray(locales) || locales.length === 0) {
    throw new Error("content/config.json: `locales` must be a non-empty array.");
  }
  for (const loc of locales) {
    if (!isObject(loc) || typeof loc.code !== "string" || typeof loc.name !== "string") {
      throw new Error("content/config.json: each locale needs `code` and `name` strings.");
    }
  }
  if (!Array.isArray(slides) || slides.length === 0) {
    throw new Error("content/config.json: `slides` must be a non-empty array.");
  }
  for (const slide of slides) {
    if (
      !isObject(slide) ||
      typeof slide.id !== "string" ||
      typeof slide.slug !== "string" ||
      typeof slide.templateId !== "string" ||
      !isObject(slide.content) ||
      !isObject(slide.images)
    ) {
      throw new Error(
        `content/config.json: slide ${(slide as { id?: unknown })?.id ?? "?"} is missing required fields.`,
      );
    }
  }
  if (activeLocale !== undefined && typeof activeLocale !== "string") {
    throw new Error("content/config.json: `activeLocale` must be a string if present.");
  }
  return raw as unknown as ContentConfigShape;
}

const CONTENT = validateContentConfig(contentConfig);

const initialLocale =
  CONTENT.activeLocale && CONTENT.locales.some((l) => l.code === CONTENT.activeLocale)
    ? CONTENT.activeLocale
    : CONTENT.locales[0].code;

export const DEFAULT_CONFIG: ScreenshotConfig = {
  theme: { ...SYSTEM_THEME },
  typography: { ...SYSTEM_TYPOGRAPHY },
  locales: CONTENT.locales,
  activeLocale: initialLocale,
  slides: CONTENT.slides,
  activeSlideIndex: 0,
  mockups: SYSTEM_MOCKUPS.map((m) => ({ ...m })),
  activeMockupId: SYSTEM_MOCKUPS[0].id,
  sizes: [...SYSTEM_SIZES],
  activeSizeIndex: 0,
  canvasWidth: SYSTEM_SIZES[0].w,
  canvasHeight: SYSTEM_SIZES[0].h,
};

// REQUIREMENT: All static image paths that need preloading for export
export function collectImagePaths(config: ScreenshotConfig): string[] {
  const paths = new Set<string>();
  for (const mockup of config.mockups) {
    if (!mockup.src.startsWith("data:")) paths.add(resolveAssetPath(mockup.src));
  }
  for (const slide of config.slides) {
    for (const images of Object.values(slide.images)) {
      if (images.primary && !images.primary.startsWith("data:"))
        paths.add(resolveAssetPath(images.primary));
      if (images.secondary && !images.secondary.startsWith("data:"))
        paths.add(resolveAssetPath(images.secondary));
    }
  }
  return Array.from(paths);
}
