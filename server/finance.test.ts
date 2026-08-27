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
