import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bills, creditCards, financeProfiles, investments, transactions, trashItems } from "../drizzle/schema";
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
  if (!db) return { profiles: [], transactions: [], bills: [], investments: [], cards: [], trash: [] };
  const profiles = await ensureFinanceProfiles(userId);
  const txWhere = profileId ? and(eq(transactions.userId, userId), eq(transactions.profileId, profileId)) : eq(transactions.userId, userId);
  const [tx, billRows, investmentRows, cardRows, trashRows] = await Promise.all([
    db.select().from(transactions).where(txWhere).orderBy(desc(transactions.date)),
    db.select().from(bills).where(eq(bills.userId, userId)).orderBy(desc(bills.dueDate)),
    db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.investedAt)),
    db.select().from(creditCards).where(eq(creditCards.userId, userId)).orderBy(desc(creditCards.createdAt)),
    db.select().from(trashItems).where(eq(trashItems.userId, userId)).orderBy(desc(trashItems.deletedAt)),
  ]);
  return { profiles, transactions: tx, bills: billRows, investments: investmentRows, cards: cardRows, trash: trashRows };
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
