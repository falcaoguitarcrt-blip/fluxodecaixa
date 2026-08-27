import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function parseHex(value: string) {
  const normalized = value.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255);
}

function relativeLuminance(value: string) {
  return parseHex(value).map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function tokenBlock(themeSelector: string, css: string) {
  const section = css.slice(css.indexOf("/* Contraste e superfícies"));
  const start = section.indexOf(themeSelector);
  const end = section.indexOf("}", start);
  return section.slice(start, end);
}

function token(name: string, block: string) {
  const match = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Token ${name} não encontrado`);
  return match[1];
}

describe("theme contrast tokens", () => {
  const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
  const dark = tokenBlock(".app-shell {", css);
  const light = tokenBlock(".app-shell.light-mode {", css);

  it.each([
    ["text-primary", "bg-surface"],
    ["text-secondary", "bg-surface"],
    ["text-muted", "bg-surface"],
    ["text-secondary", "bg-surface-soft"],
    ["text-muted", "bg-surface-soft"],
  ])("keeps %s over %s at WCAG AA in dark mode", (foreground, background) => {
    expect(contrastRatio(token(foreground, dark), token(background, dark))).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ["text-primary", "bg-surface"],
    ["text-secondary", "bg-surface"],
    ["text-muted", "bg-surface"],
    ["text-secondary", "bg-surface-soft"],
    ["text-muted", "bg-surface-soft"],
  ])("keeps %s over %s at WCAG AA in light mode", (foreground, background) => {
    expect(contrastRatio(token(foreground, light), token(background, light))).toBeGreaterThanOrEqual(4.5);
  });

  it("declares semantic overrides for the requested financial surfaces", () => {
    for (const selector of [".sidebar", ".assistant-card", ".word-day-card", ".transaction-list", ".table-panel", ".card-statement"]) {
      expect(css).toContain(`.app-shell ${selector}`);
    }
    for (const selector of [".chart-panel", ".routine-panel", ".commitment-panel"]) {
      expect(css).toContain(`.app-shell .panel`);
      expect(css).toContain(selector);
    }
  });
});
