"use client";

import type { CSSProperties } from "react";
import type { MockupDefinition, TemplateDefinition, TemplateRenderProps } from "./types";
import {
  Caption,
  ChipRow,
  Phone,
  SlideCanvas,
  img,
} from "@/components/slide-primitives";

// REQUIREMENT: With a portrait iPad mockup (1150×1500), iPhone-targeted
// template positioning works directly on iPad portrait canvases — the mockup
// aspect now matches the canvas aspect, so width: 78% + bottom: -300 gives
// the same overflow aesthetic as iPhone. The only case that still needs
// adjustment is iPad LANDSCAPE canvas, where the portrait mockup at iPhone
// widths overflows the canvas height; there we scale down to fit and center.
//
// `variant` is reserved for future use (e.g. dual-phone variants on iPad
// landscape) and currently only the iPad-landscape branch is non-trivial.
function adaptIpadPhoneStyle(
  base: CSSProperties,
  mockup: MockupDefinition,
  canvasWidth: number,
  canvasHeight: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _opts: { variant?: "stack-top" | "stack-bottom" } = {},
): CSSProperties {
  if (!mockup.id.startsWith("ipad")) return base;
  const isPortrait = canvasHeight > canvasWidth;
  if (isPortrait) return base;

  // iPad landscape canvas with portrait mockup: scale phone width so its
  // height roughly matches canvas height, then center.
  return {
    ...base,
    width: "48%",
    left: "50%",
    right: undefined,
    top: undefined,
    transform: "translateX(-50%)",
    bottom: 0,
  };
}

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "center-stage",
    name: "Center Stage",
    description: "Phone centered at bottom, caption centered above",
    phoneCount: 1,
    defaultTone: "dark",
  },
  {
    id: "dual-showcase",
    name: "Dual Showcase",
    description: "Two phones staggered left-right, caption centered above",
    phoneCount: 2,
    defaultTone: "dark",
  },
  {
    id: "right-caption",
    name: "Right Caption",
    description: "Phone offset left, caption right-aligned",
    phoneCount: 1,
    defaultTone: "dark",
  },
  {
    id: "left-caption",
    name: "Left Caption",
    description: "Phone offset right, caption left-aligned",
    phoneCount: 1,
    defaultTone: "dark",
  },
  {
    id: "light-right",
    name: "Light Right",
    description: "Light pastel background, phone left, caption right",
    phoneCount: 1,
    defaultTone: "light",
  },
  {
    id: "split-vertical",
    name: "Split Screen",
    description: "Left accent panel with text, right side shows phone on dark",
    phoneCount: 1,
    defaultTone: "dark",
  },
  {
    id: "gradient-overlay",
    name: "Gradient Overlay",
    description: "Large phone bottom-center, gradient overlay with text on top",
    phoneCount: 1,
    defaultTone: "dark",
  },
  {
    id: "minimal-float",
    name: "Minimal Float",
    description: "Smaller phone centered, text above, maximum breathing room",
    phoneCount: 1,
    defaultTone: "dark",
  },
  {
    id: "bold-type",
    name: "Bold Typography",
    description: "Oversized title fills top two-thirds, small phone bottom-right",
    phoneCount: 1,
    defaultTone: "dark",
  },
  {
    id: "glass-card",
    name: "Glass Card",
    description: "Frosted glass card with text, phone offset right",
    phoneCount: 1,
    defaultTone: "dark",
  },
  {
    id: "top-phone",
    name: "Top Phone",
    description: "Phone at top-center, caption below it",
    phoneCount: 1,
    defaultTone: "dark",
  },
  {
    id: "angled-duo",
    name: "Angled Duo",
    description: "Two phones slightly rotated, text centered between them",
    phoneCount: 2,
    defaultTone: "dark",
  },
  {
    id: "light-bold-left",
    name: "Light Bold Left",
    description: "Light blue bg, oversized italic title left, phone overlapping from right",
    phoneCount: 1,
    defaultTone: "light",
  },
  {
    id: "feature-steps",
    name: "Feature Steps",
    description: "Light blue bg, phone left, vertical feature icons with arrows on right",
    phoneCount: 1,
    defaultTone: "light",
  },
];

export const TEMPLATE_MAP: Record<string, TemplateDefinition> = {};
for (const t of TEMPLATES) TEMPLATE_MAP[t.id] = t;

// ---------------------------------------------------------------------------
// Template components
// ---------------------------------------------------------------------------

