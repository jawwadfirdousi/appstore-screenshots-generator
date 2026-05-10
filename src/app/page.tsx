"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ConfigProvider, useConfig, useConfigDispatch } from "@/lib/config-context";
import { DEFAULT_CONFIG, collectImagePaths } from "@/lib/defaults";
import { captureNode, downloadDataUrl, preloadImages, wait } from "@/lib/export";
import type { ScreenshotConfig } from "@/lib/types";
import { renderTemplate } from "@/lib/templates";
import { imageCache, img } from "@/components/slide-primitives";
import { EditorPanel } from "@/components/editor-panel";
import { SlidePreview, PreviewCard } from "@/components/preview";

// ---------------------------------------------------------------------------
// URL param helpers (preserves backward compat)
// ---------------------------------------------------------------------------

function resolveInitialConfig(): ScreenshotConfig {
  const config = structuredClone(DEFAULT_CONFIG);
  if (typeof window === "undefined") return config;

  const params = new URLSearchParams(window.location.search);
  const localeParam = params.get("locale");
  if (localeParam && config.locales.some((l) => l.code === localeParam)) {
    config.activeLocale = localeParam;
  }
  const mockupParam = params.get("mockup");
  if (mockupParam && config.mockups.some((m) => m.id === mockupParam)) {
    config.activeMockupId = mockupParam;
  }
  const sizeParam = params.get("size");
  if (sizeParam) {
    const idx = config.sizes.findIndex((s) => `${s.w}x${s.h}` === sizeParam);
    if (idx >= 0) config.activeSizeIndex = idx;
  }
  const slideParam = params.get("slide");
  if (slideParam) {
    const idx = config.slides.findIndex((s) => s.id === slideParam);
    if (idx >= 0) config.activeSlideIndex = idx;
  }
  // Ensure size matches the device class of the mockup (toolbar Device + Size
  // dropdowns assume they're paired). Stale bookmarked URLs from before this
  // pairing could otherwise leave the canvas rendering at a mismatched ratio.
  const mockupDevice = config.activeMockupId.startsWith("ipad") ? "ipad" : "iphone";
  const sizeLabel = config.sizes[config.activeSizeIndex]?.label.toLowerCase() ?? "";
  const sizeDevice = sizeLabel.startsWith("ipad") ? "ipad" : "iphone";
  if (mockupDevice !== sizeDevice) {
    const idx = config.sizes.findIndex((s) =>
      mockupDevice === "ipad"
        ? s.label.toLowerCase().startsWith("ipad")
        : s.label.toLowerCase().startsWith("iphone"),
    );
    if (idx >= 0) config.activeSizeIndex = idx;
  }
  return config;
}

// ---------------------------------------------------------------------------
// Main page component (thin orchestrator)
// ---------------------------------------------------------------------------

export default function ScreenshotsPage() {
  const initial = useMemo(resolveInitialConfig, []);
  return (
    <ConfigProvider initial={initial}>
      <ScreenshotsPageInner />
    </ConfigProvider>
  );
}

// ---------------------------------------------------------------------------
// Status type
// ---------------------------------------------------------------------------

type StatusState = { tone: "neutral" | "success" | "error"; message: string };

// ---------------------------------------------------------------------------
// Inner page (accesses config context)
// ---------------------------------------------------------------------------

