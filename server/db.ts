import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bills, cardPurchases, creditCards, financeProfiles, investments, transactions, trashItems } from "../drizzle/schema";
import { ENV } from './_core/env';

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
  const [tx, billRows, investmentRows, cardRows, purchaseRows, trashRows] = await Promise.all([
    db.select().from(transactions).where(txWhere).orderBy(desc(transactions.date)),
    db.select().from(bills).where(eq(bills.userId, userId)).orderBy(desc(bills.dueDate)),
    db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.investedAt)),
    db.select().from(creditCards).where(eq(creditCards.userId, userId)).orderBy(desc(creditCards.createdAt)),
    db.select().from(cardPurchases).where(eq(cardPurchases.userId, userId)).orderBy(desc(cardPurchases.purchaseDate)),
    db.select().from(trashItems).where(eq(trashItems.userId, userId)).orderBy(desc(trashItems.deletedAt)),
  ]);
  return { profiles, transactions: tx, bills: billRows, investments: investmentRows, cards: cardRows, purchases: purchaseRows, trash: trashRows };
}

export async function createTransaction(input: typeof transactions.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.insert(transactions).values(input); return result[0]?.insertId;
}

export async function updateTransaction(userId: number, id: number, input: Partial<typeof transactions.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(transactions).set(input).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  return db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
}

export async function deleteTransaction(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const found = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
  if (!found[0]) return false;
  await db.insert(trashItems).values({ userId, entityType: "transaction", entityId: id, label: found[0].description, payload: JSON.stringify(found[0]) });
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  return true;
}

export async function restoreTrash(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const found = await db.select().from(trashItems).where(and(eq(trashItems.id, id), eq(trashItems.userId, userId))).limit(1);
  const item = found[0]; if (!item) return false;
  if (item.entityType === "transaction") { const payload = JSON.parse(item.payload); delete payload.id; await db.insert(transactions).values(payload); }
  await db.delete(trashItems).where(and(eq(trashItems.id, id), eq(trashItems.userId, userId)));
  return true;
}

export type FinanceFilters = { profileId?: number; month?: string; bank?: string; category?: string; cardId?: number };

export function calculateCommitment(income: number, expenses: number, billsPending: number, cardInstallments: number) {
  return income > 0 ? Number((((expenses + billsPending + cardInstallments) / income) * 100).toFixed(2)) : 0;
}

export async function getFinanceDashboard(userId: number, filters: FinanceFilters = {}) {
  const data = await listFinanceData(userId, filters.profileId);
  const filteredTransactions = data.transactions.filter((item) => {
    if (filters.bank && item.bank !== filters.bank) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.month) {
      const month = new Date(item.date).toISOString().slice(0, 7);
      if (month !== filters.month) return false;
    }
    return true;
  });
  const totals = filteredTransactions.reduce((acc, item) => {
    const amount = Number(item.amount);
    if (item.direction === "in") acc.income += amount; else acc.expenses += amount;
    return acc;
  }, { income: 0, expenses: 0 });
  const invested = data.investments.reduce((sum, item) => sum + Number(item.marketValue), 0);
  const cardMonth = data.purchases.filter((item) => (!filters.month || new Date(item.purchaseDate).toISOString().slice(0, 7) === filters.month) && (!filters.cardId || item.cardId === filters.cardId));
  const cardInstallments = cardMonth.reduce((sum, item) => sum + Number(item.installmentAmount), 0);
  const cardTotal = cardMonth.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const cardsSummary = buildCardsSummary(data.cards, cardMonth);
  const billsPending = data.bills.filter((item) => item.status !== "paid").reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = totals.income - totals.expenses;
  const series = buildFinanceSeries(filteredTransactions);
  return { ...data, transactions: filteredTransactions, summary: { income: totals.income, expenses: totals.expenses, balance, invested, billsPending, cardInstallments, cardTotal, cardsSummary, commitment: calculateCommitment(totals.income, totals.expenses, billsPending, cardInstallments), series } };
}

export function buildFinanceSeries(rows: Array<{ date: Date; direction: "in" | "out"; amount: string | number }>) {
  const map = new Map<string, { income: number; expenses: number }>();
  for (const item of rows) { const key = new Date(item.date).toISOString().slice(0, 10); const current = map.get(key) ?? { income: 0, expenses: 0 }; if (item.direction === "in") current.income += Number(item.amount); else current.expenses += Number(item.amount); map.set(key, current); }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values }));
}

export function buildCardsSummary(cards: Array<{ id: number; name: string }>, purchases: Array<{ cardId: number; totalAmount: string | number; installmentAmount: string | number }>) {
  return cards.map((card) => ({ cardId: card.id, name: card.name, installmentAmount: purchases.filter((item) => item.cardId === card.id).reduce((sum, item) => sum + Number(item.installmentAmount), 0), totalAmount: purchases.filter((item) => item.cardId === card.id).reduce((sum, item) => sum + Number(item.totalAmount), 0) }));
}