function CenterStage({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`radial-gradient(circle at 50% 0%, ${theme.accentSoft}, transparent 40%), linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      <Caption
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        tone="dark"
        theme={theme}
        typography={typography}
        style={{ top: 160, left: 0, right: 0, width: "100%", alignItems: "center", textAlign: "center" }}
      />
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "82%", left: "50%", bottom: -320, transform: "translateX(-50%)" }, mockup, canvasWidth, canvasHeight)}
      />
    </SlideCanvas>
  );
}

function DualShowcase({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`radial-gradient(circle at 50% 0%, ${theme.accentSoft}, transparent 40%), linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      <Caption
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        tone="dark"
        theme={theme}
        typography={typography}
        style={{ top: 160, left: 0, right: 0, width: "100%", alignItems: "center", textAlign: "center" }}
      />
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "78%", left: -20, bottom: -300, zIndex: 1 }, mockup, canvasWidth, canvasHeight, { variant: "stack-top" })}
      />
      {images.secondary && (
        <Phone
          mockup={mockup}
          screenshotSrc={img(images.secondary)}
          alt={copy.eyebrow}
          style={adaptIpadPhoneStyle({ width: "78%", right: -190, bottom: -300, zIndex: 2 }, mockup, canvasWidth, canvasHeight, { variant: "stack-bottom" })}
        />
      )}
    </SlideCanvas>
  );
}

function RightCaption({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`radial-gradient(circle at 20% 50%, ${theme.accentSoft}, transparent 40%), linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      <Caption
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        tone="dark"
        theme={theme}
        typography={typography}
        style={{ top: 260, right: 96, width: 700, alignItems: "flex-end", textAlign: "right" }}
      />
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "78%", left: -60, bottom: -300 }, mockup, canvasWidth, canvasHeight)}
      />
    </SlideCanvas>
  );
}

function LeftCaption({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`radial-gradient(circle at 75% 35%, ${theme.accentSoft}, transparent 40%), linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      <Caption
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        tone="dark"
        theme={theme}
        typography={typography}
        style={{ top: 260, left: 96, width: 700 }}
      />
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "78%", right: -60, bottom: -300 }, mockup, canvasWidth, canvasHeight)}
      />
    </SlideCanvas>
  );
}

