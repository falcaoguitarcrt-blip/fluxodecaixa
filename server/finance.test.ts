import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "finance-test-user",
      name: "Finance Test",
      email: "finance@example.com",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("finance procedures", () => {
  it("rejects invalid transaction amounts before touching the database", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.createTransaction({
      profileId: 1,
      date: new Date(),
      description: "Teste inválido",
      category: "Casa",
      bank: "Inter",
      direction: "out",
      amount: 0,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects blank descriptions", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.createTransaction({
      profileId: 1,
      date: new Date(),
      description: " ",
      category: "Casa",
      bank: "Inter",
      direction: "out",
      amount: 10,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

import { buildCardsSummary, buildFinanceSeries, calculateCommitment, filterTransactions, filterBills, filterInvestments, filterCardPurchases } from "./db";

describe("finance calculations", () => {
  it("groups card purchases by card and separates installment from total", () => {
    expect(buildCardsSummary([{ id: 1, name: "Inter" }, { id: 2, name: "Rico" }], [
      { cardId: 1, installmentAmount: "25.00", totalAmount: "100.00" },
      { cardId: 1, installmentAmount: "40.00", totalAmount: "40.00" },
      { cardId: 2, installmentAmount: "12.50", totalAmount: "50.00" },
    ])).toEqual([
      { cardId: 1, name: "Inter", installmentAmount: 65, totalAmount: 140 },
      { cardId: 2, name: "Rico", installmentAmount: 12.5, totalAmount: 50 },
    ]);
  });

  it("calculates commitment from expenses, bills and card installments", () => {
    expect(calculateCommitment(1000, 400, 100, 50)).toBe(55);
    expect(calculateCommitment(0, 100, 50, 25)).toBe(0);
  });

  it("builds an ordered daily series for income and expenses", () => {
    expect(buildFinanceSeries([
      { date: new Date("2026-08-21T12:00:00Z"), direction: "out", amount: "20.00" },
      { date: new Date("2026-08-20T12:00:00Z"), direction: "in", amount: "100.00" },
      { date: new Date("2026-08-20T12:00:00Z"), direction: "out", amount: "15.00" },
    ])).toEqual([
      { date: "2026-08-20", income: 100, expenses: 15 },
      { date: "2026-08-21", income: 0, expenses: 20 },
    ]);
  });
});


describe("finance filters", () => {
  it("filters transactions by month, bank and category", () => {
    const rows = [
      { date: new Date("2026-08-10T12:00:00Z"), bank: "Inter", category: "Casa" },
      { date: new Date("2026-08-11T12:00:00Z"), bank: "Rico", category: "Casa" },
      { date: new Date("2026-07-11T12:00:00Z"), bank: "Inter", category: "Casa" },
    ].map((row, index) => ({ ...row, id: index + 1, userId: 1, profileId: 1, description: `Registro ${index}`, direction: "out" as const, amount: "10.00", notes: null, createdAt: new Date(), updatedAt: new Date() }));
    expect(filterTransactions(rows, { month: "2026-08", bank: "Inter", category: "Casa" })).toHaveLength(1);
  });

  it("filters bills by month and status and supports an empty result", () => {
    const rows = [
      { id: 1, dueDate: new Date("2026-08-31T12:00:00Z"), status: "pending" as const },
      { id: 2, dueDate: new Date("2026-07-31T12:00:00Z"), status: "paid" as const },
    ].map((row) => ({ ...row, userId: 1, profileId: 1, description: "Conta", amount: "100.00", responsible: "Felipe", createdAt: new Date(), updatedAt: new Date() }));
    expect(filterBills(rows, { month: "2026-08", status: "paid" })).toHaveLength(0);
  });

  it("filters investments by period, institution and category", () => {
    const rows = [
      { id: 1, investedAt: new Date("2026-08-10T12:00:00Z"), institution: "Inter", category: "Renda fixa" },
      { id: 2, investedAt: new Date("2026-08-10T12:00:00Z"), institution: "Rico", category: "Ações" },
    ].map((row) => ({ ...row, userId: 1, profileId: 1, description: "Ativo", investedAmount: "10.00", marketValue: "11.00", createdAt: new Date(), updatedAt: new Date() }));
    expect(filterInvestments(rows, { month: "2026-08", bank: "Inter", category: "Renda fixa" })).toHaveLength(1);
  });

  it("filters card purchases by period and card", () => {
    const rows = [
      { id: 1, purchaseDate: new Date("2026-08-10T12:00:00Z"), cardId: 1 },
      { id: 2, purchaseDate: new Date("2026-08-10T12:00:00Z"), cardId: 2 },
    ].map((row) => ({ ...row, userId: 1, profileId: 1, description: "Compra", category: "Casa", totalAmount: "100.00", installmentAmount: "50.00", installments: 2, currentInstallment: 1, createdAt: new Date(), updatedAt: new Date() }));
    expect(filterCardPurchases(rows, { month: "2026-08", cardId: 2 })).toHaveLength(1);
  });
});
