import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("empty states dos módulos financeiros", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

  it("mantém um componente reutilizável e ações internas por contexto", () => {
    expect(source.match(/function EmptyState\(/g)).toHaveLength(1);
    expect(source).toContain('EmptyState icon={WalletCards}');
    expect(source).toContain('actionLabel="adicionar lançamento"');
    expect(source).toContain('EmptyState icon={Receipt}');
    expect(source).toContain('actionLabel="adicionar conta"');
    expect(source).toContain('EmptyState icon={TrendingUp}');
    expect(source).toContain('actionLabel="novo investimento"');
    expect(source).toContain('EmptyState icon={CreditCard}');
    expect(source).toContain('actionLabel="novo cartão"');
  });

  it("conecta cada ação vazia ao callback do módulo", () => {
    expect(source).toContain('actionLabel="adicionar lançamento" onAction={onAdd}');
    expect(source).toContain('actionLabel="adicionar conta" onAction={onAdd}');
    expect(source).toContain('actionLabel="novo investimento" onAction={onAdd}');
    expect(source).toContain('actionLabel="novo cartão" onAction={onAddCard}');
  });

  it("não apresenta uma fatura monetária quando não há cartão cadastrado", () => {
    expect(source).toContain('{cards.length ? <div className="statement-total">');
    expect(source).toContain('className="statement-total empty-statement-total"');
    expect(source).toContain("Cadastre um cartão para ver o resumo da fatura aqui.");
  });
});
