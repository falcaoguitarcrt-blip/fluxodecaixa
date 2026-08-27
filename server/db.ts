import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bills, cardPurchases, creditCards, financeProfiles, investments, transactions, trashItems, recurringRules, recurringOccurrences, budgets, reminders, financeAuditLogs, financeBackups, savingsGoals, financeCategories } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { CsvTransaction } from "../shared/financeCsv";
import { assertMonthKey, currentMonthKey, dateKeyFromDate, isDateInMonth, monthKeyFromDate, monthStartDate } from "../shared/calendar";

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
  if (!db) return { profiles: [], transactions: [], bills: [], investments: [], cards: [], purchases: [], trash: [], recurring: [], budgets: [], reminders: [], savingsGoals: [], categories: [] };
  const profiles = await ensureFinanceProfiles(userId);
  const txWhere = profileId ? and(eq(transactions.userId, userId), eq(transactions.profileId, profileId)) : eq(transactions.userId, userId);
  const billWhere = profileId ? and(eq(bills.userId, userId), eq(bills.profileId, profileId)) : eq(bills.userId, userId);
  const investmentWhere = profileId ? and(eq(investments.userId, userId), eq(investments.profileId, profileId)) : eq(investments.userId, userId);
  const cardWhere = profileId ? and(eq(creditCards.userId, userId), eq(creditCards.profileId, profileId)) : eq(creditCards.userId, userId);
  const purchaseWhere = profileId ? and(eq(cardPurchases.userId, userId), eq(cardPurchases.profileId, profileId)) : eq(cardPurchases.userId, userId);
  const recurringWhere = profileId ? and(eq(recurringRules.userId, userId), eq(recurringRules.profileId, profileId)) : eq(recurringRules.userId, userId);
  const budgetWhere = profileId ? and(eq(budgets.userId, userId), eq(budgets.profileId, profileId)) : eq(budgets.userId, userId);
  const reminderWhere = profileId ? and(eq(reminders.userId, userId), eq(reminders.profileId, profileId)) : eq(reminders.userId, userId);
  const savingsGoalWhere = profileId ? and(eq(savingsGoals.userId, userId), eq(savingsGoals.profileId, profileId)) : eq(savingsGoals.userId, userId);
  const categoryWhere = profileId ? and(eq(financeCategories.userId, userId), eq(financeCategories.profileId, profileId)) : eq(financeCategories.userId, userId);
  const [tx, billRows, investmentRows, cardRows, purchaseRows, trashRows, recurringRows, budgetRows, reminderRows, savingsGoalRows, categoryRows] = await Promise.all([
    db.select().from(transactions).where(txWhere).orderBy(desc(transactions.date)),
    db.select().from(bills).where(billWhere).orderBy(desc(bills.dueDate)),
    db.select().from(investments).where(investmentWhere).orderBy(desc(investments.investedAt)),
    db.select().from(creditCards).where(cardWhere).orderBy(desc(creditCards.createdAt)),
    db.select().from(cardPurchases).where(purchaseWhere).orderBy(desc(cardPurchases.purchaseDate)),
    db.select().from(trashItems).where(eq(trashItems.userId, userId)).orderBy(desc(trashItems.deletedAt)),
    db.select().from(recurringRules).where(recurringWhere).orderBy(desc(recurringRules.createdAt)),
    db.select().from(budgets).where(budgetWhere).orderBy(desc(budgets.createdAt)),
    db.select().from(reminders).where(reminderWhere).orderBy(desc(reminders.dueDate)),
    db.select().from(savingsGoals).where(savingsGoalWhere).orderBy(desc(savingsGoals.createdAt)),
    db.select().from(financeCategories).where(categoryWhere).orderBy(desc(financeCategories.createdAt)),
  ]);
  return { profiles, transactions: tx, bills: billRows, investments: investmentRows, cards: cardRows, purchases: purchaseRows, trash: trashRows, recurring: recurringRows, budgets: budgetRows, reminders: reminderRows, savingsGoals: savingsGoalRows, categories: categoryRows };
}