function LightRight({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`radial-gradient(circle at 25% 50%, rgba(16, 185, 129, 0.10), transparent 40%), linear-gradient(180deg, #F6FBF8 0%, #EAF4EE 58%, #E3EEE8 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      <Caption
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        tone="light"
        theme={theme}
        typography={typography}
        style={{ top: 260, right: 96, width: 700, alignItems: "flex-end", textAlign: "right" }}
      />
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "78%", left: -60, bottom: -300 }, mockup, canvasWidth, canvasHeight)}
      />
    </SlideCanvas>
  );
}

function SplitVertical({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  const half = canvasWidth / 2;
  return (
    <SlideCanvas
      background={theme.bgBottom}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      {/* Left accent panel */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: half,
          height: canvasHeight,
          background: `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accentBright} 100%)`,
        }}
      />
      <Caption
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        tone="dark"
        theme={{ ...theme, text: "#FFFFFF", muted: "rgba(255,255,255,0.7)", accentBright: "#FFFFFF" }}
        typography={typography}
        style={{ top: 260, left: 80, width: half - 160 }}
      />
      <ChipRow
        items={copy.chips}
        tone="dark"
        theme={{ ...theme, line: "rgba(255,255,255,0.2)", text: "#FFFFFF" }}
        typography={typography}
        style={{ left: 80, bottom: 300 }}
      />
      {/* Right dark half with phone */}
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "68%", left: half + 40, bottom: -200 }, mockup, canvasWidth, canvasHeight)}
      />
    </SlideCanvas>
  );
}

function GradientOverlay({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`linear-gradient(180deg, ${theme.bgBottom} 0%, ${theme.bgTop} 40%, ${theme.bgBottom} 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      {/* Large phone behind the gradient */}
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "90%", left: "50%", bottom: -180, transform: "translateX(-50%)", opacity: 0.65 }, mockup, canvasWidth, canvasHeight)}
      />
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(2,5,4,0.95) 0%, rgba(2,5,4,0.6) 35%, transparent 55%, rgba(2,5,4,0.85) 100%)`,
          zIndex: 3,
        }}
      />
      <div style={{ position: "absolute", zIndex: 4, top: 180, left: 0, right: 0 }}>
        <Caption
          eyebrow={copy.eyebrow}
          title={copy.title}
          body={copy.body}
          tone="dark"
          theme={theme}
          typography={typography}
          style={{ position: "relative", width: "100%", alignItems: "center", textAlign: "center" }}
        />
      </div>
    </SlideCanvas>
  );
}

function MinimalFloat({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      <Caption
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        tone="dark"
        theme={theme}
        typography={{ ...typography, titleSize: typography.titleSize * 0.85 }}
        style={{ top: 200, left: 0, right: 0, width: "100%", alignItems: "center", textAlign: "center" }}
      />
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={{
          width: "58%",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -30%)",
          filter: "drop-shadow(0 60px 140px rgba(16, 185, 129, 0.18))",
        }}
      />
      <ChipRow
        items={copy.chips}
        tone="dark"
        theme={theme}
        typography={typography}
        style={{ bottom: 180, left: "50%", transform: "translateX(-50%)", justifyContent: "center" }}
      />
    </SlideCanvas>
  );
}

function BoldType({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      {/* Oversized title */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 80,
          right: 80,
          color: theme.text,
          fontSize: typography.titleSize * 1.5,
          lineHeight: 0.92,
          fontWeight: 800,
          letterSpacing: "-0.06em",
          textWrap: "balance",
        }}
      >
        {copy.title.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      {/* Eyebrow below title */}
      <div
        style={{
          position: "absolute",
          top: 160 + copy.title.length * typography.titleSize * 1.5 * 0.92 + 60,
          left: 80,
          color: theme.accentBright,
          fontSize: typography.eyebrowSize,
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {copy.eyebrow}
      </div>
      {/* Small phone bottom-right */}
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "52%", right: -20, bottom: -160 }, mockup, canvasWidth, canvasHeight)}
      />
      {/* Body text bottom-left */}
      <p
        style={{
          position: "absolute",
          left: 80,
          bottom: 220,
          width: 500,
          margin: 0,
          color: theme.muted,
          fontSize: typography.bodySize,
          lineHeight: 1.38,
          letterSpacing: "-0.03em",
        }}
      >
        {copy.body}
      </p>
    </SlideCanvas>
  );
}

function GlassCard({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`radial-gradient(circle at 30% 40%, ${theme.accentSoft}, transparent 50%), linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      {/* Frosted glass card */}
      <div
        style={{
          position: "absolute",
          top: 220,
          left: 80,
          width: 580,
          borderRadius: 48,
          padding: 64,
          background: "rgba(255, 255, 255, 0.06)",
          border: `1px solid ${theme.line}`,
          backdropFilter: "blur(24px)",
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.3)",
          zIndex: 3,
        }}
      >
        <div
          style={{
            color: theme.accentBright,
            fontSize: typography.eyebrowSize,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          {copy.eyebrow}
        </div>
        <div
          style={{
            color: theme.text,
            fontSize: typography.titleSize * 0.75,
            lineHeight: 1.0,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            marginBottom: 36,
          }}
        >
          {copy.title.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <p
          style={{
            margin: 0,
            color: theme.muted,
            fontSize: typography.bodySize * 0.9,
            lineHeight: 1.38,
            letterSpacing: "-0.03em",
          }}
        >
          {copy.body}
        </p>
      </div>
      {/* Phone offset right */}
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "72%", right: -80, bottom: -240 }, mockup, canvasWidth, canvasHeight)}
      />
    </SlideCanvas>
  );
}

