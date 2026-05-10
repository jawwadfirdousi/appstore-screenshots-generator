"use client";

import {
  type CSSProperties,
  type DragEvent,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { useConfig, useConfigDispatch } from "@/lib/config-context";
import type { ScreenshotConfig, ThemeConfig } from "@/lib/types";
import { TEMPLATES, TEMPLATE_MAP, renderTemplate } from "@/lib/templates";
import { img } from "@/components/slide-primitives";

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------

const PANEL_BG = "rgba(6, 12, 10, 0.92)";
const SECTION_BG = "rgba(255, 255, 255, 0.03)";
const INPUT_BG = "rgba(255, 255, 255, 0.06)";
const INPUT_BORDER = "rgba(255, 255, 255, 0.08)";
const ACCENT = "#10B981";
const TEXT = "#F5FAF7";
const MUTED = "#9EB1A8";

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${INPUT_BORDER}`,
  background: INPUT_BG,
  color: TEXT,
  fontSize: 13,
  outline: "none",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: MUTED,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  marginBottom: 4,
};

const smallBtnStyle: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: `1px solid ${INPUT_BORDER}`,
  background: INPUT_BG,
  color: TEXT,
  fontSize: 12,
  cursor: "pointer",
};

// ---------------------------------------------------------------------------
// Shared tiny components
// ---------------------------------------------------------------------------

function Section({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${INPUT_BORDER}` }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        data-testid={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "12px 16px",
          background: "transparent",
          border: "none",
          color: TEXT,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          cursor: "pointer",
        }}
      >
        {title}
        <span style={{ fontSize: 10, color: MUTED }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", display: "grid", gap: 10 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read failed"));
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Template Gallery
// ---------------------------------------------------------------------------