export async function createTransaction(input: typeof transactions.$inferInsert) {
  const db = await assertFinanceProfile(input.userId, input.profileId);
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

async function assertFinanceProfile(userId: number, profileId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const profile = await db.select({ id: financeProfiles.id }).from(financeProfiles).where(and(eq(financeProfiles.id, profileId), eq(financeProfiles.userId, userId))).limit(1);
  if (!profile[0]) throw new Error("Perfil financeiro não encontrado");
  return db;
}

export function calculateSavingsGoalProgress(currentAmount: number | string, targetAmount: number | string) {
  const current = Number(currentAmount);
  const target = Number(targetAmount);
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100));
}

export function assertSavingsGoalProfile(profileKey: string) {
  if (profileKey !== "sara") throw new Error("As caixinhas pertencem ao perfil Sara");
  return true;
}

export function assertSavingsGoalAccess(profile: { id: number; userId: number; profileKey: string }, userId: number, profileId: number) {
  if (profile.userId !== userId || profile.id !== profileId) throw new Error("Perfil financeiro não encontrado");
  assertSavingsGoalProfile(profile.profileKey);
  return true;
}

async function assertSaraProfile(userId: number, profileId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const profile = await db.select({ id: financeProfiles.id, userId: financeProfiles.userId, profileKey: financeProfiles.profileKey }).from(financeProfiles).where(and(eq(financeProfiles.id, profileId), eq(financeProfiles.userId, userId))).limit(1);
  if (!profile[0]) throw new Error("Perfil financeiro não encontrado");
  assertSavingsGoalAccess(profile[0], userId, profileId);
  return db;
}

export async function listSavingsGoals(userId: number, profileId: number) {
  const db = await assertSaraProfile(userId, profileId);
  return db.select().from(savingsGoals).where(and(eq(savingsGoals.userId, userId), eq(savingsGoals.profileId, profileId))).orderBy(desc(savingsGoals.createdAt));
}

export async function createSavingsGoal(userId: number, input: Omit<typeof savingsGoals.$inferInsert, "userId">) {
  const db = await assertSaraProfile(userId, input.profileId);
  const result = await db.insert(savingsGoals).values({ ...input, userId });
  const id = Number(result[0]?.insertId ?? 0);
  await recordFinanceAudit({ userId, profileId: input.profileId, action: "create", entityType: "savings_goal", entityId: id, summary: input.name });
  return id;
}

export async function updateSavingsGoal(userId: number, id: number, input: Partial<Omit<typeof savingsGoals.$inferInsert, "userId" | "profileId">>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId))).limit(1);
  if (!current[0]) throw new Error("Caixinha não encontrada");
  await assertSaraProfile(userId, current[0].profileId);
  await db.update(savingsGoals).set(input).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
  const updated = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId))).limit(1);
  if (updated[0]) await recordFinanceAudit({ userId, profileId: updated[0].profileId, action: "update", entityType: "savings_goal", entityId: id, summary: updated[0].name });
  return updated;
}

export async function archiveSavingsGoal(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId))).limit(1);
  if (!current[0]) throw new Error("Caixinha não encontrada");
  await assertSaraProfile(userId, current[0].profileId);
  await db.update(savingsGoals).set({ status: "archived" }).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
  await recordFinanceAudit({ userId, profileId: current[0].profileId, action: "archive", entityType: "savings_goal", entityId: id, summary: current[0].name });
  return true;
}

export async function deleteSavingsGoal(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId))).limit(1);
  if (!current[0]) throw new Error("Caixinha não encontrada");
  await assertSaraProfile(userId, current[0].profileId);
  await db.delete(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
  await recordFinanceAudit({ userId, profileId: current[0].profileId, action: "delete", entityType: "savings_goal", entityId: id, summary: current[0].name });
  return true;
}

export async function listFinanceCategories(userId: number, profileId: number) {
  const db = await assertFinanceProfile(userId, profileId);
  return db.select().from(financeCategories).where(and(eq(financeCategories.userId, userId), eq(financeCategories.profileId, profileId))).orderBy(desc(financeCategories.createdAt));
}

export async function createFinanceCategory(userId: number, input: Omit<typeof financeCategories.$inferInsert, "userId">) {
  const db = await assertFinanceProfile(userId, input.profileId);
  const name = input.name.trim();
  const duplicate = await db.select({ id: financeCategories.id }).from(financeCategories).where(and(eq(financeCategories.userId, userId), eq(financeCategories.profileId, input.profileId), eq(financeCategories.direction, input.direction), eq(financeCategories.name, name), eq(financeCategories.status, "active"))).limit(1);
  if (duplicate[0]) throw new Error("Essa categoria já existe para este fluxo");
  const result = await db.insert(financeCategories).values({ ...input, userId, name });
  const id = Number(result[0]?.insertId ?? 0);
  await recordFinanceAudit({ userId, profileId: input.profileId, action: "create", entityType: "category", entityId: id, summary: `${input.direction === "in" ? "Entrada" : "Saída"}: ${name}` });
  return id;
}

