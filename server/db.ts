import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bills, cardPurchases, creditCards, financeProfiles, investments, transactions, trashItems, recurringRules, budgets, reminders, financeAuditLogs, financeBackups } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { CsvTransaction } from "../shared/financeCsv";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function recordFinanceAudit(input: typeof financeAuditLogs.$inferInsert) {
  const db = await getDb(); if (!db) return false;
  await db.insert(financeAuditLogs).values(input);
  return true;
}

export async function listFinanceAudit(userId: number, limit = 50) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(financeAuditLogs).where(eq(financeAuditLogs.userId, userId)).orderBy(desc(financeAuditLogs.createdAt)).limit(Math.min(limit, 100));
}

export async function createFinanceBackup(userId: number, label = "Backup manual") {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const data = await listFinanceData(userId);
  const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data });
  const result = await db.insert(financeBackups).values({ userId, label, payload });
  await recordFinanceAudit({ userId, action: "create", entityType: "backup", entityId: Number(result[0]?.insertId ?? 0), summary: label });
  return { id: Number(result[0]?.insertId ?? 0), label, createdAt: new Date(), payload };
}

export async function listFinanceBackups(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: financeBackups.id, label: financeBackups.label, createdAt: financeBackups.createdAt }).from(financeBackups).where(eq(financeBackups.userId, userId)).orderBy(desc(financeBackups.createdAt)).limit(20);
}

export async function getFinanceBackup(userId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(financeBackups).where(and(eq(financeBackups.id, id), eq(financeBackups.userId, userId))).limit(1);
  return rows[0];
}

export async function restoreFinanceSnapshot(userId: number, profileId: number, snapshot: unknown) {
  const candidate = snapshot as { version?: unknown; data?: { transactions?: unknown[] } };
  if (candidate.version !== 1 || !candidate.data || !Array.isArray(candidate.data.transactions)) throw new Error("Snapshot inválido");
  const rows: CsvTransaction[] = candidate.data.transactions.map((row) => {
    const item = row as Record<string, unknown>;
    const direction = item.direction === "in" || item.direction === "out" ? item.direction : null;
    if (typeof item.date !== "string" || typeof item.description !== "string" || typeof item.category !== "string" || typeof item.bank !== "string" || !direction || typeof item.amount !== "number" && typeof item.amount !== "string") throw new Error("Snapshot contém lançamento inválido");
    return { date: item.date.slice(0, 10), description: item.description, category: item.category, bank: item.bank, direction, amount: Number(item.amount) };
  });
  if (rows.some((row) => !Number.isFinite(row.amount) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(row.date))) throw new Error("Snapshot contém data ou valor inválido");
  const result = await bulkCreateTransactions(userId, profileId, rows);
  await recordFinanceAudit({ userId, profileId, action: "restore", entityType: "backup", summary: `${result.created} lançamento(s) restaurado(s)` });
  return result;
}

export async function ensureFinanceProfiles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const current = await db.select().from(financeProfiles).where(eq(financeProfiles.userId, userId));
  if (current.length) return current;
  await db.insert(financeProfiles).values([
    { userId, profileKey: "felipe", displayName: "Felipe" },
    { userId, profileKey: "sara", displayName: "Sara" },
  ]);
  return db.select().from(financeProfiles).where(eq(financeProfiles.userId, userId));
}

