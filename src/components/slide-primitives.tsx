"use client";

import type { CSSProperties, ReactNode } from "react";
import type { MockupDefinition, ThemeConfig, TypographyConfig } from "@/lib/types";
import { resolveAssetPath } from "@/lib/path-utils";

// REQUIREMENT: Shared image cache for preloaded static assets
export const imageCache: Record<string, string> = {};

export function img(path: string) {
  const resolved = resolveAssetPath(path);
  return imageCache[resolved] || imageCache[path] || resolved;
}

export function SlideCanvas({
  children,
  background,
  width,
  height,
  fontFamily,
}: {
  children: ReactNode;
  background: string;
  width: number;
  height: number;
  fontFamily: string;
}) {
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        background,
        fontFamily,
      }}
    >
      {children}
    </div>
  );
}

export function ChipRow({
  items,
  tone,
  theme,
  typography,
  style,
}: {
  items: string[];
  tone: "dark" | "light";
  theme: ThemeConfig;
  typography: TypographyConfig;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        maxWidth: 470,
        ...style,
      }}
    >
      {items.map((item) => (
        <div
          key={item}
          style={{
            borderRadius: 999,
            border:
              tone === "light"
                ? `1px solid ${theme.lineDark}`
                : `1px solid ${theme.line}`,
            background:
              tone === "light"
                ? "rgba(255, 255, 255, 0.68)"
                : "rgba(255, 255, 255, 0.06)",
            color: tone === "light" ? theme.textDark : theme.text,
            fontSize: typography.chipSize,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            padding: "18px 28px",
            backdropFilter: "blur(20px)",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

export function Phone({
  mockup,
  screenshotSrc,
  alt,
  style,
}: {
  mockup: MockupDefinition;
  screenshotSrc: string;
  alt: string;
  style?: CSSProperties;
}) {
  const sa = mockup.screenArea;
  return (
    <div
      style={{
        position: "absolute",
        aspectRatio: mockup.aspectRatio,
        filter: "drop-shadow(0 42px 110px rgba(0, 0, 0, 0.5))",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          overflow: "hidden",
          left: `${sa.leftPct}%`,
          top: `${sa.topPct}%`,
          width: `${sa.widthPct}%`,
          height: `${sa.heightPct}%`,
          borderRadius: `${sa.borderRadiusXPct}% / ${sa.borderRadiusYPct}%`,
        }}
      >
        <img
          src={screenshotSrc}
          alt={alt}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top",
          }}
        />
      </div>
      <img
        src={img(mockup.src)}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export function Caption({
  eyebrow,
  title,
  body,
  tone,
  theme,
  typography,
  style,
}: {
  eyebrow: string;
  title: string[];
  body: string;
  tone: "dark" | "light";
  theme: ThemeConfig;
  typography: TypographyConfig;
  style?: CSSProperties;
}) {
  const fg = tone === "light" ? theme.textDark : theme.text;
  const muted = tone === "light" ? theme.mutedDark : theme.muted;

  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        gap: 48,
        width: 700,
        ...style,
      }}
    >
      <div
        style={{
          color: theme.accentBright,
          fontSize: typography.eyebrowSize,
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          color: fg,
          fontSize: typography.titleSize,
          lineHeight: 1.0,
          fontWeight: 600,
          letterSpacing: "-0.04em",
          textWrap: "balance",
        }}
      >
        {title.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <p
        style={{
          margin: 0,
          color: muted,
          fontSize: typography.bodySize,
          lineHeight: 1.38,
          letterSpacing: "-0.03em",
          textWrap: "balance",
        }}
      >
        {body}
      </p>
    </div>
  );
}