export async function updateFinanceCategory(userId: number, id: number, input: { name?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(financeCategories).where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId))).limit(1);
  if (!current[0]) throw new Error("Categoria não encontrada");
  await assertFinanceProfile(userId, current[0].profileId);
  const name = input.name?.trim();
  if (name) {
    const duplicate = await db.select({ id: financeCategories.id }).from(financeCategories).where(and(eq(financeCategories.userId, userId), eq(financeCategories.profileId, current[0].profileId), eq(financeCategories.direction, current[0].direction), eq(financeCategories.name, name), eq(financeCategories.status, "active"))).limit(1);
    if (duplicate[0] && duplicate[0].id !== id) throw new Error("Essa categoria já existe para este fluxo");
    await db.update(financeCategories).set({ name }).where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId)));
  }
  const updated = await db.select().from(financeCategories).where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId))).limit(1);
  if (updated[0]) await recordFinanceAudit({ userId, profileId: updated[0].profileId, action: "update", entityType: "category", entityId: id, summary: updated[0].name });
  return updated;
}

export async function archiveFinanceCategory(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(financeCategories).where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId))).limit(1);
  if (!current[0]) throw new Error("Categoria não encontrada");
  await assertFinanceProfile(userId, current[0].profileId);
  await db.update(financeCategories).set({ status: "archived" }).where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId)));
  await recordFinanceAudit({ userId, profileId: current[0].profileId, action: "archive", entityType: "category", entityId: id, summary: current[0].name });
  return true;
}

export async function deleteFinanceCategory(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const current = await db.select().from(financeCategories).where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId))).limit(1);
  if (!current[0]) throw new Error("Categoria não encontrada");
  await assertFinanceProfile(userId, current[0].profileId);
  const usedInTransactions = await db.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.profileId, current[0].profileId), eq(transactions.category, current[0].name))).limit(1);
  const usedInPurchases = await db.select({ id: cardPurchases.id }).from(cardPurchases).where(and(eq(cardPurchases.userId, userId), eq(cardPurchases.profileId, current[0].profileId), eq(cardPurchases.category, current[0].name))).limit(1);
  if (usedInTransactions[0] || usedInPurchases[0]) throw new Error("Categoria já utilizada; arquive-a para preservar o histórico");
  await db.delete(financeCategories).where(and(eq(financeCategories.id, id), eq(financeCategories.userId, userId)));
  await recordFinanceAudit({ userId, profileId: current[0].profileId, action: "delete", entityType: "category", entityId: id, summary: current[0].name });
  return true;
}

export async function createBill(userId: number, input: Omit<typeof bills.$inferInsert, "userId">) {
  const db = await assertFinanceProfile(userId, input.profileId);
  const result = await db.insert(bills).values({ ...input, userId });
  const id = Number(result[0]?.insertId ?? 0);
  await recordFinanceAudit({ userId, profileId: input.profileId, action: "create", entityType: "bill", entityId: id, summary: input.description });
  return id;
}

export async function updateBill(userId: number, profileId: number, id: number, input: Partial<Omit<typeof bills.$inferInsert, "userId" | "profileId">>) {
  const db = await assertFinanceProfile(userId, profileId);
  const current = await db.select().from(bills).where(and(eq(bills.id, id), eq(bills.userId, userId), eq(bills.profileId, profileId))).limit(1);
  if (!current[0]) throw new Error("Conta não encontrada para o perfil selecionado");
  await db.update(bills).set(input).where(and(eq(bills.id, id), eq(bills.userId, userId), eq(bills.profileId, profileId)));
  const updated = await db.select().from(bills).where(and(eq(bills.id, id), eq(bills.userId, userId), eq(bills.profileId, profileId))).limit(1);
  if (updated[0]) {
    const action = billStatusAuditAction(current[0].status, updated[0].status);
    await recordFinanceAudit({ userId, profileId: updated[0].profileId, action, entityType: "bill", entityId: id, summary: action === "payment" ? `Pagamento: ${updated[0].description}` : action === "reopen" ? `Reabertura: ${updated[0].description}` : updated[0].description });
  }
  return updated;
}