function TopPhone({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`radial-gradient(circle at 50% 20%, ${theme.accentSoft}, transparent 40%), linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      {/* Phone at top */}
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={{ width: "65%", left: "50%", top: -60, transform: "translateX(-50%)" }}
      />
      {/* Caption below phone */}
      <Caption
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        tone="dark"
        theme={theme}
        typography={{ ...typography, titleSize: typography.titleSize * 0.8 }}
        style={{
          bottom: 320,
          left: 0,
          right: 0,
          width: "100%",
          alignItems: "center",
          textAlign: "center",
        }}
      />
      <ChipRow
        items={copy.chips}
        tone="dark"
        theme={theme}
        typography={typography}
        style={{ bottom: 180, left: "50%", transform: "translateX(-50%)", justifyContent: "center" }}
      />
    </SlideCanvas>
  );
}

function AngledDuo({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background={`radial-gradient(circle at 50% 50%, ${theme.accentSoft}, transparent 45%), linear-gradient(180deg, ${theme.bgTop} 0%, ${theme.bgBottom} 100%)`}
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      {/* Title at top center */}
      <div
        style={{
          position: "absolute",
          top: 180,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: theme.accentBright,
            fontSize: typography.eyebrowSize,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          {copy.eyebrow}
        </div>
        <div
          style={{
            color: theme.text,
            fontSize: typography.titleSize * 0.9,
            lineHeight: 1.0,
            fontWeight: 600,
            letterSpacing: "-0.04em",
          }}
        >
          {copy.title.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
      {/* Left phone, slight rotation */}
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "62%", left: -40, bottom: -120, transform: "rotate(-6deg)", zIndex: 1 }, mockup, canvasWidth, canvasHeight, { variant: "stack-top" })}
      />
      {/* Right phone, opposite rotation */}
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.secondary || images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({ width: "62%", right: -40, bottom: -120, transform: "rotate(6deg)", zIndex: 2 }, mockup, canvasWidth, canvasHeight, { variant: "stack-bottom" })}
      />
      {/* Body text at bottom center, above phones */}
      <p
        style={{
          position: "absolute",
          bottom: 180,
          left: 0,
          right: 0,
          textAlign: "center",
          margin: 0,
          color: theme.muted,
          fontSize: typography.bodySize * 0.85,
          lineHeight: 1.38,
          letterSpacing: "-0.03em",
          zIndex: 3,
          padding: "0 120px",
        }}
      >
        {copy.body}
      </p>
    </SlideCanvas>
  );
}

// UX: Light blue background with oversized italic bold title on the left,
// phone overlapping from center-right. Inspired by bold App Store hero layouts.
function LightBoldLeft({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  return (
    <SlideCanvas
      background="linear-gradient(165deg, #E0F4FF 0%, #B8E8FF 35%, #D4F0FF 100%)"
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      {/* Oversized italic bold title on the left */}
      <div
        style={{
          position: "absolute",
          top: 180,
          left: 80,
          width: canvasWidth * 0.52,
          zIndex: 1,
        }}
      >
        <div
          style={{
            color: theme.accent,
            fontSize: typography.eyebrowSize * 0.9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 32,
            opacity: 0.7,
          }}
        >
          {copy.eyebrow}
        </div>
        <div
          style={{
            color: "#1a2a4a",
            fontSize: typography.titleSize * 1.15,
            lineHeight: 0.95,
            fontWeight: 800,
            fontStyle: "italic",
            letterSpacing: "-0.04em",
          }}
        >
          {copy.title.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <p
          style={{
            margin: "40px 0 0",
            color: "#4a6a8a",
            fontSize: typography.bodySize * 0.85,
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            maxWidth: 500,
          }}
        >
          {copy.body}
        </p>
      </div>

      {/* Chips bottom-left */}
      {copy.chips.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 200,
            left: 80,
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            zIndex: 2,
          }}
        >
          {copy.chips.map((chip) => (
            <div
              key={chip}
              style={{
                borderRadius: 999,
                padding: "14px 24px",
                background: "rgba(255, 255, 255, 0.7)",
                border: "1px solid rgba(26, 42, 74, 0.08)",
                color: "#1a2a4a",
                fontSize: typography.chipSize * 0.9,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                backdropFilter: "blur(12px)",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      )}

      {/* Phone overlapping from center-right */}
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({
          width: "76%",
          right: -120,
          bottom: -260,
          zIndex: 3,
          filter: "drop-shadow(0 50px 100px rgba(0, 40, 80, 0.25))",
        }, mockup, canvasWidth, canvasHeight)}
      />
    </SlideCanvas>
  );
}

// UX: Light blue background with phone on the left, vertical feature step icons
// with chevron arrows on the right. Each chip becomes a labeled feature step.
function FeatureSteps({ copy, images, mockup, theme, typography, canvasWidth, canvasHeight }: TemplateRenderProps) {
  // Use chips as feature step labels; fall back to generic labels
  const steps = copy.chips.length > 0 ? copy.chips : ["Step 1", "Step 2", "Step 3"];

  // Simple geometric icon paths for variety (camera, AI badge, chat bubble)
  const iconPaths = [
    // Camera/scan icon
    <g key="cam">
      <rect x="6" y="10" width="36" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="24" cy="23" r="7" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M17 10L20 5h8l3 5" fill="none" stroke="currentColor" strokeWidth="3" />
    </g>,
    // AI / sparkle badge
    <g key="ai">
      <rect x="8" y="8" width="32" height="32" rx="6" fill="none" stroke="currentColor" strokeWidth="3" />
      <text x="24" y="30" textAnchor="middle" fontSize="18" fontWeight="800" fill="currentColor">AI</text>
    </g>,
    // Chat / info bubble
    <g key="chat">
      <path d="M10 10h22a4 4 0 014 4v12a4 4 0 01-4 4H18l-6 6v-6h-2a4 4 0 01-4-4V14a4 4 0 014-4z" fill="none" stroke="currentColor" strokeWidth="3" />
    </g>,
  ];

  return (
    <SlideCanvas
      background="linear-gradient(170deg, #D8F0FF 0%, #C2E8FF 40%, #E4F4FF 100%)"
      width={canvasWidth}
      height={canvasHeight}
      fontFamily={typography.fontFamily}
    >
      {/* Caption at top spanning full width */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            color: theme.accent,
            fontSize: typography.eyebrowSize * 0.85,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 24,
            opacity: 0.7,
          }}
        >
          {copy.eyebrow}
        </div>
        <div
          style={{
            color: "#1a2a4a",
            fontSize: typography.titleSize * 0.72,
            lineHeight: 1.0,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            padding: "0 80px",
          }}
        >
          {copy.title.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>

      {/* Phone on the left, mid-height */}
      <Phone
        mockup={mockup}
        screenshotSrc={img(images.primary)}
        alt={copy.eyebrow}
        style={adaptIpadPhoneStyle({
          width: "62%",
          left: -30,
          bottom: -180,
          zIndex: 1,
          filter: "drop-shadow(0 40px 80px rgba(0, 40, 80, 0.2))",
        }, mockup, canvasWidth, canvasHeight)}
      />

      {/* Vertical feature steps on the right */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: "50%",
          transform: "translateY(-10%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          zIndex: 2,
        }}
      >
        {steps.map((label, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Icon circle */}
            <div
              style={{
                width: 130,
                height: 130,
                borderRadius: 32,
                background: "rgba(255, 255, 255, 0.65)",
                border: "1px solid rgba(80, 140, 200, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(12px)",
                boxShadow: "0 12px 40px rgba(0, 60, 120, 0.08)",
                color: theme.accent,
              }}
            >
              <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
                {iconPaths[i % iconPaths.length]}
              </svg>
            </div>
            {/* Label under icon */}
            <div
              style={{
                marginTop: 12,
                color: "#1a2a4a",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                textAlign: "center",
              }}
            >
              {label}
            </div>
            {/* Chevron arrow between steps (skip after last) */}
            {i < steps.length - 1 && (
              <div
                style={{
                  margin: "18px 0",
                  color: "rgba(80, 140, 200, 0.4)",
                  fontSize: 36,
                  lineHeight: 1,
                }}
              >
                &#x276F;&#x276F;
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Body text bottom-center */}
      <p
        style={{
          position: "absolute",
          bottom: 160,
          left: 0,
          right: 0,
          textAlign: "center",
          margin: 0,
          color: "#5a7a9a",
          fontSize: typography.bodySize * 0.8,
          lineHeight: 1.4,
          letterSpacing: "-0.02em",
          padding: "0 120px",
          zIndex: 2,
        }}
      >
        {copy.body}
      </p>
    </SlideCanvas>
  );
}

// ---------------------------------------------------------------------------
// Render dispatch
// ---------------------------------------------------------------------------

const RENDERERS: Record<string, (props: TemplateRenderProps) => React.JSX.Element> = {
  "center-stage": CenterStage,
  "dual-showcase": DualShowcase,
  "right-caption": RightCaption,
  "left-caption": LeftCaption,
  "light-right": LightRight,
  "split-vertical": SplitVertical,
  "gradient-overlay": GradientOverlay,
  "minimal-float": MinimalFloat,
  "bold-type": BoldType,
  "glass-card": GlassCard,
  "top-phone": TopPhone,
  "angled-duo": AngledDuo,
  "light-bold-left": LightBoldLeft,
  "feature-steps": FeatureSteps,
};

export function renderTemplate(templateId: string, props: TemplateRenderProps) {
  const Renderer = RENDERERS[templateId];
  if (!Renderer) return RENDERERS["center-stage"](props);
  return Renderer(props);
}
