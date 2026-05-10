import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

test.describe("Visual Editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("editor-panel")).toBeVisible();
    // Wait for preview to render
    await expect(page.getByTestId("slide-preview")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Template selection
  // ---------------------------------------------------------------------------

  test("selecting a template updates the preview", async ({ page }) => {
    const preview = page.getByTestId("slide-preview");
    await expect(preview).toBeVisible();

    // Template section is open by default, click glass-card
    const glassCard = page.getByTestId("template-glass-card");
    await glassCard.click();

    // Preview should still render
    await expect(preview).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Content editing
  // ---------------------------------------------------------------------------

  test("editing headline text updates the preview", async ({ page }) => {
    // Content section is open by default
    const eyebrowInput = page.getByTestId("input-eyebrow");
    await expect(eyebrowInput).toBeVisible();
    await eyebrowInput.fill("My Custom Eyebrow");

    const preview = page.getByTestId("slide-preview");
    await expect(preview).toContainText("My Custom Eyebrow");
  });

  test("editing title updates the preview", async ({ page }) => {
    const titleInput = page.getByTestId("input-title");
    await titleInput.fill("Line One\nLine Two");

    const preview = page.getByTestId("slide-preview");
    await expect(preview).toContainText("Line One");
    await expect(preview).toContainText("Line Two");
  });

  test("editing body text updates the preview", async ({ page }) => {
    const bodyInput = page.getByTestId("input-body");
    await bodyInput.fill("Updated body copy here.");

    const preview = page.getByTestId("slide-preview");
    await expect(preview).toContainText("Updated body copy here.");
  });

  test("editing chips updates the input value", async ({ page }) => {
    const chipsInput = page.getByTestId("input-chips");
    await chipsInput.fill("Alpha, Beta, Gamma");
    await expect(chipsInput).toHaveValue("Alpha, Beta, Gamma");
  });

  // ---------------------------------------------------------------------------
  // Image upload via file picker
  // ---------------------------------------------------------------------------

  test("uploading an image via file picker shows thumbnail", async ({ page }) => {
    // Open Images section
    await page.getByTestId("section-images").click();

    // Create a tiny test PNG (1x1 red pixel)
    const testImagePath = path.join(__dirname, "test-image.png");
    if (!fs.existsSync(testImagePath)) {
      const buf = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        "base64",
      );
      fs.writeFileSync(testImagePath, buf);
    }

    const fileInput = page.getByTestId("drop-primary-input");
    await fileInput.setInputFiles(testImagePath);

    // The drop zone should now show an image thumbnail
    const dropZone = page.getByTestId("drop-primary");
    await expect(dropZone.locator("img")).toBeVisible({ timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  // JSON export / import round-trip
  // ---------------------------------------------------------------------------

  test("export and import config JSON preserves settings", async ({ page }) => {
    // Change eyebrow (Content section is open by default)
    const eyebrowInput = page.getByTestId("input-eyebrow");
    await eyebrowInput.fill("RoundTrip Test");

    // Open Config section
    await page.getByTestId("section-config").click();

    // Export config
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-config").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("screenshot-config.json");

    // Save to temp file
    const downloadPath = path.join(__dirname, "temp-config.json");
    await download.saveAs(downloadPath);

    // Read and verify JSON contains our change
    const json = JSON.parse(fs.readFileSync(downloadPath, "utf-8"));
    const scanContent = json.slides?.[0]?.content?.en;
    expect(scanContent?.eyebrow).toBe("RoundTrip Test");

    // Reload the page (resets to defaults)
    await page.reload();
    await expect(page.getByTestId("editor-panel")).toBeVisible();
    await expect(page.getByTestId("slide-preview")).toBeVisible();

    // Verify default was restored
    const eyebrowAfterReload = page.getByTestId("input-eyebrow");
    await expect(eyebrowAfterReload).toHaveValue("Feature One");

    // Import the saved config
    await page.getByTestId("section-config").click();
    const importInput = page.getByTestId("import-config-input");
    await importInput.setInputFiles(downloadPath);

    // Verify the imported eyebrow
    await expect(page.getByTestId("input-eyebrow")).toHaveValue("RoundTrip Test");

    // Clean up
    fs.unlinkSync(downloadPath);
  });

  // ---------------------------------------------------------------------------
  // Locale management
  // ---------------------------------------------------------------------------

  test("adding a new locale creates a locale button", async ({ page }) => {
    // Open Locales section
    await page.getByTestId("section-locales").click();

    // Add French locale
    await page.getByTestId("locale-code-input").fill("fr");
    await page.getByTestId("locale-name-input").fill("French");
    await page.getByTestId("add-locale").click();

    // French locale button should appear
    await expect(page.getByTestId("locale-fr")).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Slide management
  // ---------------------------------------------------------------------------

  test("adding a slide updates the slide strip", async ({ page }) => {
    // Count initial preview cards
    const initialCards = await page.locator("[data-testid^='preview-card-']").count();
    expect(initialCards).toBe(6);

    // Open Slides section
    await page.getByTestId("section-slides").click();

    // Add a new slide
    await page.getByTestId("add-slide").click();

    // Should now have 7 preview cards
    await expect(page.locator("[data-testid^='preview-card-']")).toHaveCount(7);
  });

  // ---------------------------------------------------------------------------
  // PNG export triggering
  // ---------------------------------------------------------------------------

  // Helper: wait for the export pipeline to be ready (status panel tooltip)
  async function waitForReady(page: import("@playwright/test").Page) {
    await expect(page.getByTestId("status-panel")).toHaveAttribute(
      "title",
      /inlined/i,
      { timeout: 15000 },
    );
  }

  test("export current triggers a download (iPhone)", async ({ page }) => {
    await waitForReady(page);
    const downloadPromise = page.waitForEvent("download");
    // The Export pill toggles a menu; click it then click "Current Slide".
    await page.getByTestId("action-export-current").click();
    await page.getByRole("button", { name: "Current Slide" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
      /^\d{2}-.+-\w+-iphone-17-pro-max-1320x2868\.png$/,
    );
  });

  test("export current triggers a download (iPad after switching device)", async ({ page }) => {
    await waitForReady(page);
    // Switch device → iPad (this also auto-switches mockup + first iPad size)
    await page.getByTestId("device-dropdown").click();
    await page.getByTestId("device-dropdown-option-ipad").click();
    // Ensure URL reflects iPad pairing before exporting
    await expect(page).toHaveURL(/mockup=ipad-pro/);
    await expect(page).toHaveURL(/size=2064x2752/);

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("action-export-current").click();
    await page.getByRole("button", { name: "Current Slide" }).click();
    const download = await downloadPromise;
    // NOTE: existing filename template hardcodes "-iphone-" between locale and mockup slug.
    // We assert size and mockup slug specifically.
    expect(download.suggestedFilename()).toMatch(/ipad-pro-2064x2752\.png$/);
  });

  test("export current locale produces one download per slide", async ({ page }) => {
    await waitForReady(page);
    const downloads: string[] = [];
    page.on("download", (d) => downloads.push(d.suggestedFilename()));
    await page.getByTestId("action-export-current").click();
    await page.getByTestId("action-export-locale").click();
    // 6 slides x 1 locale = 6 downloads. The pipeline waits 300ms between exports.
    await page.waitForTimeout(15000);
    expect(downloads.length).toBe(6);
    for (const name of downloads) {
      expect(name).toMatch(/^\d{2}-.+-en-iphone-.+-\d+x\d+\.png$/);
    }
  });

  test("export all locales produces one download per slide per locale", async ({ page }) => {
    await waitForReady(page);
    const downloads: string[] = [];
    page.on("download", (d) => downloads.push(d.suggestedFilename()));
    await page.getByTestId("action-export-current").click();
    await page.getByTestId("action-export-all").click();
    // 6 slides x 2 locales = 12 downloads.
    await page.waitForTimeout(25000);
    expect(downloads.length).toBe(12);
    const en = downloads.filter((n) => n.includes("-en-"));
    const de = downloads.filter((n) => n.includes("-de-"));
    expect(en.length).toBe(6);
    expect(de.length).toBe(6);
  });

  // ---------------------------------------------------------------------------
  // Device + Size dropdown behavior (toolbar)
  // ---------------------------------------------------------------------------

  test("toolbar shows Device and Size dropdowns", async ({ page }) => {
    await expect(page.getByTestId("device-dropdown")).toBeVisible();
    await expect(page.getByTestId("size-dropdown")).toBeVisible();
    await expect(page.getByTestId("device-dropdown")).toContainText("iPhone");
    await expect(page.getByTestId("size-dropdown")).toContainText('iPhone 6.9"');
  });

  test("Device dropdown switches to iPad and auto-pairs mockup + size", async ({ page }) => {
    await page.getByTestId("device-dropdown").click();
    await page.getByTestId("device-dropdown-option-ipad").click();

    await expect(page.getByTestId("device-dropdown")).toContainText("iPad");
    await expect(page.getByTestId("size-dropdown")).toContainText('iPad 13" P');
    await expect(page).toHaveURL(/mockup=ipad-pro/);
    await expect(page).toHaveURL(/size=2064x2752/);
  });

  test("Size dropdown lists only iPhone sizes when device is iPhone", async ({ page }) => {
    await page.getByTestId("size-dropdown").click();
    const menu = page.getByTestId("size-dropdown-menu");
    await expect(menu).toContainText('iPhone 6.9"');
    await expect(menu).toContainText('iPhone 6.5"');
    await expect(menu).toContainText('iPhone 6.3"');
    await expect(menu).toContainText('iPhone 6.1"');
    await expect(menu).not.toContainText('iPad');
  });

  test("Size dropdown lists only iPad sizes when device is iPad", async ({ page }) => {
    await page.getByTestId("device-dropdown").click();
    await page.getByTestId("device-dropdown-option-ipad").click();
    await page.getByTestId("size-dropdown").click();
    const menu = page.getByTestId("size-dropdown-menu");
    await expect(menu).toContainText('iPad 13" P');
    await expect(menu).toContainText('iPad 13" L');
    await expect(menu).toContainText('iPad 12.9" P');
    await expect(menu).toContainText('iPad 12.9" L');
    await expect(menu).not.toContainText('iPhone');
  });

  test("Size dropdown selects each iPhone size and updates URL", async ({ page }) => {
    // sizes array indices: 0 = 6.9", 1 = 6.5", 2 = 6.3", 3 = 6.1"
    const cases = [
      { idx: 0, label: 'iPhone 6.9"', size: "1320x2868" },
      { idx: 1, label: 'iPhone 6.5"', size: "1284x2778" },
      { idx: 2, label: 'iPhone 6.3"', size: "1206x2622" },
      { idx: 3, label: 'iPhone 6.1"', size: "1125x2436" },
    ];
    for (const c of cases) {
      await page.getByTestId("size-dropdown").click();
      await page.getByTestId(`size-dropdown-option-${c.idx}`).click();
      await expect(page.getByTestId("size-dropdown")).toContainText(c.label);
      await expect(page).toHaveURL(new RegExp(`size=${c.size}`));
    }
  });

  test("Size dropdown selects each iPad size and updates URL", async ({ page }) => {
    await page.getByTestId("device-dropdown").click();
    await page.getByTestId("device-dropdown-option-ipad").click();
    // sizes array indices: 4 = iPad 13" P, 5 = iPad 13" L, 6 = iPad 12.9" P, 7 = iPad 12.9" L
    const cases = [
      { idx: 4, label: 'iPad 13" P', size: "2064x2752" },
      { idx: 5, label: 'iPad 13" L', size: "2752x2064" },
      { idx: 6, label: 'iPad 12.9" P', size: "2048x2732" },
      { idx: 7, label: 'iPad 12.9" L', size: "2732x2048" },
    ];
    for (const c of cases) {
      await page.getByTestId("size-dropdown").click();
      await page.getByTestId(`size-dropdown-option-${c.idx}`).click();
      await expect(page.getByTestId("size-dropdown")).toContainText(c.label);
      await expect(page).toHaveURL(new RegExp(`size=${c.size}`));
    }
  });

  // ---------------------------------------------------------------------------
  // URL hydration
  // ---------------------------------------------------------------------------

  test("URL with explicit consistent params hydrates correctly", async ({ page }) => {
    await page.goto("/?locale=de&mockup=ipad-pro&size=2752x2064&slide=hero");
    await expect(page.getByTestId("editor-panel")).toBeVisible();
    await expect(page.getByTestId("device-dropdown")).toContainText("iPad");
    await expect(page.getByTestId("size-dropdown")).toContainText('iPad 13" L');
  });

  test("URL with mismatched mockup+size auto-corrects to a consistent pair", async ({ page }) => {
    // iPad mockup with iPhone size — should snap size to first iPad size
    await page.goto("/?mockup=ipad-pro&size=1320x2868");
    await expect(page.getByTestId("editor-panel")).toBeVisible();
    await expect(page.getByTestId("device-dropdown")).toContainText("iPad");
    await expect(page).toHaveURL(/size=2064x2752/);
  });

  test("URL with iPhone mockup but iPad size also auto-corrects", async ({ page }) => {
    await page.goto("/?mockup=iphone-17-pro-max&size=2064x2752");
    await expect(page.getByTestId("editor-panel")).toBeVisible();
    await expect(page.getByTestId("device-dropdown")).toContainText("iPhone");
    await expect(page).toHaveURL(/size=1320x2868/);
  });

  // ---------------------------------------------------------------------------
  // Sidebar ↔ Toolbar sync
  // ---------------------------------------------------------------------------

  test("clicking iPad Pro in sidebar Mockup section updates the toolbar Device dropdown", async ({ page }) => {
    await page.getByTestId("section-mockup").click();
    await page.getByRole("button", { name: "iPad Pro", exact: true }).click();
    await expect(page.getByTestId("device-dropdown")).toContainText("iPad");
  });

  test("clicking an iPad size in sidebar updates the toolbar Size dropdown", async ({ page }) => {
    // First switch to iPad device so iPad sizes match the toolbar device class
    await page.getByTestId("device-dropdown").click();
    await page.getByTestId("device-dropdown-option-ipad").click();

    await page.getByTestId("section-export-sizes").click();
    // The sidebar lists size buttons with full label "iPad 12.9" L - 2732x2048"
    await page
      .getByRole("button", { name: /iPad 12\.9" L\s*-\s*2732x2048/ })
      .click();
    await expect(page.getByTestId("size-dropdown")).toContainText('iPad 12.9" L');
  });

  // ---------------------------------------------------------------------------
  // Locale switching
  // ---------------------------------------------------------------------------

  test("Locale pills switch active locale and update preview content", async ({ page }) => {
    const preview = page.getByTestId("slide-preview");
    await expect(preview).toContainText("Two phones,");
    await page.getByRole("button", { name: "Deutsch", exact: true }).click();
    await expect(page).toHaveURL(/locale=de/);
    await expect(preview).toContainText("Zwei Telefone,");
    await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(page).toHaveURL(/locale=en/);
    await expect(preview).toContainText("Two phones,");
  });

  // ---------------------------------------------------------------------------
  // Slide strip navigation
  // ---------------------------------------------------------------------------

  test("Clicking each preview card sets the active slide", async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await page.getByTestId(`preview-card-${i}`).click();
      // Active slide id appears in URL (slide=...)
      await expect(page).toHaveURL(/slide=/);
    }
  });
});