export async function createInvestment(userId: number, input: Omit<typeof investments.$inferInsert, "userId">) {
  const db = await assertFinanceProfile(userId, input.profileId);
  const result = await db.insert(investments).values({ ...input, userId });
  const id = Number(result[0]?.insertId ?? 0);
  await recordFinanceAudit({ userId, profileId: input.profileId, action: "create", entityType: "investment", entityId: id, summary: input.description });
  return id;
}

export async function updateInvestment(userId: number, id: number, input: Partial<Omit<typeof investments.$inferInsert, "userId" | "profileId">>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(investments).set(input).where(and(eq(investments.id, id), eq(investments.userId, userId)));
  const updated = await db.select().from(investments).where(and(eq(investments.id, id), eq(investments.userId, userId))).limit(1);
  if (updated[0]) await recordFinanceAudit({ userId, profileId: updated[0].profileId, action: "update", entityType: "investment", entityId: id, summary: updated[0].description });
  return updated;
}

export async function createCreditCard(userId: number, input: Omit<typeof creditCards.$inferInsert, "userId">) {
  const db = await assertFinanceProfile(userId, input.profileId);
  const result = await db.insert(creditCards).values({ ...input, userId });
  const id = Number(result[0]?.insertId ?? 0);
  await recordFinanceAudit({ userId, profileId: input.profileId, action: "create", entityType: "card", entityId: id, summary: input.name });
  return id;
}

export async function updateCreditCard(userId: number, id: number, input: Partial<Omit<typeof creditCards.$inferInsert, "userId" | "profileId">>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(creditCards).set(input).where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)));
  const updated = await db.select().from(creditCards).where(and(eq(creditCards.id, id), eq(creditCards.userId, userId))).limit(1);
  if (updated[0]) await recordFinanceAudit({ userId, profileId: updated[0].profileId, action: "update", entityType: "card", entityId: id, summary: updated[0].name });
  return updated;
}

export async function createCardPurchase(userId: number, input: Omit<typeof cardPurchases.$inferInsert, "userId">) {
  const db = await assertFinanceProfile(userId, input.profileId);
  const card = await db.select({ id: creditCards.id }).from(creditCards).where(and(eq(creditCards.id, input.cardId), eq(creditCards.userId, userId), eq(creditCards.profileId, input.profileId))).limit(1);
  if (!card[0]) throw new Error("Cartão não pertence ao perfil selecionado");
  const result = await db.insert(cardPurchases).values({ ...input, userId });
  const id = Number(result[0]?.insertId ?? 0);
  await recordFinanceAudit({ userId, profileId: input.profileId, action: "create", entityType: "card_purchase", entityId: id, summary: input.description });
  return id;
}

export async function updateCardPurchase(userId: number, id: number, input: Partial<Omit<typeof cardPurchases.$inferInsert, "userId" | "profileId" | "cardId">>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(cardPurchases).set(input).where(and(eq(cardPurchases.id, id), eq(cardPurchases.userId, userId)));
  const updated = await db.select().from(cardPurchases).where(and(eq(cardPurchases.id, id), eq(cardPurchases.userId, userId))).limit(1);
  if (updated[0]) await recordFinanceAudit({ userId, profileId: updated[0].profileId, action: "update", entityType: "card_purchase", entityId: id, summary: updated[0].description });
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
    if (filters.month && !isDateInMonth(item.date, filters.month)) return false;
    return true;
  });
}

export function billStatusAuditAction(previousStatus: string, nextStatus: string) {
  if (previousStatus === nextStatus) return "update" as const;
  return nextStatus === "paid" ? "payment" as const : "reopen" as const;
}

export function resolveBillStatus(item: { status: "pending" | "paid" | "late"; dueDate: Date }, now = new Date()) {
  if (item.status === "paid") return "paid" as const;
  return new Date(item.dueDate).getTime() < now.getTime() ? "late" as const : "pending" as const;
}

export function buildBillAlertSummary<T extends { status: "pending" | "paid" | "late"; dueDate: Date }>(rows: T[], now = new Date(), month?: string) {
  const scopedRows = month ? rows.filter((item) => isDateInMonth(item.dueDate, month)) : rows;
  return {
    overdueBills: scopedRows.filter((item) => resolveBillStatus(item, now) === "late"),
    upcomingBills: scopedRows.filter((item) => resolveBillStatus(item, now) === "pending").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5),
  };
}

