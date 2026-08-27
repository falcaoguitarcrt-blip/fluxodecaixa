import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createTransaction, deleteTransaction, ensureFinanceProfiles, getFinanceDashboard, listFinanceData, restoreTrash, updateTransaction } from "./db";

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
    bootstrap: protectedProcedure.input(z.object({ profileId: z.number().int().positive().optional(), month: z.string().regex(/^\\d{4}-\\d{2}$/).optional(), bank: z.string().min(1).optional(), category: z.string().min(1).optional(), cardId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => getFinanceDashboard(ctx.user.id, input ?? {})),
    profiles: protectedProcedure.query(({ ctx }) => ensureFinanceProfiles(ctx.user.id)),
    transactions: protectedProcedure.input(z.object({ profileId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => listFinanceData(ctx.user.id, input?.profileId).then((data) => data.transactions)),
    createTransaction: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), date: z.coerce.date(), description: z.string().trim().min(1).max(180), category: z.string().trim().min(1).max(80), bank: z.string().trim().min(1).max(80), direction: z.enum(["in", "out"]), amount: z.number().positive(), notes: z.string().max(2000).optional() })).mutation(({ ctx, input }) => createTransaction({ ...input, userId: ctx.user.id, amount: input.amount.toFixed(2) })),
    updateTransaction: protectedProcedure.input(z.object({ id: z.number().int().positive(), description: z.string().trim().min(1).max(180).optional(), category: z.string().trim().min(1).max(80).optional(), bank: z.string().trim().min(1).max(80).optional(), direction: z.enum(["in", "out"]).optional(), amount: z.number().positive().optional(), date: z.coerce.date().optional(), notes: z.string().max(2000).optional() })).mutation(({ ctx, input }) => { const { id, amount, ...rest } = input; return updateTransaction(ctx.user.id, id, { ...rest, ...(amount === undefined ? {} : { amount: amount.toFixed(2) }) }); }),
    deleteTransaction: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteTransaction(ctx.user.id, input.id)),
    restoreTrash: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => restoreTrash(ctx.user.id, input.id)),
  }),
});

export type AppRouter = typeof appRouter;
