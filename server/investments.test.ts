import { describe, expect, it } from "vitest";
import { hasUnpricedInvestments } from "@shared/investments";

describe("detecção de mercado desatualizado em investimentos", () => {
  it("detecta aporte positivo com valor de mercado zerado", () => {
    expect(hasUnpricedInvestments([{ investedAmount: "100.00", marketValue: "0.00" }])).toBe(true);
  });

  it("não alerta para ativo com valor de mercado atualizado", () => {
    expect(hasUnpricedInvestments([{ investedAmount: 100, marketValue: 102.5 }])).toBe(false);
  });

  it("ignora ativos sem aporte e suporta múltiplos ativos", () => {
    expect(hasUnpricedInvestments([
      { investedAmount: 0, marketValue: 0 },
      { investedAmount: 80, marketValue: 81 },
    ])).toBe(false);
    expect(hasUnpricedInvestments([
      { investedAmount: 0, marketValue: 0 },
      { investedAmount: 80, marketValue: 0 },
    ])).toBe(true);
  });
});