export function filterBills(rows: Array<typeof bills.$inferSelect>, filters: { month?: string; status?: string } = {}, now = new Date()) {
  return rows.filter((item) => (!filters.status || resolveBillStatus(item, now) === filters.status) && (!filters.month || isDateInMonth(item.dueDate, filters.month)));
}

export function filterInvestments(rows: Array<typeof investments.$inferSelect>, filters: Pick<FinanceFilters, "month" | "bank" | "category"> = {}) {
  return rows.filter((item) => (!filters.month || isDateInMonth(item.investedAt, filters.month)) && (!filters.bank || item.institution === filters.bank) && (!filters.category || item.category === filters.category));
}

export function filterInvestmentPortfolio(rows: Array<typeof investments.$inferSelect>, filters: Pick<FinanceFilters, "bank" | "category"> = {}) {
  return filterInvestments(rows, filters);
}

export function summarizeInvestments(monthlyRows: Array<{ investedAmount: string | number; marketValue: string | number }>, portfolioRows: Array<{ investedAmount: string | number; marketValue: string | number }>) {
  const monthlyContribution = monthlyRows.reduce((sum, item) => sum + Number(item.investedAmount), 0);
  const investedAmount = portfolioRows.reduce((sum, item) => sum + Number(item.investedAmount), 0);
  const marketValue = portfolioRows.reduce((sum, item) => sum + Number(item.marketValue), 0);
  return { monthlyContribution, investedAmount, marketValue, investmentResult: marketValue - investedAmount };
}

export function filterCardPurchases(rows: Array<typeof cardPurchases.$inferSelect>, filters: Pick<FinanceFilters, "month" | "cardId"> = {}) {
  return rows.filter((item) => (!filters.month || isDateInMonth(item.purchaseDate, filters.month)) && (!filters.cardId || item.cardId === filters.cardId));
}

export async function getFinanceDashboard(userId: number, filters: FinanceFilters = {}) {
  if (filters.profileId && filters.month) await materializeRecurringTransactions(userId, filters.profileId, filters.month);
  const data = await listFinanceData(userId, filters.profileId);
  const filteredTransactions = filterTransactions(data.transactions, filters);
  const totals = filteredTransactions.reduce((acc, item) => {
    const amount = Number(item.amount);
    if (item.direction === "in") acc.income += amount; else acc.expenses += amount;
    return acc;
  }, { income: 0, expenses: 0 });
  const filteredInvestments = filterInvestments(data.investments, filters);
  const portfolioInvestments = filterInvestmentPortfolio(data.investments, filters);
  const investmentSummary = summarizeInvestments(filteredInvestments, portfolioInvestments);
  const cardMonth = filterCardPurchases(data.purchases, filters);
  const cardInstallments = cardMonth.reduce((sum, item) => sum + Number(item.installmentAmount), 0);
  const cardTotal = cardMonth.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const cardsSummary = buildCardsSummary(data.cards, cardMonth);
  const cardStatements = buildCardStatementDetails(data.cards, cardMonth, filters.month ?? currentMonthKey());
  const billsPending = filterBills(data.bills, { month: filters.month }).filter((item) => item.status !== "paid").reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = totals.income - totals.expenses;
  const series = buildFinanceSeries(filteredTransactions);
  return { ...data, transactions: filteredTransactions, investments: filteredInvestments, investmentPortfolio: portfolioInvestments, purchases: cardMonth, summary: { income: totals.income, expenses: totals.expenses, balance, invested: investmentSummary.marketValue, investedAmount: investmentSummary.investedAmount, monthlyContribution: investmentSummary.monthlyContribution, investmentResult: investmentSummary.investmentResult, billsPending, cardInstallments, cardTotal, cardsSummary, cardStatements, commitment: calculateCommitment(totals.income, totals.expenses, billsPending, cardInstallments), series } };
}

export function buildFinanceSeries(rows: Array<{ date: Date; direction: "in" | "out"; amount: string | number }>) {
  const map = new Map<string, { income: number; expenses: number }>();
  for (const item of rows) { const key = dateKeyFromDate(item.date); const current = map.get(key) ?? { income: 0, expenses: 0 }; if (item.direction === "in") current.income += Number(item.amount); else current.expenses += Number(item.amount); map.set(key, current); }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values }));
}

