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

import { buildCardsSummary, buildFinanceSeries, calculateCommitment } from "./db";

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
