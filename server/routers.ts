import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createTransaction, deleteTransaction, ensureFinanceProfiles, getFinanceDashboard, listFinanceData, restoreTrash, updateTransaction, listRoutineData, createRecurringRule, createBudget, createReminder, markBillPaid, permanentlyDeleteTrash, bulkCreateTransactions, listFinanceAudit, createFinanceBackup, listFinanceBackups, getFinanceBackup, restoreFinanceSnapshot, createBill, updateBill, createInvestment, updateInvestment, createCreditCard, updateCreditCard, createCardPurchase, updateCardPurchase } from "./db";
import type { CsvTransaction } from "../shared/financeCsv";

const cardPurchaseCreateInput = z.object({ profileId: z.number().int().positive(), cardId: z.number().int().positive(), description: z.string().trim().min(1).max(180), category: z.string().trim().min(1).max(80), purchaseDate: z.coerce.date(), totalAmount: z.number().positive(), installments: z.number().int().min(1).max(120), currentInstallment: z.number().int().min(1).max(120) }).superRefine((input, context) => {
  if (input.currentInstallment > input.installments) context.addIssue({ code: z.ZodIssueCode.custom, path: ["currentInstallment"], message: "A parcela atual não pode ser maior que o total de parcelas" });
});
const cardPurchaseUpdateInput = z.object({ id: z.number().int().positive(), description: z.string().trim().min(1).max(180).optional(), category: z.string().trim().min(1).max(80).optional(), purchaseDate: z.coerce.date().optional(), totalAmount: z.number().positive().optional(), installments: z.number().int().min(1).max(120).optional(), currentInstallment: z.number().int().min(1).max(120).optional() }).superRefine((input, context) => {
  if (input.currentInstallment !== undefined && input.installments !== undefined && input.currentInstallment > input.installments) context.addIssue({ code: z.ZodIssueCode.custom, path: ["currentInstallment"], message: "A parcela atual não pode ser maior que o total de parcelas" });
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  finance: router({
    bootstrap: protectedProcedure.input(z.object({ profileId: z.number().int().positive().optional(), month: z.string().regex(/^\d{4}-\d{2}$/).optional(), bank: z.string().min(1).optional(), category: z.string().min(1).optional(), cardId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => getFinanceDashboard(ctx.user.id, input ?? {})),
    profiles: protectedProcedure.query(({ ctx }) => ensureFinanceProfiles(ctx.user.id)),
    transactions: protectedProcedure.input(z.object({ profileId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => listFinanceData(ctx.user.id, input?.profileId).then((data) => data.transactions)),
    createTransaction: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), date: z.coerce.date(), description: z.string().trim().min(1).max(180), category: z.string().trim().min(1).max(80), bank: z.string().trim().min(1).max(80), direction: z.enum(["in", "out"]), amount: z.number().positive(), notes: z.string().max(2000).optional() })).mutation(({ ctx, input }) => createTransaction({ ...input, userId: ctx.user.id, amount: input.amount.toFixed(2) })),
    importTransactions: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), rows: z.array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), description: z.string().trim().min(1).max(180), category: z.string().trim().min(1).max(80), bank: z.string().trim().min(1).max(80), direction: z.enum(["in", "out"]), amount: z.number().positive() })).min(1).max(500) })).mutation(({ ctx, input }) => bulkCreateTransactions(ctx.user.id, input.profileId, input.rows as CsvTransaction[])),
    updateTransaction: protectedProcedure.input(z.object({ id: z.number().int().positive(), description: z.string().trim().min(1).max(180).optional(), category: z.string().trim().min(1).max(80).optional(), bank: z.string().trim().min(1).max(80).optional(), direction: z.enum(["in", "out"]).optional(), amount: z.number().positive().optional(), date: z.coerce.date().optional(), notes: z.string().max(2000).optional() })).mutation(({ ctx, input }) => { const { id, amount, ...rest } = input; return updateTransaction(ctx.user.id, id, { ...rest, ...(amount === undefined ? {} : { amount: amount.toFixed(2) }) }); }),
    createBill: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), description: z.string().trim().min(1).max(180), dueDate: z.coerce.date(), amount: z.number().positive(), responsible: z.string().trim().min(1).max(80), status: z.enum(["pending", "paid", "late"]).default("pending") })).mutation(({ ctx, input }) => createBill(ctx.user.id, { ...input, amount: input.amount.toFixed(2) })),
    updateBill: protectedProcedure.input(z.object({ id: z.number().int().positive(), description: z.string().trim().min(1).max(180).optional(), dueDate: z.coerce.date().optional(), amount: z.number().positive().optional(), responsible: z.string().trim().min(1).max(80).optional(), status: z.enum(["pending", "paid", "late"]).optional() })).mutation(({ ctx, input }) => { const { id, amount, ...rest } = input; return updateBill(ctx.user.id, id, { ...rest, ...(amount === undefined ? {} : { amount: amount.toFixed(2) }) }); }),
    createInvestment: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), description: z.string().trim().min(1).max(180), category: z.string().trim().min(1).max(80), institution: z.string().trim().min(1).max(80), investedAmount: z.number().positive(), marketValue: z.number().nonnegative(), investedAt: z.coerce.date() })).mutation(({ ctx, input }) => createInvestment(ctx.user.id, { ...input, investedAmount: input.investedAmount.toFixed(2), marketValue: input.marketValue.toFixed(2) })),
    updateInvestment: protectedProcedure.input(z.object({ id: z.number().int().positive(), description: z.string().trim().min(1).max(180).optional(), category: z.string().trim().min(1).max(80).optional(), institution: z.string().trim().min(1).max(80).optional(), investedAmount: z.number().positive().optional(), marketValue: z.number().nonnegative().optional(), investedAt: z.coerce.date().optional() })).mutation(({ ctx, input }) => { const { id, investedAmount, marketValue, ...rest } = input; return updateInvestment(ctx.user.id, id, { ...rest, ...(investedAmount === undefined ? {} : { investedAmount: investedAmount.toFixed(2) }), ...(marketValue === undefined ? {} : { marketValue: marketValue.toFixed(2) }) }); }),
    createCreditCard: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), name: z.string().trim().min(1).max(100), brand: z.string().trim().min(1).max(40), dueDay: z.number().int().min(1).max(31), closingDay: z.number().int().min(1).max(31) })).mutation(({ ctx, input }) => createCreditCard(ctx.user.id, input)),
    updateCreditCard: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(100).optional(), brand: z.string().trim().min(1).max(40).optional(), dueDay: z.number().int().min(1).max(31).optional(), closingDay: z.number().int().min(1).max(31).optional() })).mutation(({ ctx, input }) => { const { id, ...rest } = input; return updateCreditCard(ctx.user.id, id, rest); }),
    createCardPurchase: protectedProcedure.input(cardPurchaseCreateInput).mutation(({ ctx, input }) => { const installmentAmount = input.totalAmount / input.installments; return createCardPurchase(ctx.user.id, { ...input, totalAmount: input.totalAmount.toFixed(2), installmentAmount: installmentAmount.toFixed(2) }); }),
    updateCardPurchase: protectedProcedure.input(cardPurchaseUpdateInput).mutation(({ ctx, input }) => { const { id, totalAmount, installments, ...rest } = input; const nextInstallmentAmount = totalAmount === undefined || installments === undefined ? undefined : (totalAmount / installments).toFixed(2); return updateCardPurchase(ctx.user.id, id, { ...rest, ...(totalAmount === undefined ? {} : { totalAmount: totalAmount.toFixed(2) }), ...(installments === undefined ? {} : { installments }), ...(nextInstallmentAmount === undefined ? {} : { installmentAmount: nextInstallmentAmount }) }); }),
    deleteTransaction: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteTransaction(ctx.user.id, input.id)),
    restoreTrash: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => restoreTrash(ctx.user.id, input.id)),
    permanentlyDeleteTrash: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => permanentlyDeleteTrash(ctx.user.id, input.id)),
    routine: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), month: z.string().regex(/^\d{4}-\d{2}$/).optional() })).query(({ ctx, input }) => listRoutineData(ctx.user.id, input.profileId, input.month)),
    createRecurringRule: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), description: z.string().trim().min(1).max(180), category: z.string().trim().min(1).max(80), bank: z.string().trim().min(1).max(80), direction: z.enum(["in", "out"]), amount: z.number().positive(), dayOfMonth: z.number().int().min(1).max(31), startDate: z.coerce.date(), endDate: z.coerce.date().optional() })).mutation(({ ctx, input }) => createRecurringRule({ ...input, userId: ctx.user.id, amount: input.amount.toFixed(2), active: 1 })),
    createBudget: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), month: z.string().regex(/^\d{4}-\d{2}$/), category: z.string().trim().min(1).max(80), amount: z.number().positive() })).mutation(({ ctx, input }) => createBudget({ ...input, userId: ctx.user.id, amount: input.amount.toFixed(2) })),
    createReminder: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), title: z.string().trim().min(1).max(180), dueDate: z.coerce.date(), kind: z.string().trim().min(1).max(40) })).mutation(({ ctx, input }) => createReminder({ ...input, userId: ctx.user.id })),
    markBillPaid: protectedProcedure.input(z.object({ id: z.number().int().positive(), paid: z.boolean() })).mutation(({ ctx, input }) => markBillPaid(ctx.user.id, input.id, input.paid)),
    audit: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(100).optional() }).optional()).query(({ ctx, input }) => listFinanceAudit(ctx.user.id, input?.limit)),
    backups: protectedProcedure.query(({ ctx }) => listFinanceBackups(ctx.user.id)),
    createBackup: protectedProcedure.input(z.object({ label: z.string().trim().min(1).max(120).optional() }).optional()).mutation(({ ctx, input }) => createFinanceBackup(ctx.user.id, input?.label)),
    getBackup: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => { const backup = await getFinanceBackup(ctx.user.id, input.id); if (!backup) throw new Error("Backup não encontrado"); return backup; }),
    restoreBackup: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), snapshot: z.unknown() })).mutation(({ ctx, input }) => restoreFinanceSnapshot(ctx.user.id, input.profileId, input.snapshot)),
  }),
});

export type AppRouter = typeof appRouter;
