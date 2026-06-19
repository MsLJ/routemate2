import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "../../shared/const";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const cookieHeader = opts.req.headers.cookie;
  if (cookieHeader && cookieHeader.includes(COOKIE_NAME)) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      console.warn("[Context Auth Failure]:", error);
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
