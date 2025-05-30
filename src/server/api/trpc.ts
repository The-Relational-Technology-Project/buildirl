/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";

import superjson from "superjson";
import { ZodError } from "zod";

import { prisma } from "~/server/prisma";
import { Maybe } from "~/utils/types";
import { logger } from "~/client/logger";
import { SupabaseClient } from "@supabase/supabase-js";
import { defineAbilityFor } from "~/server/api/authz/abilities";
import { AppAction, AppSubject } from "~/server/api/authz/types";
import { MongoAbility } from "@casl/ability";
import { createPaymentService } from "~/server/payments/service";
import { createStripeClient } from "~/server/payments/stripe/stripeClient";
import { stripe } from "~/server/payments/stripe/stripe";
import { createAccountIdResolver } from "~/server/payments/accountIdResolver";
import { createEmailService } from "~/server/email/service";
import { createUserService } from "~/server/user/service";
import { createMembershipTierService } from "~/server/membershipTier/service";
import { createClubService } from "~/server/club/service";
import { createMembershipService } from "~/server/membership/service";
import { createEmailClient } from "~/server/email/client/emailClient";
import { mailTransport } from "~/server/email/client/nodemailer";
import { createFollowingService } from "~/server/following/service";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: {
  headers: Headers;
  supabase: SupabaseClient;
}) => {
  const user = await authUser(opts.supabase);
  const stripeClient = createStripeClient(stripe);
  const accountIdResolver = createAccountIdResolver(prisma);
  const emailService = createEmailService(prisma);
  const userService = createUserService(prisma);
  const membershipTierService = createMembershipTierService(
    prisma,
    stripeClient,
    accountIdResolver
  );
  const clubService = createClubService(prisma, membershipTierService);
  const followingService = createFollowingService(
    prisma,
    userService,
    clubService
  );

  return {
    service: {
      user: userService,
      club: createClubService(prisma, membershipTierService),
      membershipTier: membershipTierService,
      membership: createMembershipService(
        prisma,
        userService,
        clubService,
        membershipTierService,
        followingService,
        stripeClient,
        createEmailClient(mailTransport, emailService),
        accountIdResolver
      ),
      following: followingService,
      email: emailService,
      payment: createPaymentService(stripeClient, prisma, accountIdResolver)
    },
    user: user,
    headers: opts.headers,
    ability: null as Maybe<MongoAbility<[AppAction, AppSubject]>>
  };
};

export type AuthUser = {
  authUserId: string;
  authEmail: Maybe<string>;
  userId: Maybe<number>;
};

async function authUser(supabase: SupabaseClient): Promise<Maybe<AuthUser>> {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    logger.info("no auth user found, returning null");
    return null;
  }
  const userId = await userIdByAuthUserId(user.id);

  return { userId: userId, authUserId: user.id, authEmail: user.email ?? null };
}

function userIdByAuthUserId(authUserId: string): Promise<Maybe<number>> {
  return prisma.user
    .findUnique({
      select: {
        id: true
      },
      where: {
        authUserId: authUserId
      }
    })
    .then((r) => r?.id ?? null);
}

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
      }
    };
  }
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * AUTHORIZATION
 *
 * Middleware that ensures that all requests are in context of an authenticated user session
 * and optionally add additional CASL {@link MongoAbility} object which can be used for
 * more granular RBAC/ABAC on gated entities {@link AppSubjects}
 */
const withAuthorization = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      // infers that `user` and `userId` is non-nullable to downstream resolvers
      user: { ...ctx.user, userId: ctx.user.userId! }
    }
  });
});

const withAbilityFor = (subject: AppSubject) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new Error(
        "withAbility middleware can only be used after withAuthorization which ensures user"
      );
    }
    const ability = await defineAbilityFor(ctx.user, prisma, subject);
    return next({
      ctx: {
        ...ctx,
        ability: ability
      }
    });
  });

/**
 * This is the base piece you use to build public queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * This is the procedure to build secured queries and mutations on your tRPC API. It guarantees that
 * a user is authorized, you can access user context
 */
export const securedProcedure = publicProcedure.use(withAuthorization);

/**
 * This is the higher-level function which gives you procedure that in addition to {@link securedProcedure}
 * gives you CASL abilities on the subject which you can use to enforce granular RBAC/ABAC authorization
 */
export const securedProcedureWithAbilityFor = (subject: AppSubject) => {
  return securedProcedure.use(withAbilityFor(subject));
};
