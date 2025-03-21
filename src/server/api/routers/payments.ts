import {
  createTRPCRouter,
  securedProcedure,
  securedProcedureWithAbilityFor
} from "~/server/api/trpc";
import { z } from "zod";
import {
  CreateAccountLinkInputSchema,
  CreateCheckoutSessionInputSchema
} from "~/server/payments/types";
import { subject } from "@casl/ability";
import { TRPCError } from "@trpc/server";
import { bigint, BigIntStringSchema } from "~/utils/types";

export const paymentsRouter = createTRPCRouter({
  createAccount: securedProcedure.mutation(({ ctx }) => {
    return ctx.service.payment.createAccount(ctx.user.userId);
  }),

  createAccountLink: securedProcedure
    .input(CreateAccountLinkInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.service.payment.createAccountLink(input, ctx.user.userId);
    }),

  accountStatus: securedProcedure.query(({ ctx }) => {
    return ctx.service.payment.getAccountStatus(ctx.user.userId);
  }),

  subscriptionStatus: securedProcedureWithAbilityFor("Membership")
    .input(z.object({ membershipId: BigIntStringSchema }))
    .query(({ ctx, input }) => {
      if (
        !ctx.ability.can(
          "manage",
          subject("Membership", { id: bigint(input.membershipId) })
        )
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.payment.getSubscriptionStatus(
        bigint(input.membershipId)
      );
    }),

  customerPortalLink: securedProcedure.query(({ ctx }) => {
    return ctx.service.payment.getCustomerPortalLink(ctx.user.userId);
  }),

  createCheckoutSession: securedProcedure
    .input(CreateCheckoutSessionInputSchema)
    .mutation(({ ctx, input }) => {
      return ctx.service.payment.createCheckoutSession(input, ctx.user.userId);
    })
});