export function buildCardsSummary(cards: Array<{ id: number; name: string }>, purchases: Array<{ cardId: number; totalAmount: string | number; installmentAmount: string | number }>) {
  return cards.map((card) => ({ cardId: card.id, name: card.name, installmentAmount: purchases.filter((item) => item.cardId === card.id).reduce((sum, item) => sum + Number(item.installmentAmount), 0), totalAmount: purchases.filter((item) => item.cardId === card.id).reduce((sum, item) => sum + Number(item.totalAmount), 0) }));
}

export type CardStatementDetail = {
  cardId: number;
  cardName: string;
  brand: string;
  statementMonth: string;
  closingDay: number;
  dueDay: number;
  dueDate: Date;
  purchaseCount: number;
  installmentAmount: number;
  totalAmount: number;
  status: "open" | "empty";
};

export function buildCardStatementDetails(cards: Array<{ id: number; name: string; brand: string; dueDay: number; closingDay: number }>, purchases: Array<{ cardId: number; totalAmount: string | number; installmentAmount: string | number }>, month: string) {
  const monthStart = monthStartDate(month);
  return cards.map((card): CardStatementDetail => {
    const cardPurchases = purchases.filter((purchase) => purchase.cardId === card.id);
    const dueDate = new Date(monthStart);
    dueDate.setUTCMonth(dueDate.getUTCMonth() + 1);
    const lastDay = new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth() + 1, 0, 12)).getUTCDate();
    dueDate.setUTCDate(Math.min(card.dueDay, lastDay));
    return { cardId: card.id, cardName: card.name, brand: card.brand, statementMonth: month, closingDay: card.closingDay, dueDay: card.dueDay, dueDate, purchaseCount: cardPurchases.length, installmentAmount: cardPurchases.reduce((sum, purchase) => sum + Number(purchase.installmentAmount), 0), totalAmount: cardPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0), status: cardPurchases.length ? "open" : "empty" };
  });
}

export type CoupleSnapshotPart = {
  profileKey: "felipe" | "sara";
  displayName: string;
  profileId: number;
  summary: {
    income: number;
    expenses: number;
    balance: number;
    invested: number;
    investedAmount: number;
    monthlyContribution: number;
    billsPending: number;
    cardInstallments: number;
    cardTotal: number;
  };
  cards: Array<{ id: number; name: string; brand: string; dueDay: number; closingDay: number }>;
  purchases: Array<{ cardId: number; totalAmount: string | number; installmentAmount: string | number }>;
  investments: Array<{ institution: string; investedAmount: string | number; marketValue: string | number }>;
  bills: Array<unknown>;
  userId?: number;
};

export function buildCoupleDashboard(parts: CoupleSnapshotPart[]) {
  const income = parts.reduce((sum, part) => sum + part.summary.income, 0);
  const expenses = parts.reduce((sum, part) => sum + part.summary.expenses, 0);
  const billsPending = parts.reduce((sum, part) => sum + part.summary.billsPending, 0);
  const cardInstallments = parts.reduce((sum, part) => sum + part.summary.cardInstallments, 0);
  const cardTotal = parts.reduce((sum, part) => sum + part.summary.cardTotal, 0);
  const investedAmount = parts.reduce((sum, part) => sum + part.summary.investedAmount, 0);
  const monthlyContribution = parts.reduce((sum, part) => sum + part.summary.monthlyContribution, 0);
  const cards = parts.flatMap((part) => part.cards.map((card) => {
    const purchases = part.purchases.filter((purchase) => purchase.cardId === card.id);
    return { profileKey: part.profileKey, profileName: part.displayName, ...card, purchaseCount: purchases.length, installmentAmount: purchases.reduce((sum, purchase) => sum + Number(purchase.installmentAmount), 0), totalAmount: purchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0) };
  }));
  const institutionMap = new Map<string, { institution: string; marketValue: number; profiles: Set<string> }>();
  parts.forEach((part) => part.investments.forEach((investment) => {
    const current = institutionMap.get(investment.institution) ?? { institution: investment.institution, marketValue: 0, profiles: new Set<string>() };
    current.marketValue += Number(investment.marketValue);
    current.profiles.add(part.profileKey);
    institutionMap.set(investment.institution, current);
  }));
  return {
    summary: { income, expenses, balance: income - expenses, invested: parts.reduce((sum, part) => sum + part.summary.invested, 0), investedAmount, monthlyContribution, investmentResult: parts.reduce((sum, part) => sum + part.summary.invested, 0) - investedAmount, billsPending, cardInstallments, cardTotal, commitment: calculateCommitment(income, expenses, billsPending, cardInstallments), totalCards: parts.reduce((sum, part) => sum + part.cards.length, 0), totalBills: parts.reduce((sum, part) => sum + part.bills.length, 0) },
    profiles: parts.map((part) => ({ profileKey: part.profileKey, displayName: part.displayName, profileId: part.profileId, summary: part.summary, investmentCount: part.investments.length, cardCount: part.cards.length, billCount: part.bills.length })),
    cards,
    institutions: Array.from(institutionMap.values()).map((institution) => ({ ...institution, profiles: Array.from(institution.profiles) })),
  };
}