function TemplateGallery() {
  const config = useConfig();
  const dispatch = useConfigDispatch();
  const slide = config.slides[config.activeSlideIndex];
  const activeSize = config.sizes[config.activeSizeIndex] ?? config.sizes[0];
  const cW = activeSize.w;
  const cH = activeSize.h;
  if (!slide) return null;

  return (
    <Section title="Template" defaultOpen>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        {TEMPLATES.map((t) => {
          const active = slide.templateId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`template-${t.id}`}
              onClick={() =>
                dispatch({ type: "SET_SLIDE_TEMPLATE", slideIndex: config.activeSlideIndex, templateId: t.id })
              }
              style={{
                padding: 4,
                borderRadius: 8,
                border: active
                  ? `2px solid ${ACCENT}`
                  : `1px solid ${INPUT_BORDER}`,
                background: active ? "rgba(16,185,129,0.08)" : SECTION_BG,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {/* BUGFIX: thumbnail uses position:absolute inner so the 1320px canvas
                  doesn't blow out the grid cell layout */}
              <div
                style={{
                  width: "100%",
                  paddingBottom: `${(cH / cW) * 100}%`,
                  borderRadius: 5,
                  overflow: "hidden",
                  background: "#050807",
                  marginBottom: 3,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: cW,
                    height: cH,
                    transform: "scale(var(--thumb-scale))",
                    transformOrigin: "top left",
                    pointerEvents: "none",
                  }}
                  ref={(el) => {
                    // Dynamically compute scale based on actual container width
                    if (el?.parentElement) {
                      const w = el.parentElement.offsetWidth;
                      el.style.setProperty("--thumb-scale", String(w / cW));
                    }
                  }}
                >
                  {renderTemplate(t.id, {
                    copy: slide.content[config.activeLocale] ?? {
                      menuLabel: "01",
                      eyebrow: "Preview",
                      title: ["Title"],
                      body: "Body",
                      chips: [],
                    },
                    images: slide.images[config.activeLocale] ?? { primary: "" },
                    mockup: config.mockups.find((m) => m.id === config.activeMockupId) ?? config.mockups[0],
                    theme: config.theme,
                    typography: config.typography,
                    canvasWidth: cW,
                    canvasHeight: cH,
                  })}
                </div>
              </div>
              <div style={{ fontSize: 9, color: active ? TEXT : MUTED, fontWeight: active ? 600 : 400, lineHeight: 1.2, padding: "0 2px" }}>
                {t.name}
              </div>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Slide Manager
// ---------------------------------------------------------------------------

function SlideManager() {
  const config = useConfig();
  const dispatch = useConfigDispatch();

  return (
    <Section title="Slides">
      <div style={{ display: "grid", gap: 6 }}>
        {config.slides.map((slide, i) => {
          const active = i === config.activeSlideIndex;
          const content = slide.content[config.activeLocale];
          return (
            <div
              key={slide.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 8,
                border: active ? `1px solid ${ACCENT}` : `1px solid transparent`,
                background: active ? "rgba(16,185,129,0.06)" : "transparent",
              }}
            >
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_ACTIVE_SLIDE", index: i })}
                data-testid={`slide-select-${i}`}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  color: TEXT,
                  fontSize: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <span style={{ color: MUTED, marginRight: 6 }}>{content?.menuLabel ?? String(i + 1).padStart(2, "0")}</span>
                {content?.eyebrow ?? slide.id}
              </button>
              <button
                type="button"
                disabled={i === 0}
                onClick={() => dispatch({ type: "REORDER_SLIDE", fromIndex: i, toIndex: i - 1 })}
                style={{ ...smallBtnStyle, padding: "2px 6px", opacity: i === 0 ? 0.3 : 1 }}
                title="Move up"
              >
                &uarr;
              </button>
              <button
                type="button"
                disabled={i === config.slides.length - 1}
                onClick={() => dispatch({ type: "REORDER_SLIDE", fromIndex: i, toIndex: i + 1 })}
                style={{ ...smallBtnStyle, padding: "2px 6px", opacity: i === config.slides.length - 1 ? 0.3 : 1 }}
                title="Move down"
              >
                &darr;
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Remove this slide?")) dispatch({ type: "REMOVE_SLIDE", index: i });
                }}
                style={{ ...smallBtnStyle, padding: "2px 6px", color: "#EF4444" }}
                title="Remove"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          data-testid="add-slide"
          onClick={() => dispatch({ type: "ADD_SLIDE", templateId: "center-stage" })}
          style={{ ...smallBtnStyle, flex: 1, textAlign: "center" }}
        >
          + Add Slide
        </button>
      </div>
      {/* Slide ID and slug editing */}
      {config.slides[config.activeSlideIndex] && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Field label="Slide ID">
            <input
              style={inputStyle}
              value={config.slides[config.activeSlideIndex].id}
              onChange={(e) =>
                dispatch({ type: "SET_SLIDE_ID", slideIndex: config.activeSlideIndex, id: e.target.value })
              }
            />
          </Field>
          <Field label="Slug">
            <input
              style={inputStyle}
              value={config.slides[config.activeSlideIndex].slug}
              onChange={(e) =>
                dispatch({ type: "SET_SLIDE_SLUG", slideIndex: config.activeSlideIndex, slug: e.target.value })
              }
            />
          </Field>
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Content Editor
// ---------------------------------------------------------------------------

function ContentEditor() {
  const config = useConfig();
  const dispatch = useConfigDispatch();
  const slide = config.slides[config.activeSlideIndex];
  if (!slide) return null;
  const content = slide.content[config.activeLocale];
  if (!content) return null;

  const set = (field: keyof typeof content, value: string | string[]) =>
    dispatch({
      type: "SET_SLIDE_CONTENT",
      slideIndex: config.activeSlideIndex,
      locale: config.activeLocale,
      field,
      value,
    });

  return (
    <Section title="Content" defaultOpen>
      <Field label="Eyebrow">
        <input
          style={inputStyle}
          data-testid="input-eyebrow"
          value={content.eyebrow}
          onChange={(e) => set("eyebrow", e.target.value)}
        />
      </Field>
      <Field label="Title (one line per row)">
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
          data-testid="input-title"
          value={content.title.join("\n")}
          onChange={(e) => set("title", e.target.value.split("\n"))}
        />
      </Field>
      <Field label="Body">
        <textarea
          style={{ ...inputStyle, minHeight: 48, resize: "vertical" }}
          data-testid="input-body"
          value={content.body}
          onChange={(e) => set("body", e.target.value)}
        />
      </Field>
      <Field label="Menu Label">
        <input
          style={inputStyle}
          value={content.menuLabel}
          onChange={(e) => set("menuLabel", e.target.value)}
        />
      </Field>
      <Field label="Chips (comma-separated)">
        <input
          style={inputStyle}
          data-testid="input-chips"
          value={content.chips.join(", ")}
          onChange={(e) => set("chips", e.target.value.split(",").map((s) => s.trim()))}
        />
      </Field>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Image Uploader
// ---------------------------------------------------------------------------

function DropZone({
  label,
  currentSrc,
  onFile,
  testId,
}: {
  label: string;
  currentSrc: string;
  onFile: (dataUrl: string) => void;
  testId?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onFile(await fileToDataUrl(file));
      }
    },
    [onFile],
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(await fileToDataUrl(file));
    },
    [onFile],
  );

  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        data-testid={testId}
        style={{
          borderRadius: 10,
          border: dragging ? `2px dashed ${ACCENT}` : `1px dashed rgba(255,255,255,0.15)`,
          background: dragging ? "rgba(16,185,129,0.06)" : SECTION_BG,
          padding: 12,
          textAlign: "center",
          cursor: "pointer",
          minHeight: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
        onClick={() => inputRef.current?.click()}
      >
        {currentSrc ? (
          <img
            src={img(currentSrc)}
            alt=""
            style={{ maxHeight: 80, maxWidth: "100%", borderRadius: 6, objectFit: "contain" }}
          />
        ) : (
          <span style={{ color: MUTED, fontSize: 11 }}>Drop image or click to browse</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleChange}
          data-testid={testId ? `${testId}-input` : undefined}
        />
      </div>
    </div>
  );
}

function ImageUploader() {
  const config = useConfig();
  const dispatch = useConfigDispatch();
  const slide = config.slides[config.activeSlideIndex];
  if (!slide) return null;
  const images = slide.images[config.activeLocale] ?? { primary: "" };
  const tmpl = TEMPLATE_MAP[slide.templateId];

  return (
    <Section title="Images">
      <DropZone
        label="Primary Screenshot"
        currentSrc={images.primary}
        testId="drop-primary"
        onFile={(dataUrl) =>
          dispatch({
            type: "SET_SLIDE_IMAGE",
            slideIndex: config.activeSlideIndex,
            locale: config.activeLocale,
            imageKey: "primary",
            dataUrl,
          })
        }
      />
      {tmpl && tmpl.phoneCount === 2 && (
        <DropZone
          label="Secondary Screenshot"
          currentSrc={images.secondary ?? ""}
          testId="drop-secondary"
          onFile={(dataUrl) =>
            dispatch({
              type: "SET_SLIDE_IMAGE",
              slideIndex: config.activeSlideIndex,
              locale: config.activeLocale,
              imageKey: "secondary",
              dataUrl,
            })
          }
        />
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Locale Manager
// ---------------------------------------------------------------------------

function LocaleManager() {
  const config = useConfig();
  const dispatch = useConfigDispatch();
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");

  return (
    <Section title="Locales">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {config.locales.map((loc) => {
          const active = loc.code === config.activeLocale;
          return (
            <div key={loc.code} style={{ display: "flex", gap: 2 }}>
              <button
                type="button"
                data-testid={`locale-${loc.code}`}
                onClick={() => dispatch({ type: "SET_ACTIVE_LOCALE", code: loc.code })}
                style={{
                  ...smallBtnStyle,
                  background: active ? "rgba(16,185,129,0.12)" : INPUT_BG,
                  border: active ? `1px solid ${ACCENT}` : `1px solid ${INPUT_BORDER}`,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {loc.name} ({loc.code})
              </button>
              {config.locales.length > 1 && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_LOCALE", code: loc.code })}
                  style={{ ...smallBtnStyle, padding: "2px 6px", color: "#EF4444" }}
                >
                  &times;
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
        <Field label="Code">
          <input
            style={{ ...inputStyle, width: 50 }}
            placeholder="fr"
            value={newCode}
            data-testid="locale-code-input"
            onChange={(e) => setNewCode(e.target.value.toLowerCase().slice(0, 5))}
          />
        </Field>
        <Field label="Name">
          <input
            style={inputStyle}
            placeholder="French"
            value={newName}
            data-testid="locale-name-input"
            onChange={(e) => setNewName(e.target.value)}
          />
        </Field>
        <button
          type="button"
          data-testid="add-locale"
          disabled={!newCode || !newName}
          onClick={() => {
            dispatch({ type: "ADD_LOCALE", locale: { code: newCode, name: newName } });
            dispatch({ type: "SET_ACTIVE_LOCALE", code: newCode });
            setNewCode("");
            setNewName("");
          }}
          style={{ ...smallBtnStyle, opacity: !newCode || !newName ? 0.4 : 1, whiteSpace: "nowrap" }}
        >
          + Add
        </button>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Theme Editor
// ---------------------------------------------------------------------------

const THEME_KEYS: { key: keyof ThemeConfig; label: string }[] = [
  { key: "bgTop", label: "Background Top" },
  { key: "bgBottom", label: "Background Bottom" },
  { key: "accent", label: "Accent" },
  { key: "accentBright", label: "Bright Accent" },
  { key: "text", label: "Text" },
  { key: "textDark", label: "Dark Text" },
  { key: "muted", label: "Muted" },
  { key: "mutedDark", label: "Dark Muted" },
];

function rgbaToHex(rgba: string): string {
  if (rgba.startsWith("#")) return rgba.slice(0, 7);
  const match = rgba.match(/\d+/g);
  if (!match) return "#000000";
  const [r, g, b] = match.map(Number);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function ThemeEditor() {
  const config = useConfig();
  const dispatch = useConfigDispatch();

  return (
    <Section title="Theme Colors">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {THEME_KEYS.map(({ key, label }) => (
          <Field key={key} label={label}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="color"
                value={rgbaToHex(config.theme[key])}
                onChange={(e) => dispatch({ type: "SET_THEME_COLOR", key, value: e.target.value })}
                style={{ width: 28, height: 28, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }}
              />
              <input
                style={{ ...inputStyle, fontSize: 11, flex: 1 }}
                value={config.theme[key]}
                onChange={(e) => dispatch({ type: "SET_THEME_COLOR", key, value: e.target.value })}
              />
            </div>
          </Field>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Typography Editor
// ---------------------------------------------------------------------------

function TypographyEditor() {
  const config = useConfig();
  const dispatch = useConfigDispatch();
  const t = config.typography;

  const sizeField = (label: string, key: "titleSize" | "eyebrowSize" | "bodySize" | "chipSize") => (
    <Field label={label}>
      <input
        type="number"
        style={{ ...inputStyle, width: "100%" }}
        value={t[key]}
        min={8}
        max={400}
        onChange={(e) => dispatch({ type: "SET_TYPOGRAPHY", key, value: Number(e.target.value) })}
      />
    </Field>
  );

  return (
    <Section title="Typography">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {sizeField("Title Size", "titleSize")}
        {sizeField("Eyebrow Size", "eyebrowSize")}
        {sizeField("Body Size", "bodySize")}
        {sizeField("Chip Size", "chipSize")}
      </div>
      <Field label="Font Family">
        <select
          style={{ ...inputStyle }}
          value={t.fontFamily}
          onChange={(e) => dispatch({ type: "SET_TYPOGRAPHY", key: "fontFamily", value: e.target.value })}
        >
          <option value='"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'>
            SF Pro (Default)
          </option>
          <option value='"Inter", -apple-system, sans-serif'>Inter</option>
          <option value='"Helvetica Neue", Helvetica, Arial, sans-serif'>Helvetica Neue</option>
          <option value='Georgia, "Times New Roman", serif'>Georgia (Serif)</option>
          <option value='"Courier New", monospace'>Courier (Mono)</option>
        </select>
      </Field>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Mockup Editor
// ---------------------------------------------------------------------------

function MockupEditor() {
  const config = useConfig();
  const dispatch = useConfigDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const id = `custom-${Date.now()}`;
    dispatch({
      type: "ADD_CUSTOM_MOCKUP",
      mockup: {
        id,
        label: file.name.replace(/\.\w+$/, ""),
        exportSlug: id,
        src: dataUrl,
        aspectRatio: "469/958",
        screenArea: {
          leftPct: (24 / 469) * 100,
          topPct: (22 / 958) * 100,
          widthPct: (421 / 469) * 100,
          heightPct: (914 / 958) * 100,
          borderRadiusXPct: (52 / 421) * 100,
          borderRadiusYPct: (57 / 914) * 100,
        },
      },
    });
    dispatch({ type: "SET_ACTIVE_MOCKUP", id });
  };

  return (
    <Section title="Mockup">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {config.mockups.map((m) => {
          const active = m.id === config.activeMockupId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => dispatch({ type: "SET_ACTIVE_MOCKUP", id: m.id })}
              style={{
                ...smallBtnStyle,
                background: active ? "rgba(16,185,129,0.12)" : INPUT_BG,
                border: active ? `1px solid ${ACCENT}` : `1px solid ${INPUT_BORDER}`,
                fontWeight: active ? 600 : 400,
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ ...smallBtnStyle, width: "100%", textAlign: "center" }}
      >
        Upload Custom Mockup
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        style={{ display: "none" }}
        onChange={handleCustomUpload}
      />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Export Settings
// ---------------------------------------------------------------------------

function ExportSettings() {
  const config = useConfig();
  const dispatch = useConfigDispatch();
  const [newLabel, setNewLabel] = useState("");
  const [newW, setNewW] = useState("");
  const [newH, setNewH] = useState("");

  return (
    <Section title="Export Sizes">
      <div style={{ display: "grid", gap: 4 }}>
        {config.sizes.map((s, i) => {
          const active = i === config.activeSizeIndex;
          return (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_ACTIVE_SIZE", index: i })}
                style={{
                  ...smallBtnStyle,
                  flex: 1,
                  textAlign: "left",
                  background: active ? "rgba(16,185,129,0.12)" : INPUT_BG,
                  border: active ? `1px solid ${ACCENT}` : `1px solid ${INPUT_BORDER}`,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {s.label} - {s.w}x{s.h}
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "REMOVE_SIZE_PRESET", index: i })}
                style={{ ...smallBtnStyle, padding: "2px 6px", color: "#EF4444" }}
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
        <Field label="Label">
          <input style={{ ...inputStyle, width: 50 }} placeholder='6.7"' value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
        </Field>
        <Field label="W">
          <input type="number" style={{ ...inputStyle, width: 60 }} value={newW} onChange={(e) => setNewW(e.target.value)} />
        </Field>
        <Field label="H">
          <input type="number" style={{ ...inputStyle, width: 60 }} value={newH} onChange={(e) => setNewH(e.target.value)} />
        </Field>
        <button
          type="button"
          disabled={!newLabel || !newW || !newH}
          onClick={() => {
            dispatch({ type: "ADD_SIZE_PRESET", preset: { label: newLabel, w: Number(newW), h: Number(newH) } });
            setNewLabel("");
            setNewW("");
            setNewH("");
          }}
          style={{ ...smallBtnStyle, opacity: !newLabel || !newW || !newH ? 0.4 : 1, whiteSpace: "nowrap" }}
        >
          + Add
        </button>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Config IO (JSON export/import)
// ---------------------------------------------------------------------------

function ConfigIO() {
  const config = useConfig();
  const dispatch = useConfigDispatch();
  const importRef = useRef<HTMLInputElement>(null);

  const handleExportConfig = () => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "screenshot-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as ScreenshotConfig;
      dispatch({ type: "IMPORT_CONFIG", config: parsed });
    } catch {
      alert("Invalid config JSON file.");
    }
    // Reset so the same file can be re-imported
    e.target.value = "";
  };

  return (
    <Section title="Config">
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          data-testid="export-config"
          onClick={handleExportConfig}
          style={{ ...smallBtnStyle, flex: 1, textAlign: "center", background: "rgba(16,185,129,0.10)" }}
        >
          Export JSON
        </button>
        <button
          type="button"
          data-testid="import-config"
          onClick={() => importRef.current?.click()}
          style={{ ...smallBtnStyle, flex: 1, textAlign: "center" }}
        >
          Import JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={handleImportConfig}
          data-testid="import-config-input"
        />
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// EditorPanel (assembled sidebar)
// ---------------------------------------------------------------------------

export function EditorPanel() {
  return (
    <aside
      data-testid="editor-panel"
      style={{
        width: 280,
        minWidth: 280,
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        background: PANEL_BG,
        borderRight: `1px solid ${INPUT_BORDER}`,
        backdropFilter: "blur(16px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${INPUT_BORDER}`,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: TEXT,
        }}
      >
        Visual Editor
      </div>
      <TemplateGallery />
      <SlideManager />
      <ContentEditor />
      <ImageUploader />
      <LocaleManager />
      <ThemeEditor />
      <TypographyEditor />
      <MockupEditor />
      <ExportSettings />
      <ConfigIO />
    </aside>
  );
}