export async function listFinanceData(userId: number, profileId?: number) {
  const db = await getDb();
  if (!db) return { profiles: [], transactions: [], bills: [], investments: [], cards: [], purchases: [], trash: [] };
  const profiles = await ensureFinanceProfiles(userId);
  const txWhere = profileId ? and(eq(transactions.userId, userId), eq(transactions.profileId, profileId)) : eq(transactions.userId, userId);
  const billWhere = profileId ? and(eq(bills.userId, userId), eq(bills.profileId, profileId)) : eq(bills.userId, userId);
  const investmentWhere = profileId ? and(eq(investments.userId, userId), eq(investments.profileId, profileId)) : eq(investments.userId, userId);
  const cardWhere = profileId ? and(eq(creditCards.userId, userId), eq(creditCards.profileId, profileId)) : eq(creditCards.userId, userId);
  const purchaseWhere = profileId ? and(eq(cardPurchases.userId, userId), eq(cardPurchases.profileId, profileId)) : eq(cardPurchases.userId, userId);
  const recurringWhere = profileId ? and(eq(recurringRules.userId, userId), eq(recurringRules.profileId, profileId)) : eq(recurringRules.userId, userId);
  const budgetWhere = profileId ? and(eq(budgets.userId, userId), eq(budgets.profileId, profileId)) : eq(budgets.userId, userId);
  const reminderWhere = profileId ? and(eq(reminders.userId, userId), eq(reminders.profileId, profileId)) : eq(reminders.userId, userId);
  const [tx, billRows, investmentRows, cardRows, purchaseRows, trashRows, recurringRows, budgetRows, reminderRows] = await Promise.all([
    db.select().from(transactions).where(txWhere).orderBy(desc(transactions.date)),
    db.select().from(bills).where(billWhere).orderBy(desc(bills.dueDate)),
    db.select().from(investments).where(investmentWhere).orderBy(desc(investments.investedAt)),
    db.select().from(creditCards).where(cardWhere).orderBy(desc(creditCards.createdAt)),
    db.select().from(cardPurchases).where(purchaseWhere).orderBy(desc(cardPurchases.purchaseDate)),
    db.select().from(trashItems).where(eq(trashItems.userId, userId)).orderBy(desc(trashItems.deletedAt)),
    db.select().from(recurringRules).where(recurringWhere).orderBy(desc(recurringRules.createdAt)),
    db.select().from(budgets).where(budgetWhere).orderBy(desc(budgets.createdAt)),
    db.select().from(reminders).where(reminderWhere).orderBy(desc(reminders.dueDate)),
  ]);
  return { profiles, transactions: tx, bills: billRows, investments: investmentRows, cards: cardRows, purchases: purchaseRows, trash: trashRows, recurring: recurringRows, budgets: budgetRows, reminders: reminderRows };
}

export async function createTransaction(input: typeof transactions.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.insert(transactions).values(input);
  await recordFinanceAudit({ userId: input.userId, profileId: input.profileId, action: "create", entityType: "transaction", entityId: Number(result[0]?.insertId ?? 0), summary: input.description });
  return result[0]?.insertId;
}

export async function updateTransaction(userId: number, id: number, input: Partial<typeof transactions.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(transactions).set(input).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  const updated = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
  if (updated[0]) await recordFinanceAudit({ userId, profileId: updated[0].profileId, action: "update", entityType: "transaction", entityId: id, summary: updated[0].description });
  return updated;
}

function transactionSignature(row: { date: Date; description: string; category: string; bank: string; direction: "in" | "out"; amount: string | number }) {
  return [new Date(row.date).toISOString().slice(0, 10), row.description.trim().toLowerCase(), row.category.trim().toLowerCase(), row.bank.trim().toLowerCase(), row.direction, Number(row.amount).toFixed(2)].join("|");
}

export function dedupeTransactionRows(existing: Array<{ date: Date; description: string; category: string; bank: string; direction: "in" | "out"; amount: string | number }>, rows: CsvTransaction[]) {
  const known = new Set(existing.map(transactionSignature));
  return rows.filter((row) => {
    const signature = transactionSignature({ ...row, date: new Date(`${row.date}T12:00:00.000Z`) });
    if (known.has(signature)) return false;
    known.add(signature);
    return true;
  });
}

export async function bulkCreateTransactions(userId: number, profileId: number, rows: CsvTransaction[]) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ date: transactions.date, description: transactions.description, category: transactions.category, bank: transactions.bank, direction: transactions.direction, amount: transactions.amount }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.profileId, profileId)));
  const uniqueRows = dedupeTransactionRows(existing, rows);
  if (uniqueRows.length > 0) {
    await db.insert(transactions).values(uniqueRows.map((row) => ({ userId, profileId, date: new Date(`${row.date}T12:00:00.000Z`), description: row.description, category: row.category, bank: row.bank, direction: row.direction, amount: row.amount.toFixed(2) })));
  }
  return { created: uniqueRows.length, skipped: rows.length - uniqueRows.length };
}

export async function deleteTransaction(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const found = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
  if (!found[0]) return false;
  await db.insert(trashItems).values({ userId, entityType: "transaction", entityId: id, label: found[0].description, payload: JSON.stringify(found[0]) });
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  await recordFinanceAudit({ userId, profileId: found[0].profileId, action: "delete", entityType: "transaction", entityId: id, summary: found[0].description });
  return true;
}