export function buildCoupleDashboardForUser(userId: number, parts: CoupleSnapshotPart[]) {
  return buildCoupleDashboard(parts.filter((part) => part.userId === undefined || part.userId === userId).filter((part) => part.profileKey === "felipe" || part.profileKey === "sara"));
}

export async function getCoupleDashboard(userId: number, month = currentMonthKey()) {
  const profiles = await ensureFinanceProfiles(userId);
  const parts = await Promise.all(profiles.filter((profile) => profile.profileKey === "felipe" || profile.profileKey === "sara").map(async (profile) => {
    const dashboard = await getFinanceDashboard(userId, { profileId: profile.id, month });
    return { userId, profileKey: profile.profileKey, displayName: profile.displayName, profileId: profile.id, summary: { ...dashboard.summary }, cards: dashboard.cards, purchases: dashboard.purchases, investments: dashboard.investmentPortfolio, bills: dashboard.bills } satisfies CoupleSnapshotPart;
  }));
  return buildCoupleDashboardForUser(userId, parts);
}


export function buildBudgetSummary(budgetRows: Array<{ month: string; category: string; amount: string | number }>, transactionRows: Array<{ date: Date; category: string; direction: "in" | "out"; amount: string | number }>, month: string) {
  return budgetRows.filter((budget) => budget.month === month).map((budget) => {
    const spent = transactionRows.filter((item) => item.direction === "out" && item.category === budget.category && isDateInMonth(item.date, month)).reduce((sum, item) => sum + Number(item.amount), 0);
    const limit = Number(budget.amount);
    return { category: budget.category, limit, spent, remaining: Math.max(0, limit - spent), percent: limit > 0 ? Number(Math.min(100, (spent / limit) * 100).toFixed(2)) : 0 };
  });
}

export async function listRoutineData(userId: number, profileId: number, month = currentMonthKey()) {
  const db = await getDb();
  if (!db) return { recurring: [], budgets: [], reminders: [], budgetSummary: [], upcomingBills: [], overdueBills: [] };
  await materializeRecurringTransactions(userId, profileId, month);
  const [recurringRows, budgetRows, reminderRows, transactionRows, billRows] = await Promise.all([
    db.select().from(recurringRules).where(and(eq(recurringRules.userId, userId), eq(recurringRules.profileId, profileId))).orderBy(desc(recurringRules.dayOfMonth)),
    db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.profileId, profileId))).orderBy(desc(budgets.month)),
    db.select().from(reminders).where(and(eq(reminders.userId, userId), eq(reminders.profileId, profileId))).orderBy(desc(reminders.dueDate)),
    db.select({ date: transactions.date, category: transactions.category, direction: transactions.direction, amount: transactions.amount }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.profileId, profileId))),
    db.select().from(bills).where(and(eq(bills.userId, userId), eq(bills.profileId, profileId))).orderBy(desc(bills.dueDate)),
  ]);
  const { upcomingBills, overdueBills } = buildBillAlertSummary(billRows, new Date(), month);
  const visibleReminders = reminderRows.filter((item) => isDateInMonth(item.dueDate, month));
  const recurring = recurringRows.filter((rule) => isRecurringRuleActiveInMonth(rule, month));
  return { recurring, budgets: budgetRows, reminders: visibleReminders, budgetSummary: buildBudgetSummary(budgetRows, transactionRows, month), upcomingBills, overdueBills };
}

