// REQUIREMENT: All configurable state types for the screenshot visual editor

export interface ThemeConfig {
  accent: string;
  accentBright: string;
  accentSoft: string;
  accentPanel: string;
  text: string;
  textDark: string;
  muted: string;
  mutedDark: string;
  line: string;
  lineDark: string;
}

export interface TypographyConfig {
  titleSize: number;
  eyebrowSize: number;
  bodySize: number;
  chipSize: number;
  fontFamily: string;
}

export interface SlideContent {
  menuLabel: string;
  eyebrow: string;
  title: string[];
  body: string;
  chips: string[];
}

export interface SlideImages {
  primary: string;
  secondary?: string;
}

export interface SlideConfig {
  id: string;
  slug: string;
  templateId: string;
  content: Record<string, SlideContent>;
  images: Record<string, SlideImages>;
}

export interface LocaleDefinition {
  code: string;
  name: string;
}

export interface MockupScreenArea {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  borderRadiusXPct: number;
  borderRadiusYPct: number;
}

export interface MockupDefinition {
  id: string;
  label: string;
  exportSlug: string;
  src: string;
  aspectRatio: string;
  screenArea: MockupScreenArea;
}

export interface SizePreset {
  label: string;
  w: number;
  h: number;
}

export interface ScreenshotConfig {
  theme: ThemeConfig;
  typography: TypographyConfig;
  locales: LocaleDefinition[];
  activeLocale: string;
  slides: SlideConfig[];
  activeSlideIndex: number;
  mockups: MockupDefinition[];
  activeMockupId: string;
  sizes: SizePreset[];
  activeSizeIndex: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  phoneCount: 1 | 2;
  defaultTone: "dark" | "light";
}

export interface TemplateRenderProps {
  copy: SlideContent;
  images: SlideImages;
  mockup: MockupDefinition;
  theme: ThemeConfig;
  typography: TypographyConfig;
  canvasWidth: number;
  canvasHeight: number;
}
