"use client";

import { useEffect, useRef, useState } from "react";
import { useConfig } from "@/lib/config-context";
import { renderTemplate } from "@/lib/templates";
import { img } from "@/components/slide-primitives";

function useElementWidth<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    setWidth(node.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

export function SlidePreview() {
  const config = useConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(containerRef);
  const slide = config.slides[config.activeSlideIndex];
  const mockup = config.mockups.find((m) => m.id === config.activeMockupId) ?? config.mockups[0];
  const activeSize = config.sizes[config.activeSizeIndex] ?? config.sizes[0];
  const cW = activeSize.w;
  const cH = activeSize.h;

  if (!slide || !mockup) return null;

  const content = slide.content[config.activeLocale] ?? {
    menuLabel: "01",
    eyebrow: "Preview",
    title: ["Title"],
    body: "Body text",
    chips: [],
  };
  const images = slide.images[config.activeLocale] ?? { primary: "" };

  const resolvedImages = {
    primary: img(images.primary),
    secondary: images.secondary ? img(images.secondary) : undefined,
  };

  const maxH = 500;
  const rawScale = width ? (width - 24) / cW : 0.2;
  const scale = Math.min(rawScale, maxH / cH);
  const previewH = cH * scale;

  // BUGFIX: The canvas is 1320px wide; using position:absolute prevents it from
  // expanding parent layout. The outer div uses padding-bottom for aspect ratio.
  const previewW = cW * scale;

  return (
    <div ref={containerRef} data-testid="slide-preview" style={{ width: "100%" }}>
      <div
        style={{
          width: "100%",
          height: previewH,
          overflow: "hidden",
          borderRadius: 14,
          background: "#050807",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: cW,
            height: cH,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          {renderTemplate(slide.templateId, {
            copy: content,
            images: resolvedImages,
            mockup,
            theme: config.theme,
            typography: config.typography,
            canvasWidth: cW,
            canvasHeight: cH,
          })}
        </div>
      </div>
    </div>
  );
}

// REQUIREMENT: Thumbnail cards for the slide strip at the bottom
export function PreviewCard({
  slideIndex,
  selected,
  onSelect,
}: {
  slideIndex: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const config = useConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(containerRef);
  const slide = config.slides[slideIndex];
  const mockup = config.mockups.find((m) => m.id === config.activeMockupId) ?? config.mockups[0];
  const activeSize = config.sizes[config.activeSizeIndex] ?? config.sizes[0];
  const cW = activeSize.w;
  const cH = activeSize.h;

  if (!slide || !mockup) return null;

  const content = slide.content[config.activeLocale] ?? {
    menuLabel: String(slideIndex + 1).padStart(2, "0"),
    eyebrow: "Slide",
    title: ["Title"],
    body: "",
    chips: [],
  };
  const images = slide.images[config.activeLocale] ?? { primary: "" };
  const resolvedImages = {
    primary: img(images.primary),
    secondary: images.secondary ? img(images.secondary) : undefined,
  };

  const maxPreviewHeight = 260;
  const rawScale = width ? Math.min(1, (width - 16) / cW) : 0.2;
  const scale = Math.min(rawScale, maxPreviewHeight / cH);
  const previewHeight = cH * scale;

  const locale = config.locales.find((l) => l.code === config.activeLocale);

  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`preview-card-${slideIndex}`}
      style={{
        borderRadius: 14,
        padding: 8,
        border: selected
          ? "1px solid rgba(52, 211, 153, 0.62)"
          : "1px solid rgba(255, 255, 255, 0.08)",
        background: selected
          ? "rgba(16, 185, 129, 0.08)"
          : "rgba(255, 255, 255, 0.04)",
        boxShadow: selected
          ? "0 14px 36px rgba(16, 185, 129, 0.12)"
          : "0 8px 24px rgba(0, 0, 0, 0.14)",
        textAlign: "left",
        color: "inherit",
        cursor: "pointer",
        minWidth: 130,
        maxWidth: 160,
        flex: "0 0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          padding: "2px 4px 6px",
        }}
      >
        <div>
          <div
            style={{
              color: "#9EB1A8",
              fontSize: 9,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            {content.menuLabel}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.03em" }}>
            {content.eyebrow}
          </div>
        </div>
        <div
          style={{
            borderRadius: 999,
            padding: "3px 6px",
            background: "rgba(255, 255, 255, 0.06)",
            fontSize: 9,
            color: "#9EB1A8",
          }}
        >
          {locale?.name ?? config.activeLocale}
        </div>
      </div>
      <div ref={containerRef} style={{ width: "100%" }}>
        <div
          style={{
            height: previewHeight,
            overflow: "hidden",
            borderRadius: 10,
            background: "#050807",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: cW,
              height: cH,
              transform: `translateX(-50%) scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            {renderTemplate(slide.templateId, {
              copy: content,
              images: resolvedImages,
              mockup,
              theme: config.theme,
              typography: config.typography,
              canvasWidth: cW,
              canvasHeight: cH,
            })}
          </div>
        </div>
      </div>
    </button>
  );
}
