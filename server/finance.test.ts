import { describe, expect, it, vi } from "vitest";

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, bulkCreateTransactions: vi.fn().mockResolvedValue({ created: 2, skipped: 1 }) };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { dateKeyFromDate, isValidMonthKey, monthKeyFromDate, monthOptions, monthStartDate } from "../shared/calendar";

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

  it("accepts a YYYY-MM month in the routine query", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.routine({ profileId: 1, month: "2026-08" })).resolves.toMatchObject({ budgetSummary: [] });
  });

  it("rejects semantically impossible months", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.routine({ profileId: 1, month: "2026-00" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.finance.couple({ month: "2026-13" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires profile and month context for bill status changes", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.markBillPaid({ id: 1, paid: true } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.finance.markBillPaid({ id: 1, profileId: 1, month: "2026-13", paid: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.finance.updateBill({ id: 1, description: "Conta" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("does not accept late as a manually persisted bill status", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.createBill({ profileId: 1, description: "Conta", dueDate: new Date(), amount: 10, responsible: "Felipe", status: "late" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

import { buildCardsSummary, buildFinanceSeries, calculateCommitment, filterTransactions, filterBills, filterInvestments, filterCardPurchases, buildBudgetSummary, billStatusAuditAction, resolveBillStatus, buildBillAlertSummary, dedupeTransactionRows, restoreFinanceSnapshot, calculateSavingsGoalProgress, assertSavingsGoalProfile, assertSavingsGoalAccess, buildCoupleDashboard, buildCoupleDashboardForUser, buildCardStatementDetails, recurringOccurrenceDate, isRecurringRuleActiveInMonth } from "./db";
import { parseFinanceCsv, serializeFinanceCsv } from "../shared/financeCsv";

describe("finance calculations", () => {
  it("validates calendar months and preserves civil date keys", () => {
    expect(isValidMonthKey("2026-08")).toBe(true);
    expect(isValidMonthKey("2026-00")).toBe(false);
    expect(isValidMonthKey("2026-13")).toBe(false);
    expect(dateKeyFromDate("2026-08-31")).toBe("2026-08-31");
    expect(monthKeyFromDate(new Date("2026-09-01T00:30:00-03:00"))).toBe("2026-09");
    expect(monthOptions("2026-01", 1)).toEqual(["2025-12", "2026-01", "2026-02"]);
    expect(monthStartDate("2026-08").toISOString()).toBe("2026-08-01T12:00:00.000Z");
  });

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

  it("calculates monthly budget consumption by category", () => {
    expect(buildBudgetSummary([{ month: "2026-08", category: "Casa", amount: "500.00" }], [
      { date: new Date("2026-08-10T12:00:00Z"), category: "Casa", direction: "out", amount: "125.00" },
      { date: new Date("2026-08-11T12:00:00Z"), category: "Casa", direction: "out", amount: "75.00" },
      { date: new Date("2026-08-11T12:00:00Z"), category: "Casa", direction: "in", amount: "999.00" },
    ], "2026-08")).toEqual([{ category: "Casa", limit: 500, spent: 200, remaining: 300, percent: 40 }]);
  });

  it("classifies bill status audit events without confusing payment and reopening", () => {
    expect(billStatusAuditAction("pending", "paid")).toBe("payment");
    expect(billStatusAuditAction("paid", "pending")).toBe("reopen");
    expect(billStatusAuditAction("pending", "pending")).toBe("update");
  });

  it("resolves overdue and paid bill statuses from the due date", () => {
    const now = new Date("2026-08-27T12:00:00Z");
    expect(resolveBillStatus({ status: "pending", dueDate: new Date("2026-08-20T12:00:00Z") }, now)).toBe("late");
    expect(resolveBillStatus({ status: "pending", dueDate: new Date("2026-08-30T12:00:00Z") }, now)).toBe("pending");
    expect(resolveBillStatus({ status: "paid", dueDate: new Date("2026-08-20T12:00:00Z") }, now)).toBe("paid");
  });

  it("scopes bill alerts to the selected month", () => {
    const alerts = buildBillAlertSummary([
      { status: "pending" as const, dueDate: new Date("2026-08-20T12:00:00Z") },
      { status: "pending" as const, dueDate: new Date("2026-09-10T12:00:00Z") },
    ], new Date("2026-08-27T12:00:00Z"), "2026-08");
    expect(alerts.overdueBills).toHaveLength(1);
    expect(alerts.upcomingBills).toHaveLength(0);
  });

  it("builds overdue and upcoming bill alerts in date order", () => {
    const alerts = buildBillAlertSummary([
      { status: "pending" as const, dueDate: new Date("2026-09-10T12:00:00Z") },
      { status: "pending" as const, dueDate: new Date("2026-08-20T12:00:00Z") },
      { status: "paid" as const, dueDate: new Date("2026-08-18T12:00:00Z") },
    ], new Date("2026-08-27T12:00:00Z"));
    expect(alerts.overdueBills).toHaveLength(1);
    expect(alerts.upcomingBills[0]?.dueDate.toISOString()).toBe("2026-09-10T12:00:00.000Z");
  });

  it("parses valid CSV rows and reports malformed rows", () => {
    const parsed = parseFinanceCsv("data,descrição,categoria,banco,tipo,valor\n2026-08-21,Salário,Renda,Inter,entrada,não\n2026-99-40,Inválido,Casa,Inter,saída,10");
    expect(parsed.rows).toHaveLength(0);
    expect(parsed.rejected).toHaveLength(2);

    const valid = parseFinanceCsv("data,descrição,categoria,banco,tipo,valor\n2026-08-21,Salário,Renda,Inter,entrada,1200.00");
    expect(valid.rows).toEqual([{ date: "2026-08-21", description: "Salário", category: "Renda", bank: "Inter", direction: "in", amount: 1200 }]);
  });

  it("serializes finance rows with escaped descriptions", () => {
    const csv = serializeFinanceCsv([{ date: "2026-08-21", description: "Mercado, feira", category: "Casa", bank: "Inter", direction: "out", amount: 35.5 }]);
    expect(csv).toContain('"Mercado, feira"');
    expect(csv).toContain("saída");
  });

  it("deduplicates imports against existing rows and within the same CSV", () => {
    const rows = [
      { date: "2026-08-21", description: "Mercado", category: "Casa", bank: "Inter", direction: "out" as const, amount: 35.5 },
      { date: "2026-08-21", description: "Mercado", category: "Casa", bank: "Inter", direction: "out" as const, amount: 35.5 },
      { date: "2026-08-22", description: "Salário", category: "Renda", bank: "Inter", direction: "in" as const, amount: 1200 },
    ];
    const unique = dedupeTransactionRows([{ ...rows[0], date: new Date("2026-08-21T12:00:00Z"), amount: "35.50" }], rows);
    expect(unique).toHaveLength(1);
    expect(unique[0]?.description).toBe("Salário");
  });

  it("rejects an invalid import payload before database access", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.importTransactions({ profileId: 1, rows: [{ date: "2026-08", description: "Inválido", category: "Casa", bank: "Inter", direction: "out", amount: 10 }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects invalid backup snapshots before database access", async () => {
    await expect(restoreFinanceSnapshot(1, 1, { version: 2, data: {} })).rejects.toThrow("Snapshot inválido");
    await expect(restoreFinanceSnapshot(1, 1, { version: 1, data: { transactions: [{ date: "bad", description: "x", category: "x", bank: "x", direction: "out", amount: 1 }] } })).rejects.toThrow("data ou valor inválido");
  });

  it("returns created and skipped counts for a valid CSV import", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.importTransactions({ profileId: 1, rows: [{ date: "2026-08-21", description: "Mercado", category: "Casa", bank: "Inter", direction: "out", amount: 35.5 }] })).resolves.toEqual({ created: 2, skipped: 1 });
  });
});

describe("recurring transaction materialization rules", () => {
  it("creates a civil occurrence and clamps day 31 to shorter months", () => {
    expect(recurringOccurrenceDate({ dayOfMonth: 31, startDate: new Date("2026-01-01T12:00:00Z"), endDate: null }, "2026-02")?.toISOString()).toBe("2026-02-28T12:00:00.000Z");
  });

  it("respects exact start/end dates and inactive rules", () => {
    const rule = { dayOfMonth: 20, startDate: new Date("2026-08-15T12:00:00Z"), endDate: new Date("2026-10-15T12:00:00Z") };
    expect(recurringOccurrenceDate({ ...rule, dayOfMonth: 10 }, "2026-08")).toBeNull();
    expect(recurringOccurrenceDate(rule, "2026-09")?.toISOString()).toBe("2026-09-20T12:00:00.000Z");
    expect(recurringOccurrenceDate(rule, "2026-10")).toBeNull();
    expect(isRecurringRuleActiveInMonth({ ...rule, active: 1 }, "2026-09")).toBe(true);
    expect(isRecurringRuleActiveInMonth({ ...rule, active: 0 }, "2026-09")).toBe(false);
  });

  it("rejects invalid competence before any materialization attempt", () => {
    expect(() => recurringOccurrenceDate({ dayOfMonth: 1, startDate: new Date("2026-01-01T12:00:00Z"), endDate: null }, "2026-13")).toThrow("Mês inválido");
  });
});

describe("card statement details", () => {
  it("uses the civil month when a statement reaches a month boundary", () => {
    const details = buildCardStatementDetails([{ id: 1, name: "Cartão", brand: "Visa", dueDay: 31, closingDay: 20 }], [], "2024-01");
    expect(details[0]?.dueDate.toISOString()).toBe("2024-02-29T12:00:00.000Z");
  });

  it("derives the statement month, due date, totals and status per card", () => {
    const details = buildCardStatementDetails([
      { id: 1, name: "Inter", brand: "Visa", dueDay: 20, closingDay: 13 },
      { id: 2, name: "Nubank", brand: "Mastercard", dueDay: 10, closingDay: 3 },
    ], [{ cardId: 1, totalAmount: "120.00", installmentAmount: "40.00" }], "2026-08");
    expect(details[0]).toMatchObject({ cardId: 1, statementMonth: "2026-08", purchaseCount: 1, installmentAmount: 40, totalAmount: 120, status: "open" });
    expect(details[0]?.dueDate.toISOString().slice(0, 10)).toBe("2026-09-20");
    expect(details[1]).toMatchObject({ cardId: 2, purchaseCount: 0, installmentAmount: 0, totalAmount: 0, status: "empty" });
  });
});

describe("couple dashboard aggregation", () => {
  it("consolidates profile totals, cards and institutions without static fallback values", () => {
    const result = buildCoupleDashboard([
      { profileKey: "felipe", displayName: "Felipe", profileId: 1, summary: { income: 3000, expenses: 1000, balance: 2000, invested: 4000, investedAmount: 3500, billsPending: 100, cardInstallments: 50, cardTotal: 100 }, cards: [{ id: 10, name: "Inter Felipe", brand: "Visa", dueDay: 20, closingDay: 13 }], purchases: [{ cardId: 10, totalAmount: "100.00", installmentAmount: "50.00" }], investments: [{ institution: "Inter", investedAmount: "3500.00", marketValue: "4000.00" }], bills: [{}] },
      { profileKey: "sara", displayName: "Sara", profileId: 2, summary: { income: 1000, expenses: 200, balance: 800, invested: 1500, investedAmount: 1500, billsPending: 50, cardInstallments: 25, cardTotal: 40 }, cards: [{ id: 11, name: "Nubank Sara", brand: "Mastercard", dueDay: 10, closingDay: 3 }], purchases: [{ cardId: 11, totalAmount: "40.00", installmentAmount: "25.00" }], investments: [{ institution: "Inter", investedAmount: "1500.00", marketValue: "1500.00" }], bills: [{}, {}] },
    ]);
    expect(result.summary).toMatchObject({ income: 4000, expenses: 1200, balance: 2800, invested: 5500, investedAmount: 5000, investmentResult: 500, billsPending: 150, cardInstallments: 75, cardTotal: 140, commitment: 35.63, totalCards: 2, totalBills: 3 });
    expect(result.profiles.map((profile) => profile.profileKey)).toEqual(["felipe", "sara"]);
    expect(result.cards.map((card) => card.purchaseCount)).toEqual([1, 1]);
    expect(result.institutions).toEqual([{ institution: "Inter", marketValue: 5500, profiles: ["felipe", "sara"] }]);
  });

  it("filters the consolidated snapshot by authenticated user and keeps only Felipe/Sara profiles", () => {
    const sharedPart = { profileKey: "felipe" as const, displayName: "Felipe", profileId: 1, userId: 7, summary: { income: 100, expenses: 25, balance: 75, invested: 10, investedAmount: 8, billsPending: 0, cardInstallments: 0, cardTotal: 0 }, cards: [], purchases: [], investments: [], bills: [] };
    const foreignPart = { ...sharedPart, userId: 99, profileId: 99 };
    const saraPart = { ...sharedPart, profileKey: "sara" as const, displayName: "Sara", profileId: 2 };
    const result = buildCoupleDashboardForUser(7, [sharedPart, saraPart, foreignPart, { ...sharedPart, profileKey: "other" as never }]);
    expect(result.profiles.map((profile) => profile.profileKey)).toEqual(["felipe", "sara"]);
    expect(result.summary.income).toBe(200);
  });

  it("returns an honest empty consolidated state and validates the month contract", async () => {
    const empty = buildCoupleDashboard([]);
    expect(empty.summary).toMatchObject({ income: 0, expenses: 0, balance: 0, invested: 0, commitment: 0, totalCards: 0, totalBills: 0 });
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.couple({ month: "2026-8" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const response = await caller.finance.couple({ month: "2026-08" });
    expect(response.summary).toEqual(expect.objectContaining({ income: expect.any(Number), expenses: expect.any(Number), balance: expect.any(Number), invested: expect.any(Number), investedAmount: expect.any(Number), investmentResult: expect.any(Number) }));
    expect(response.profiles.every((profile) => profile.profileKey === "felipe" || profile.profileKey === "sara")).toBe(true);
  });
});

describe("priority 7 form contracts", () => {
  it("rejects an invalid bill amount", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.createBill({
      profileId: 1,
      description: "Aluguel",
      dueDate: new Date(),
      amount: 0,
      responsible: "Felipe",
      status: "pending",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects negative investment market values", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.createInvestment({
      profileId: 1,
      description: "CDB",
      category: "Renda fixa",
      institution: "Inter",
      investedAmount: 100,
      marketValue: -1,
      investedAt: new Date(),
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects card days outside the calendar range", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.createCreditCard({
      profileId: 1,
      name: "Cartão teste",
      brand: "Visa",
      dueDay: 32,
      closingDay: 13,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects purchases with an invalid installment count", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.createCardPurchase({
      profileId: 1,
      cardId: 1,
      description: "Compra teste",
      category: "Casa",
      purchaseDate: new Date(),
      totalAmount: 100,
      installments: 0,
      currentInstallment: 1,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

  it("rejects a current installment greater than the total on card purchases", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.createCardPurchase({
      profileId: 1,
      cardId: 1,
      description: "Compra inconsistente",
      category: "Casa",
      purchaseDate: new Date(),
      totalAmount: 100,
      installments: 2,
      currentInstallment: 3,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("validates savings goal amounts before database access", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.createSavingsGoal({ profileId: 1, name: "Reserva", category: "Segurança", targetAmount: 0, currentAmount: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.finance.createSavingsGoal({ profileId: 1, name: "Reserva", category: "Segurança", targetAmount: 1000, currentAmount: -1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("calculates savings goal progress and caps completed goals at 100%", () => {
    expect(calculateSavingsGoalProgress("250.00", "1000.00")).toBe(25);
    expect(calculateSavingsGoalProgress(1250, 1000)).toBe(100);
    expect(calculateSavingsGoalProgress(100, 0)).toBe(0);
  });

  it("rejects non-Sara and cross-user profiles through the savings goal access gate", async () => {
    expect(() => assertSavingsGoalProfile("felipe")).toThrow("perfil Sara");
    expect(assertSavingsGoalProfile("sara")).toBe(true);
    expect(() => assertSavingsGoalAccess({ id: 2, userId: 1, profileKey: "felipe" }, 1, 2)).toThrow("perfil Sara");
    expect(() => assertSavingsGoalAccess({ id: 2, userId: 99, profileKey: "sara" }, 1, 2)).toThrow("Perfil financeiro não encontrado");
    expect(assertSavingsGoalAccess({ id: 2, userId: 1, profileKey: "sara" }, 1, 2)).toBe(true);
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.savingsGoals({ profileId: 1, profileKey: "felipe" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.finance.createSavingsGoal({ profileId: 1, profileKey: "felipe", name: "Reserva", category: "Segurança", targetAmount: 1000, currentAmount: 0 } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });


describe("priority 11 contextual operations", () => {
  it("rejects invalid category payloads before database access", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.createCategory({ profileId: 1, name: "   ", direction: "out" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.finance.createCategory({ profileId: 1, name: "Mercado", direction: "other" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.finance.updateCategory({ id: 0, name: "Casa" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects destructive transaction requests without a positive identifier", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.finance.deleteTransaction({ id: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
