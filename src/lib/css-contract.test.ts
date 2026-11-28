import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [path] : [];
  });
}

function readColor(block: string, name: string): string {
  const value = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (!value) throw new Error(`Missing CSS color token --${name}`);
  return value;
}

function luminance(hex: string): number {
  const channels =
    hex
      .slice(1)
      .match(/.{2}/g)
      ?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [];
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function classLiterals(expression: string): string[] {
  const conditional = expression.lastIndexOf("?");
  const candidates =
    conditional >= 0 ? expression.slice(conditional + 1) : expression;
  return [...candidates.matchAll(/["']([^"']*)["']/g)].map((match) => match[1]);
}

describe("CSS visual and accessibility contract", () => {
  it("keeps all authored text at or above 12px", () => {
    const sizes = [...css.matchAll(/font-size\s*:\s*([\d.]+)px/g)].map(
      (match) => Number(match[1]),
    );
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(12);
  });

  it("meets text and control-border contrast tokens in both themes", () => {
    const dark = css.slice(
      css.indexOf(":root {"),
      css.indexOf('[data-theme="morning"]'),
    );
    const lightStart = css.indexOf('[data-theme="morning"]');
    const light = css.slice(lightStart, css.indexOf("@media", lightStart));

    for (const theme of [dark, light]) {
      const background = readColor(theme, "background");
      const surface = readColor(theme, "surface");
      const ink = readColor(theme, "ink");
      const muted = readColor(theme, "muted");
      const border = readColor(theme, "control-border");
      expect(contrast(ink, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(ink, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(muted, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(muted, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(border, surface)).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps JSX classes and CSS selectors in sync", () => {
    const used = new Set<string>();
    const dynamicPrefixes = new Set<string>();
    for (const file of sourceFiles(resolve(root, "src"))) {
      const source = readFileSync(file, "utf8");
      const attributes = source.matchAll(
        /className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{([\s\S]*?)\})/g,
      );
      for (const attribute of attributes) {
        const plain = attribute[1] ?? attribute[2];
        const template = attribute[3];
        const expression = attribute[4];
        const content = plain ?? template ?? expression ?? "";
        for (const prefix of content.matchAll(/([A-Za-z_][\w-]*-)\$\{/g))
          dynamicPrefixes.add(prefix[1]);
        const literalContent = plain
          ? plain
          : template
            ? template.replace(
                /\$\{([^}]*)\}/g,
                (_match, innerExpression: string) =>
                  classLiterals(innerExpression).join(" "),
              )
            : classLiterals(expression ?? "").join(" ");
        const tokens = literalContent.match(/[A-Za-z_][\w-]*/g) ?? [];
        for (const token of tokens) {
          if (!token.endsWith("-") || !dynamicPrefixes.has(token))
            used.add(token);
        }
      }
    }

    const defined = new Set(
      [...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]),
    );
    for (const selector of defined) {
      if ([...dynamicPrefixes].some((prefix) => selector.startsWith(prefix)))
        used.add(selector);
    }
    const missingRules = [...used].filter(
      (className) => !defined.has(className),
    );
    const unusedRules = [...defined].filter(
      (className) => !used.has(className),
    );
    expect({ missingRules, unusedRules }).toEqual({
      missingRules: [],
      unusedRules: [],
    });
  });
});