export function recurringOccurrenceDate(rule: { dayOfMonth: number; startDate: Date; endDate: Date | null }, month: string) {
  assertMonthKey(month);
  const startMonth = monthKeyFromDate(rule.startDate);
  const endMonth = rule.endDate ? monthKeyFromDate(rule.endDate) : null;
  if (month < startMonth || (endMonth !== null && month > endMonth)) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0, 12)).getUTCDate();
  const occurrenceDate = new Date(Date.UTC(year, monthNumber - 1, Math.min(rule.dayOfMonth, lastDay), 12));
  const occurrenceKey = dateKeyFromDate(occurrenceDate);
  if (occurrenceKey < dateKeyFromDate(rule.startDate)) return null;
  if (rule.endDate && occurrenceKey > dateKeyFromDate(rule.endDate)) return null;
  return occurrenceDate;
}

export function isRecurringRuleActiveInMonth(rule: { active: number; dayOfMonth: number; startDate: Date; endDate: Date | null }, month: string) {
  return rule.active === 1 && recurringOccurrenceDate(rule, month) !== null;
}

export async function materializeRecurringTransactions(userId: number, profileId: number, month: string) {
  const db = await assertFinanceProfile(userId, profileId);
  assertMonthKey(month);
  const rules = await db.select().from(recurringRules).where(and(eq(recurringRules.userId, userId), eq(recurringRules.profileId, profileId), eq(recurringRules.active, 1)));
  const created: number[] = [];
  for (const rule of rules) {
    const occurrenceDate = recurringOccurrenceDate(rule, month);
    if (!occurrenceDate) continue;
    try {
      const transactionId = await db.transaction(async (tx) => {
        const transactionResult = await tx.insert(transactions).values({ userId, profileId, date: occurrenceDate, description: rule.description, category: rule.category, bank: rule.bank, direction: rule.direction, amount: rule.amount, notes: `Gerado pela recorrência #${rule.id}` });
        const id = Number(transactionResult[0]?.insertId ?? 0);
        await tx.insert(recurringOccurrences).values({ userId, profileId, ruleId: rule.id, transactionId: id, month });
        return id;
      });
      if (transactionId) {
        created.push(transactionId);
        await recordFinanceAudit({ userId, profileId, action: "materialize", entityType: "recurring_transaction", entityId: transactionId, summary: `${rule.description} · ${month}` });
      }
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
      if (code !== "ER_DUP_ENTRY") throw error;
    }
  }
  return { month, profileId, created, createdCount: created.length };
}

export async function createRecurringRule(input: typeof recurringRules.$inferInsert) {
  const db = await assertFinanceProfile(input.userId, input.profileId);
  const result = await db.insert(recurringRules).values(input);
  const id = Number(result[0]?.insertId ?? 0);
  await recordFinanceAudit({ userId: input.userId, profileId: input.profileId, action: "create", entityType: "recurring_rule", entityId: id, summary: input.description });
  return id;
}

export async function createBudget(input: typeof budgets.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.insert(budgets).values(input); return result[0]?.insertId;
}

export async function createReminder(input: typeof reminders.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.insert(reminders).values(input); return result[0]?.insertId;
}

export async function markBillPaid(userId: number, id: number, profileId: number, month: string, paid: boolean) {
  const db = await assertFinanceProfile(userId, profileId);
  const current = await db.select().from(bills).where(and(eq(bills.id, id), eq(bills.userId, userId), eq(bills.profileId, profileId))).limit(1);
  if (!current[0]) throw new Error("Conta não encontrada para o perfil selecionado");
  if (!isDateInMonth(current[0].dueDate, month)) throw new Error("A conta não pertence ao mês selecionado");
  const nextStatus = paid ? "paid" : "pending";
  await db.update(bills).set({ status: nextStatus }).where(and(eq(bills.id, id), eq(bills.userId, userId), eq(bills.profileId, profileId)));
  await recordFinanceAudit({ userId, profileId, action: paid ? "payment" : "reopen", entityType: "bill", entityId: id, summary: `${paid ? "Pagamento" : "Reabertura"}: ${current[0].description} · ${month}` });
  return { id, profileId, month, status: nextStatus };
}

export async function permanentlyDeleteTrash(userId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.delete(trashItems).where(and(eq(trashItems.id, id), eq(trashItems.userId, userId)));
  return Boolean(result);
}
