"use client";

import {
  type Dispatch,
  type ReactNode,
  createContext,
  useContext,
  useReducer,
} from "react";
import type {
  LocaleDefinition,
  MockupDefinition,
  ScreenshotConfig,
  SizePreset,
  SlideContent,
  ThemeConfig,
  TypographyConfig,
} from "./types";
import { DEFAULT_CONFIG } from "./defaults";

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type ConfigAction =
  | { type: "SET_THEME_COLOR"; key: keyof ThemeConfig; value: string }
  | { type: "SET_TYPOGRAPHY"; key: keyof TypographyConfig; value: string | number }
  | { type: "SET_SLIDE_CONTENT"; slideIndex: number; locale: string; field: keyof SlideContent; value: string | string[] }
  | { type: "SET_SLIDE_TEMPLATE"; slideIndex: number; templateId: string }
  | { type: "SET_SLIDE_IMAGE"; slideIndex: number; locale: string; imageKey: "primary" | "secondary"; dataUrl: string }
  | { type: "SET_SLIDE_ID"; slideIndex: number; id: string }
  | { type: "SET_SLIDE_SLUG"; slideIndex: number; slug: string }
  | { type: "ADD_SLIDE"; templateId: string }
  | { type: "REMOVE_SLIDE"; index: number }
  | { type: "REORDER_SLIDE"; fromIndex: number; toIndex: number }
  | { type: "SET_ACTIVE_SLIDE"; index: number }
  | { type: "ADD_LOCALE"; locale: LocaleDefinition }
  | { type: "REMOVE_LOCALE"; code: string }
  | { type: "SET_ACTIVE_LOCALE"; code: string }
  | { type: "SET_ACTIVE_MOCKUP"; id: string }
  | { type: "ADD_CUSTOM_MOCKUP"; mockup: MockupDefinition }
  | { type: "SET_ACTIVE_SIZE"; index: number }
  | { type: "ADD_SIZE_PRESET"; preset: SizePreset }
  | { type: "REMOVE_SIZE_PRESET"; index: number }
  | { type: "UPDATE_SIZE_PRESET"; index: number; preset: SizePreset }
  | { type: "IMPORT_CONFIG"; config: ScreenshotConfig };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function configReducer(state: ScreenshotConfig, action: ConfigAction): ScreenshotConfig {
  switch (action.type) {
    case "SET_THEME_COLOR":
      return { ...state, theme: { ...state.theme, [action.key]: action.value } };

    case "SET_TYPOGRAPHY":
      return { ...state, typography: { ...state.typography, [action.key]: action.value } };

    case "SET_SLIDE_CONTENT": {
      const slides = [...state.slides];
      const slide = { ...slides[action.slideIndex] };
      slide.content = { ...slide.content };
      slide.content[action.locale] = {
        ...slide.content[action.locale],
        [action.field]: action.value,
      };
      slides[action.slideIndex] = slide;
      return { ...state, slides };
    }

    case "SET_SLIDE_TEMPLATE": {
      const slides = [...state.slides];
      slides[action.slideIndex] = { ...slides[action.slideIndex], templateId: action.templateId };
      return { ...state, slides };
    }

    case "SET_SLIDE_IMAGE": {
      const slides = [...state.slides];
      const slide = { ...slides[action.slideIndex] };
      slide.images = { ...slide.images };
      slide.images[action.locale] = {
        ...slide.images[action.locale],
        [action.imageKey]: action.dataUrl,
      };
      slides[action.slideIndex] = slide;
      return { ...state, slides };
    }

    case "SET_SLIDE_ID": {
      const slides = [...state.slides];
      slides[action.slideIndex] = { ...slides[action.slideIndex], id: action.id };
      return { ...state, slides };
    }

    case "SET_SLIDE_SLUG": {
      const slides = [...state.slides];
      slides[action.slideIndex] = { ...slides[action.slideIndex], slug: action.slug };
      return { ...state, slides };
    }

    case "ADD_SLIDE": {
      const emptyContent: Record<string, SlideContent> = {};
      const emptyImages: Record<string, { primary: string }> = {};
      for (const loc of state.locales) {
        emptyContent[loc.code] = {
          menuLabel: String(state.slides.length + 1).padStart(2, "0"),
          eyebrow: "New Slide",
          title: ["Title Line"],
          body: "Description text here.",
          chips: ["Tag 1", "Tag 2", "Tag 3"],
        };
        emptyImages[loc.code] = { primary: "" };
      }
      return {
        ...state,
        slides: [
          ...state.slides,
          {
            id: `slide-${Date.now()}`,
            slug: `new-slide-${state.slides.length + 1}`,
            templateId: action.templateId,
            content: emptyContent,
            images: emptyImages,
          },
        ],
      };
    }

    case "REMOVE_SLIDE": {
      if (state.slides.length <= 1) return state;
      const slides = state.slides.filter((_, i) => i !== action.index);
      const activeSlideIndex = Math.min(state.activeSlideIndex, slides.length - 1);
      return { ...state, slides, activeSlideIndex };
    }

    case "REORDER_SLIDE": {
      const slides = [...state.slides];
      const [moved] = slides.splice(action.fromIndex, 1);
      slides.splice(action.toIndex, 0, moved);
      let activeSlideIndex = state.activeSlideIndex;
      if (state.activeSlideIndex === action.fromIndex) {
        activeSlideIndex = action.toIndex;
      } else if (
        action.fromIndex < state.activeSlideIndex &&
        action.toIndex >= state.activeSlideIndex
      ) {
        activeSlideIndex--;
      } else if (
        action.fromIndex > state.activeSlideIndex &&
        action.toIndex <= state.activeSlideIndex
      ) {
        activeSlideIndex++;
      }
      return { ...state, slides, activeSlideIndex };
    }

    case "SET_ACTIVE_SLIDE":
      return { ...state, activeSlideIndex: action.index };

    case "ADD_LOCALE": {
      if (state.locales.some((l) => l.code === action.locale.code)) return state;
      const slides = state.slides.map((slide) => {
        const firstLocale = state.locales[0]?.code;
        const template = firstLocale ? slide.content[firstLocale] : undefined;
        return {
          ...slide,
          content: {
            ...slide.content,
            [action.locale.code]: template
              ? { ...template, menuLabel: template.menuLabel }
              : {
                  menuLabel: "01",
                  eyebrow: "Eyebrow",
                  title: ["Title"],
                  body: "Body",
                  chips: ["Tag"],
                },
          },
          images: {
            ...slide.images,
            [action.locale.code]: { primary: "" },
          },
        };
      });
      return {
        ...state,
        locales: [...state.locales, action.locale],
        slides,
      };
    }

    case "REMOVE_LOCALE": {
      if (state.locales.length <= 1) return state;
      const locales = state.locales.filter((l) => l.code !== action.code);
      const slides = state.slides.map((slide) => {
        const content = { ...slide.content };
        const images = { ...slide.images };
        delete content[action.code];
        delete images[action.code];
        return { ...slide, content, images };
      });
      const activeLocale =
        state.activeLocale === action.code ? locales[0].code : state.activeLocale;
      return { ...state, locales, slides, activeLocale };
    }

    case "SET_ACTIVE_LOCALE":
      return { ...state, activeLocale: action.code };

    case "SET_ACTIVE_MOCKUP":
      return { ...state, activeMockupId: action.id };

    case "ADD_CUSTOM_MOCKUP":
      return { ...state, mockups: [...state.mockups, action.mockup] };

    case "SET_ACTIVE_SIZE":
      return { ...state, activeSizeIndex: action.index };

    case "ADD_SIZE_PRESET":
      return { ...state, sizes: [...state.sizes, action.preset] };

    case "REMOVE_SIZE_PRESET": {
      if (state.sizes.length <= 1) return state;
      const sizes = state.sizes.filter((_, i) => i !== action.index);
      const activeSizeIndex = Math.min(state.activeSizeIndex, sizes.length - 1);
      return { ...state, sizes, activeSizeIndex };
    }

    case "UPDATE_SIZE_PRESET": {
      const sizes = [...state.sizes];
      sizes[action.index] = action.preset;
      return { ...state, sizes };
    }

    case "IMPORT_CONFIG":
      return { ...action.config };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ConfigStateCtx = createContext<ScreenshotConfig>(DEFAULT_CONFIG);
const ConfigDispatchCtx = createContext<Dispatch<ConfigAction>>(() => {});

export function ConfigProvider({ children, initial }: { children: ReactNode; initial?: ScreenshotConfig }) {
  const [state, dispatch] = useReducer(configReducer, initial ?? DEFAULT_CONFIG);
  return (
    <ConfigStateCtx.Provider value={state}>
      <ConfigDispatchCtx.Provider value={dispatch}>{children}</ConfigDispatchCtx.Provider>
    </ConfigStateCtx.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigStateCtx);
}

export function useConfigDispatch() {
  return useContext(ConfigDispatchCtx);
}
