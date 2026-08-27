import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("alerta visual de contas atrasadas", () => {
  const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
  const cssSource = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

  it("ativa a variante urgente apenas quando o total de atrasadas é maior que zero", () => {
    expect(homeSource).toContain('late.length > 0 ? " has-overdue" : ""');
    expect(homeSource).toContain('urgent={late.length > 0}');
    expect(homeSource).toContain('data-urgent={urgent ? "true" : undefined}');
  });

  it("mantém Atrasadas no fluxo original e prioriza visualmente quando há urgência", () => {
    const regularCard = homeSource.indexOf('label="Vencimentos"');
    const overdueCard = homeSource.indexOf('label="Atrasadas"');
    expect(regularCard).toBeGreaterThan(-1);
    expect(overdueCard).toBeGreaterThan(regularCard);
    expect(cssSource).toContain(".stats-grid.has-overdue .stat-urgent { order: -1; }");
  });

  it("aplica superfície, borda, texto e sino de alerta nos dois temas", () => {
    expect(cssSource).toContain("--alert-bg: #3a211f;");
    expect(cssSource).toContain("--alert-bg: #fff1ee;");
    expect(cssSource).toContain(".stat-card.stat-urgent { border-color: var(--alert-border); background: var(--alert-bg);");
    expect(cssSource).toContain(".stat-icon-urgent { color: var(--alert-icon); fill: currentColor;");
    expect(cssSource).toContain("animation: overdue-bell-pulse");
    expect(cssSource).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
