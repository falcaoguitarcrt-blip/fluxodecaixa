import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const financeProfiles = mysqlTable("finance_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileKey: mysqlEnum("profileKey", ["felipe", "sara"]).notNull(),
  displayName: varchar("displayName", { length: 80 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ userIdx: index("finance_profiles_user_idx").on(table.userId) }));

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), profileId: int("profileId").notNull(),
  date: timestamp("date").notNull(), description: varchar("description", { length: 180 }).notNull(), category: varchar("category", { length: 80 }).notNull(), bank: varchar("bank", { length: 80 }).notNull(),
  direction: mysqlEnum("direction", ["in", "out"]).notNull(), amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerDateIdx: index("transactions_owner_date_idx").on(table.userId, table.date), profileIdx: index("transactions_profile_idx").on(table.profileId) }));

export const financeCategories = mysqlTable("finance_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  direction: mysqlEnum("direction", ["in", "out"]).notNull(),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerProfileIdx: index("finance_categories_owner_profile_idx").on(table.userId, table.profileId, table.direction, table.status) }));

export const bills = mysqlTable("bills", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), profileId: int("profileId").notNull(), description: varchar("description", { length: 180 }).notNull(), dueDate: timestamp("dueDate").notNull(), amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), responsible: varchar("responsible", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "late"]).default("pending").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerDueIdx: index("bills_owner_due_idx").on(table.userId, table.dueDate) }));

export const investments = mysqlTable("investments", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), profileId: int("profileId").notNull(), description: varchar("description", { length: 180 }).notNull(), category: varchar("category", { length: 80 }).notNull(), institution: varchar("institution", { length: 80 }).notNull(), investedAmount: decimal("investedAmount", { precision: 12, scale: 2 }).notNull(), marketValue: decimal("marketValue", { precision: 12, scale: 2 }).notNull(), investedAt: timestamp("investedAt").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerDateIdx: index("investments_owner_date_idx").on(table.userId, table.investedAt) }));

export const savingsGoals = mysqlTable("savings_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  targetAmount: decimal("targetAmount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  targetDate: timestamp("targetDate"),
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerIdx: index("savings_goals_owner_idx").on(table.userId, table.profileId, table.status) }));

export type SavingsGoal = typeof savingsGoals.$inferSelect;

export const creditCards = mysqlTable("credit_cards", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), profileId: int("profileId").notNull(), name: varchar("name", { length: 100 }).notNull(), brand: varchar("brand", { length: 40 }).notNull(), dueDay: int("dueDay").notNull(), closingDay: int("closingDay").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerIdx: index("credit_cards_owner_idx").on(table.userId) }));

export const trashItems = mysqlTable("trash_items", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), entityType: mysqlEnum("entityType", ["transaction", "bill", "investment", "card"]).notNull(), entityId: int("entityId").notNull(), label: varchar("label", { length: 180 }).notNull(), payload: text("payload").notNull(), deletedAt: timestamp("deletedAt").defaultNow().notNull(),
}, (table) => ({ ownerIdx: index("trash_owner_idx").on(table.userId, table.deletedAt) }));

export type FinanceProfile = typeof financeProfiles.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type CreditCard = typeof creditCards.$inferSelect;
export type TrashItem = typeof trashItems.$inferSelect;

export const cardPurchases = mysqlTable("card_purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  cardId: int("cardId").notNull(),
  description: varchar("description", { length: 180 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  purchaseDate: timestamp("purchaseDate").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  installmentAmount: decimal("installmentAmount", { precision: 12, scale: 2 }).notNull(),
  installments: int("installments").notNull().default(1),
  currentInstallment: int("currentInstallment").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerDateIdx: index("card_purchases_owner_date_idx").on(table.userId, table.purchaseDate) }));

export type CardPurchase = typeof cardPurchases.$inferSelect;


export const recurringRules = mysqlTable("recurring_rules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  description: varchar("description", { length: 180 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  bank: varchar("bank", { length: 80 }).notNull(),
  direction: mysqlEnum("direction", ["in", "out"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dayOfMonth: int("dayOfMonth").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerIdx: index("recurring_rules_owner_idx").on(table.userId, table.profileId) }));

export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerMonthIdx: index("budgets_owner_month_idx").on(table.userId, table.profileId, table.month) }));

export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  kind: varchar("kind", { length: 40 }).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ ownerDueIdx: index("reminders_owner_due_idx").on(table.userId, table.profileId, table.dueDate) }));

export const recurringOccurrences = mysqlTable("recurring_occurrences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  ruleId: int("ruleId").notNull(),
  transactionId: int("transactionId"),
  month: varchar("month", { length: 7 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ruleMonthUnique: uniqueIndex("recurring_occurrences_rule_month_uq").on(table.ruleId, table.month), ownerMonthIdx: index("recurring_occurrences_owner_month_idx").on(table.userId, table.profileId, table.month) }));

export type RecurringRule = typeof recurringRules.$inferSelect;
export type RecurringOccurrence = typeof recurringOccurrences.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;

export const financeAuditLogs = mysqlTable("finance_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId"),
  action: varchar("action", { length: 40 }).notNull(),
  entityType: varchar("entityType", { length: 40 }).notNull(),
  entityId: int("entityId"),
  summary: varchar("summary", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ ownerDateIdx: index("finance_audit_owner_date_idx").on(table.userId, table.createdAt) }));

export const financeBackups = mysqlTable("finance_backups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  payload: text("payload").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ ownerDateIdx: index("finance_backups_owner_date_idx").on(table.userId, table.createdAt) }));

export type FinanceAuditLog = typeof financeAuditLogs.$inferSelect;
export type FinanceBackup = typeof financeBackups.$inferSelect;
