import { describe, expect, it } from "vitest";
import { applyPreset, BASE, cleanText, COUNTDOWN_STAGES, exportName, iconStudioAccess, normalizeDesign, PRESETS } from "./iconStudio";

describe("Icon Update Studio plan access", () => {
  it("locks Guest", () => expect(iconStudioAccess("guest")).toBe("locked"));
  it("locks Free", () => expect(iconStudioAccess("free")).toBe("locked"));
  it("opens the standard tool on Starter", () => expect(iconStudioAccess("starter")).toBe("standard"));
  it("adds advanced features on Premium", () => expect(iconStudioAccess("premium")).toBe("advanced"));
  it("gives Scale/Enterprise everything", () => expect(iconStudioAccess("enterprise")).toBe("advanced"));
});

describe("countdown presets", () => {
  it("lists the 12 stages in order", () =>
    expect(COUNTDOWN_STAGES).toEqual(["24 HOURS", "12 HOURS", "6 HOURS", "5 HOURS", "4 HOURS", "3 HOURS", "2 HOURS", "1 HOUR", "45 MINS", "30 MINS", "15 MINS", "NOW!"]));
  it("keeps the user's countdown text when switching design preset", () =>
    expect(applyPreset(PRESETS.find((p) => p.id === "bold")!, "30 MINS").text).toBe("30 MINS"));
});

describe("custom text and saved designs", () => {
  it("trims, collapses spaces and caps text at 24 characters", () => {
    expect(cleanText("  UPDATE \n  SOON  ")).toBe("UPDATE SOON");
    expect(cleanText("X".repeat(40))).toHaveLength(24);
  });
  it("clamps out-of-range numbers and rejects bad colors/fonts", () => {
    const d = normalizeDesign({ glassSize: 999, dim: -5, textColor: "red;}", font: "comic", glass: "huge" });
    expect(d.glassSize).toBe(95);
    expect(d.dim).toBe(0);
    expect(d.textColor).toBe(BASE.textColor);
    expect(d.font).toBe(BASE.font);
    expect(d.glass).toBe(BASE.glass);
  });
  it("falls back to defaults for junk input", () => expect(normalizeDesign("nope")).toEqual(BASE));
});

describe("export filenames", () => {
  it("slugs the stage", () => expect(exportName("NOW!", "png")).toBe("outrun-icon-now.png"));
  it("uses .jpg for JPEG and numbers pack files", () => expect(exportName("24 HOURS", "jpeg", 0)).toBe("01-outrun-icon-24-hours.jpg"));
  it("never produces an empty name", () => expect(exportName("!!!", "webp")).toBe("outrun-icon-icon.webp"));
});