export async function restoreTrash(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const found = await db.select().from(trashItems).where(and(eq(trashItems.id, id), eq(trashItems.userId, userId))).limit(1);
  const item = found[0]; if (!item) return false;
  if (item.entityType === "transaction") { const payload = JSON.parse(item.payload); delete payload.id; await db.insert(transactions).values(payload); }
  await db.delete(trashItems).where(and(eq(trashItems.id, id), eq(trashItems.userId, userId)));
  await recordFinanceAudit({ userId, profileId: item.entityType === "transaction" ? JSON.parse(item.payload).profileId : null, action: "restore", entityType: item.entityType, entityId: item.entityId, summary: item.label });
  return true;
}

export type FinanceFilters = { profileId?: number; month?: string; bank?: string; category?: string; cardId?: number };

export function calculateCommitment(income: number, expenses: number, billsPending: number, cardInstallments: number) {
  return income > 0 ? Number((((expenses + billsPending + cardInstallments) / income) * 100).toFixed(2)) : 0;
}

export function filterTransactions(rows: Array<typeof transactions.$inferSelect>, filters: Pick<FinanceFilters, "month" | "bank" | "category"> = {}) {
  return rows.filter((item) => {
    if (filters.bank && item.bank !== filters.bank) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.month && new Date(item.date).toISOString().slice(0, 7) !== filters.month) return false;
    return true;
  });
}

export function resolveBillStatus(item: { status: "pending" | "paid" | "late"; dueDate: Date }, now = new Date()) {
  if (item.status === "paid") return "paid" as const;
  return new Date(item.dueDate).getTime() < now.getTime() ? "late" as const : "pending" as const;
}

export function buildBillAlertSummary<T extends { status: "pending" | "paid" | "late"; dueDate: Date }>(rows: T[], now = new Date()) {
  return {
    overdueBills: rows.filter((item) => resolveBillStatus(item, now) === "late"),
    upcomingBills: rows.filter((item) => resolveBillStatus(item, now) === "pending").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5),
  };
}

export function filterBills(rows: Array<typeof bills.$inferSelect>, filters: { month?: string; status?: string } = {}, now = new Date()) {
  return rows.filter((item) => (!filters.status || resolveBillStatus(item, now) === filters.status) && (!filters.month || new Date(item.dueDate).toISOString().slice(0, 7) === filters.month));
}

export function filterInvestments(rows: Array<typeof investments.$inferSelect>, filters: Pick<FinanceFilters, "month" | "bank" | "category"> = {}) {
  return rows.filter((item) => (!filters.month || new Date(item.investedAt).toISOString().slice(0, 7) === filters.month) && (!filters.bank || item.institution === filters.bank) && (!filters.category || item.category === filters.category));
}

export function filterCardPurchases(rows: Array<typeof cardPurchases.$inferSelect>, filters: Pick<FinanceFilters, "month" | "cardId"> = {}) {
  return rows.filter((item) => (!filters.month || new Date(item.purchaseDate).toISOString().slice(0, 7) === filters.month) && (!filters.cardId || item.cardId === filters.cardId));
}

export async function getFinanceDashboard(userId: number, filters: FinanceFilters = {}) {
  const data = await listFinanceData(userId, filters.profileId);
  const filteredTransactions = filterTransactions(data.transactions, filters);
  const totals = filteredTransactions.reduce((acc, item) => {
    const amount = Number(item.amount);
    if (item.direction === "in") acc.income += amount; else acc.expenses += amount;
    return acc;
  }, { income: 0, expenses: 0 });
  const filteredInvestments = filterInvestments(data.investments, filters);
  const invested = filteredInvestments.reduce((sum, item) => sum + Number(item.marketValue), 0);
  const cardMonth = filterCardPurchases(data.purchases, filters);
  const cardInstallments = cardMonth.reduce((sum, item) => sum + Number(item.installmentAmount), 0);
  const cardTotal = cardMonth.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const cardsSummary = buildCardsSummary(data.cards, cardMonth);
  const billsPending = filterBills(data.bills, { month: filters.month }).filter((item) => item.status !== "paid").reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = totals.income - totals.expenses;
  const series = buildFinanceSeries(filteredTransactions);
  return { ...data, transactions: filteredTransactions, investments: filteredInvestments, purchases: cardMonth, summary: { income: totals.income, expenses: totals.expenses, balance, invested, billsPending, cardInstallments, cardTotal, cardsSummary, commitment: calculateCommitment(totals.income, totals.expenses, billsPending, cardInstallments), series } };
}