function ScreenshotsPageInner() {
  const config = useConfig();
  const dispatch = useConfigDispatch();
  const [ready, setReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    tone: "neutral",
    message: "Inlining images for reliable exports...",
  });
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hydratedRef = useRef(false);

  const activeMockup = config.mockups.find((m) => m.id === config.activeMockupId) ?? config.mockups[0];
  const activeSize = config.sizes[config.activeSizeIndex] ?? config.sizes[0];
  // REQUIREMENT: Canvas dimensions match the active export size so templates
  // render at the correct aspect ratio for both iPhone and iPad
  const canvasW = activeSize.w;
  const canvasH = activeSize.h;

  // Device class derived from the active mockup id. Custom uploads default
  // to the iPhone class (their screen-area is built from iPhone dimensions).
  const activeDevice: DeviceClass = activeMockup.id.startsWith("ipad") ? "ipad" : "iphone";
  const sizesForActiveDevice = config.sizes
    .map((size, index) => ({ size, index }))
    .filter(({ size }) => deviceClassOfSizeLabel(size.label) === activeDevice);
  const activeSizeOption =
    sizesForActiveDevice.find((o) => o.index === config.activeSizeIndex) ??
    sizesForActiveDevice[0];

  function handleDeviceChange(device: DeviceClass) {
    if (device === activeDevice) return;
    const mockup = config.mockups.find((m) =>
      device === "ipad" ? m.id.startsWith("ipad") : !m.id.startsWith("ipad"),
    );
    if (mockup) dispatch({ type: "SET_ACTIVE_MOCKUP", id: mockup.id });
    const sizeIdx = config.sizes.findIndex(
      (s) => deviceClassOfSizeLabel(s.label) === device,
    );
    if (sizeIdx >= 0) dispatch({ type: "SET_ACTIVE_SIZE", index: sizeIdx });
  }

  // Preload all static images
  useEffect(() => {
    const paths = collectImagePaths(config);
    preloadImages(paths, imageCache)
      .then(() => {
        setReady(true);
        setStatus({ tone: "success", message: "Images inlined for export" });
      })
      .catch(() => {
        setStatus({ tone: "error", message: "Some assets did not preload. Check files and retry." });
      });
  }, [config]);

  // URL sync
  useEffect(() => { hydratedRef.current = true; }, []);
  useEffect(() => {
    if (!hydratedRef.current) return;
    const slide = config.slides[config.activeSlideIndex];
    const params = new URLSearchParams(window.location.search);
    params.set("locale", config.activeLocale);
    params.set("mockup", config.activeMockupId);
    params.set("size", `${activeSize.w}x${activeSize.h}`);
    if (slide) params.set("slide", slide.id);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [config.activeLocale, config.activeMockupId, config.activeSlideIndex, config.slides, activeSize]);

  // REQUIREMENT: Export pipeline preserved from original implementation
  async function exportJobs(jobs: { locale: string; slideIndex: number }[], doneMessage: string) {
    try {
      setExporting(true);
      for (const job of jobs) {
        const slide = config.slides[job.slideIndex];
        if (!slide) continue;
        const ref = exportRefs.current[`${job.locale}:${job.slideIndex}`];
        if (!ref) throw new Error("Missing export node.");
        const png = await captureNode(
          ref,
          canvasW,
          canvasH,
          activeSize.w,
          activeSize.h,
        );
        const indexLabel = String(job.slideIndex + 1).padStart(2, "0");
        const fileName =
          `${indexLabel}-${slide.slug}-${job.locale}-iphone-` +
          `${activeMockup.exportSlug}-${activeSize.w}x${activeSize.h}.png`;
        downloadDataUrl(png, fileName);
        await wait(300);
      }
      setStatus({ tone: "success", message: doneMessage });
    } catch {
      setStatus({ tone: "error", message: "Export failed. Check console and try again." });
    } finally {
      setExporting(false);
    }
  }

  function handleExportCurrent() {
    setStatus({ tone: "neutral", message: "Exporting current slide..." });
    exportJobs(
      [{ locale: config.activeLocale, slideIndex: config.activeSlideIndex }],
      "Current slide exported.",
    );
  }

  function handleExportLocale() {
    setStatus({ tone: "neutral", message: "Exporting current locale set..." });
    exportJobs(
      config.slides.map((_, i) => ({ locale: config.activeLocale, slideIndex: i })),
      "All slides for the current locale exported.",
    );
  }

  function handleExportAllLocales() {
    setStatus({ tone: "neutral", message: "Exporting every locale..." });
    const jobs = config.locales.flatMap((loc) =>
      config.slides.map((_, i) => ({ locale: loc.code, slideIndex: i })),
    );
    exportJobs(jobs, "All locale sets exported.");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      {/* Sidebar editor */}
      <EditorPanel />

      {/* Main content area */}
      <main style={{ flex: 1, minWidth: 0, overflowX: "hidden", overflowY: "auto", scrollbarGutter: "stable", padding: "12px 8px 40px 12px" }}>
        <div style={{ width: "100%", display: "grid", gap: 12 }}>
          {/* Compact header + toolbar */}
          <section
            style={{
              width: "100%",
              maxWidth: "100%",
              borderRadius: 14,
              padding: "10px 14px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(6, 12, 10, 0.74)",
              backdropFilter: "blur(16px)",
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
              <ControlGroup label="Locale">
                {config.locales.map((loc) => (
                  <SegmentButton
                    key={loc.code}
                    active={config.activeLocale === loc.code}
                    onClick={() => dispatch({ type: "SET_ACTIVE_LOCALE", code: loc.code })}
                    label={loc.name}
                  />
                ))}
              </ControlGroup>
              <ControlGroup label="Device">
                <ToolbarDropdown
                  options={DEVICE_OPTIONS}
                  value={DEVICE_OPTIONS.find((d) => d.id === activeDevice) ?? DEVICE_OPTIONS[0]}
                  getKey={(o) => o.id}
                  getDisplay={(o) => o.label}
                  onChange={(o) => handleDeviceChange(o.id)}
                  minWidth={92}
                  testId="device-dropdown"
                />
              </ControlGroup>
              <ControlGroup label="Size">
                <ToolbarDropdown
                  options={sizesForActiveDevice}
                  value={activeSizeOption}
                  getKey={(o) => String(o.index)}
                  getDisplay={(o) => o.size.label}
                  onChange={(o) => dispatch({ type: "SET_ACTIVE_SIZE", index: o.index })}
                  minWidth={132}
                  testId="size-dropdown"
                />
              </ControlGroup>
              <div style={{ flex: 1 }} />
              <div
                data-testid="status-panel"
                title={ready ? status.message : "Loading images..."}
                style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}
              >
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  flexShrink: 0,
                  background: status.tone === "error" ? "#EF4444" : status.tone === "success" ? "#10B981" : "#9EB1A8",
                }} />
              </div>
              <span style={{ fontSize: 10, color: "#9EB1A8", whiteSpace: "nowrap" }}>
                {config.slides[config.activeSlideIndex]?.content[config.activeLocale]?.eyebrow ?? "Slide"}
              </span>
              <ExportDropdown
                disabled={!ready || exporting}
                activeSizeLabel={activeSize?.label ?? ""}
                onExportCurrent={handleExportCurrent}
                onExportLocale={handleExportLocale}
                onExportAll={handleExportAllLocales}
              />
            </div>
          </section>

          {/* Live preview */}
          <SlidePreview />

          {/* Slide strip */}
          <div style={{ width: "100%", display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
            {config.slides.map((_, i) => (
              <PreviewCard
                key={i}
                slideIndex={i}
                selected={i === config.activeSlideIndex}
                onSelect={() => dispatch({ type: "SET_ACTIVE_SLIDE", index: i })}
              />
            ))}
          </div>
        </div>

        {/* REQUIREMENT: Offscreen export nodes for all slides x locales */}
        <div
          aria-hidden
          style={{ position: "fixed", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
        >
          {config.locales.flatMap((loc) =>
            config.slides.map((slide, slideIndex) => {
              const content = slide.content[loc.code] ?? {
                menuLabel: String(slideIndex + 1).padStart(2, "0"),
                eyebrow: "Slide",
                title: ["Title"],
                body: "",
                chips: [],
              };
              const images = slide.images[loc.code] ?? { primary: "" };
              const resolvedImages = {
                primary: img(images.primary),
                secondary: images.secondary ? img(images.secondary) : undefined,
              };

              return (
                <div
                  key={`${loc.code}-${slideIndex}`}
                  ref={(node) => {
                    exportRefs.current[`${loc.code}:${slideIndex}`] = node;
                  }}
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    top: 0,
                    width: canvasW,
                    height: canvasH,
                    opacity: 0,
                    fontFamily: config.typography.fontFamily,
                  }}
                >
                  {renderTemplate(slide.templateId, {
                    copy: content,
                    images: resolvedImages,
                    mockup: activeMockup,
                    theme: config.theme,
                    typography: config.typography,
                    canvasWidth: canvasW,
                    canvasHeight: canvasH,
                  })}
                </div>
              );
            }),
          )}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UI primitives (preserved from original)
// ---------------------------------------------------------------------------


function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ color: "#9EB1A8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function SegmentButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: "6px 12px",
        border: active ? "1px solid rgba(52, 211, 153, 0.44)" : "1px solid rgba(255, 255, 255, 0.08)",
        background: active ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.04)",
        color: active ? "#F5FAF7" : "#9EB1A8",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Device class helpers (toolbar Device + Size dropdowns)
// ---------------------------------------------------------------------------

type DeviceClass = "iphone" | "ipad";

const DEVICE_OPTIONS: { id: DeviceClass; label: string }[] = [
  { id: "iphone", label: "iPhone" },
  { id: "ipad", label: "iPad" },
];

function deviceClassOfSizeLabel(label: string): DeviceClass {
  return label.toLowerCase().startsWith("ipad") ? "ipad" : "iphone";
}

// ---------------------------------------------------------------------------
// Generic toolbar dropdown
// ---------------------------------------------------------------------------

function ToolbarDropdown<T>({
  options,
  value,
  getKey,
  getDisplay,
  onChange,
  minWidth,
  testId,
}: {
  options: T[];
  value: T | undefined;
  getKey: (o: T) => string;
  getDisplay: (o: T) => string;
  onChange: (o: T) => void;
  minWidth?: number;
  testId?: string;
}) {
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = menuPos !== null;
  const activeKey = value ? getKey(value) : null;

  function toggle() {
    if (open) { setMenuPos(null); return; }
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const estH = Math.min(options.length * 30 + 16, window.innerHeight * 0.7);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > estH ? rect.bottom + 4 : Math.max(8, rect.top - estH - 4);
    setMenuPos({ top, left: rect.left });
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuPos(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-testid={testId}
        onClick={toggle}
        style={{
          borderRadius: 999,
          padding: "6px 12px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          background: "rgba(255, 255, 255, 0.04)",
          color: "#F5FAF7",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: minWidth ?? 110,
          justifyContent: "space-between",
        }}
      >
        <span>{value ? getDisplay(value) : ""}</span>
        <span style={{ fontSize: 8, color: "#9EB1A8" }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          data-testid={testId ? `${testId}-menu` : undefined}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            minWidth: 180,
            maxHeight: "70vh",
            overflowY: "auto",
            borderRadius: 12,
            padding: 4,
            background: "rgba(10, 20, 16, 0.97)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 48px rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
          }}
        >
          {options.map((opt) => {
            const k = getKey(opt);
            const isActive = k === activeKey;
            return (
              <button
                key={k}
                type="button"
                data-testid={testId ? `${testId}-option-${k}` : undefined}
                onClick={() => { setMenuPos(null); onChange(opt); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "7px 14px",
                  background: "none",
                  border: "none",
                  color: isActive ? "#34D399" : "#F5FAF7",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  borderRadius: 6,
                }}
              >
                {isActive ? "\u2713 " : "\u2003"}{getDisplay(opt)}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Export dropdown (actions only \u2014 size is selected in the toolbar)
// ---------------------------------------------------------------------------

function ExportDropdown({
  disabled,
  activeSizeLabel,
  onExportCurrent,
  onExportLocale,
  onExportAll,
}: {
  disabled: boolean;
  activeSizeLabel: string;
  onExportCurrent: () => void;
  onExportLocale: () => void;
  onExportAll: () => void;
}) {
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = menuPos !== null;

  function toggle() {
    if (open) { setMenuPos(null); return; }
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const estH = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > estH ? rect.bottom + 4 : Math.max(8, rect.top - estH - 4);
    setMenuPos({ top, right: Math.max(4, window.innerWidth - rect.right) });
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuPos(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const itemStyle: CSSProperties = {
    display: "block",
    width: "100%",
    padding: "7px 14px",
    background: "none",
    border: "none",
    color: "#F5FAF7",
    fontSize: 12,
    textAlign: "left",
    cursor: "pointer",
    borderRadius: 6,
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        data-testid="action-export-current"
        onClick={toggle}
        style={{
          borderRadius: 999,
          padding: "7px 14px",
          border: "1px solid rgba(52, 211, 153, 0.34)",
          background: disabled
            ? "rgba(255, 255, 255, 0.03)"
            : "linear-gradient(180deg, rgba(16, 185, 129, 0.22), rgba(16, 185, 129, 0.16))",
          color: disabled ? "rgba(255, 255, 255, 0.38)" : "#F5FAF7",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          boxShadow: !disabled ? "0 12px 30px rgba(16, 185, 129, 0.14)" : "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Export {activeSizeLabel}
        <span style={{ fontSize: 8 }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            right: menuPos.right,
            minWidth: 220,
            borderRadius: 12,
            padding: 4,
            background: "rgba(10, 20, 16, 0.97)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 48px rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
          }}
        >
          <button type="button" style={itemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            onClick={() => { setMenuPos(null); onExportCurrent(); }}>
            Current Slide
          </button>
          <button type="button" data-testid="action-export-locale" style={itemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            onClick={() => { setMenuPos(null); onExportLocale(); }}>
            Current Locale (all slides)
          </button>
          <button type="button" data-testid="action-export-all" style={itemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            onClick={() => { setMenuPos(null); onExportAll(); }}>
            All Locales (everything)
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}