export function buildFinanceSeries(rows: Array<{ date: Date; direction: "in" | "out"; amount: string | number }>) {
  const map = new Map<string, { income: number; expenses: number }>();
  for (const item of rows) { const key = new Date(item.date).toISOString().slice(0, 10); const current = map.get(key) ?? { income: 0, expenses: 0 }; if (item.direction === "in") current.income += Number(item.amount); else current.expenses += Number(item.amount); map.set(key, current); }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values }));
}

export function buildCardsSummary(cards: Array<{ id: number; name: string }>, purchases: Array<{ cardId: number; totalAmount: string | number; installmentAmount: string | number }>) {
  return cards.map((card) => ({ cardId: card.id, name: card.name, installmentAmount: purchases.filter((item) => item.cardId === card.id).reduce((sum, item) => sum + Number(item.installmentAmount), 0), totalAmount: purchases.filter((item) => item.cardId === card.id).reduce((sum, item) => sum + Number(item.totalAmount), 0) }));
}


export function buildBudgetSummary(budgetRows: Array<{ month: string; category: string; amount: string | number }>, transactionRows: Array<{ date: Date; category: string; direction: "in" | "out"; amount: string | number }>, month: string) {
  return budgetRows.filter((budget) => budget.month === month).map((budget) => {
    const spent = transactionRows.filter((item) => item.direction === "out" && item.category === budget.category && new Date(item.date).toISOString().slice(0, 7) === month).reduce((sum, item) => sum + Number(item.amount), 0);
    const limit = Number(budget.amount);
    return { category: budget.category, limit, spent, remaining: Math.max(0, limit - spent), percent: limit > 0 ? Number(Math.min(100, (spent / limit) * 100).toFixed(2)) : 0 };
  });
}

export async function listRoutineData(userId: number, profileId: number, month = new Date().toISOString().slice(0, 7)) {
  const db = await getDb();
  if (!db) return { recurring: [], budgets: [], reminders: [], budgetSummary: [], upcomingBills: [], overdueBills: [] };
  const [recurring, budgetRows, reminderRows, transactionRows, billRows] = await Promise.all([
    db.select().from(recurringRules).where(and(eq(recurringRules.userId, userId), eq(recurringRules.profileId, profileId))).orderBy(desc(recurringRules.dayOfMonth)),
    db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.profileId, profileId))).orderBy(desc(budgets.month)),
    db.select().from(reminders).where(and(eq(reminders.userId, userId), eq(reminders.profileId, profileId))).orderBy(desc(reminders.dueDate)),
    db.select({ date: transactions.date, category: transactions.category, direction: transactions.direction, amount: transactions.amount }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.profileId, profileId))),
    db.select().from(bills).where(and(eq(bills.userId, userId), eq(bills.profileId, profileId))).orderBy(desc(bills.dueDate)),
  ]);
  const { upcomingBills, overdueBills } = buildBillAlertSummary(billRows);
  return { recurring, budgets: budgetRows, reminders: reminderRows, budgetSummary: buildBudgetSummary(budgetRows, transactionRows, month), upcomingBills, overdueBills };
}

export async function createRecurringRule(input: typeof recurringRules.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.insert(recurringRules).values(input); return result[0]?.insertId;
}

export async function createBudget(input: typeof budgets.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.insert(budgets).values(input); return result[0]?.insertId;
}

export async function createReminder(input: typeof reminders.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.insert(reminders).values(input); return result[0]?.insertId;
}

export async function markBillPaid(userId: number, id: number, paid: boolean) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(bills).set({ status: paid ? "paid" : "pending" }).where(and(eq(bills.id, id), eq(bills.userId, userId)));
  return true;
}

export async function permanentlyDeleteTrash(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.delete(trashItems).where(and(eq(trashItems.id, id), eq(trashItems.userId, userId)));
  return Boolean(result);
}
