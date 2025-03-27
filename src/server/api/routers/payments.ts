import {
  createTRPCRouter,
  securedProcedureWithAbilityFor
} from "~/server/api/trpc";
import { z } from "zod";
import {
  CreateAccountInputSchema,
  CreateAccountLinkInputSchema,
  CreateCheckoutSessionInputSchema
} from "~/server/payments/types";
import { subject } from "@casl/ability";
import { TRPCError } from "@trpc/server";
import { bigint, BigIntStringSchema } from "~/utils/types";

export const paymentsRouter = createTRPCRouter({
  createAccount: securedProcedureWithAbilityFor("Club")
    .input(CreateAccountInputSchema)
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.payment.createAccount(input);
    }),

  createAccountLink: securedProcedureWithAbilityFor("Club")
    .input(CreateAccountLinkInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.payment.createAccountLink(input);
    }),

  accountStatus: securedProcedureWithAbilityFor("Club")
    .input(z.object({ clubId: z.number() }))
    .query(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.payment.getAccountStatus(input.clubId);
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

  customerPortalLink: securedProcedureWithAbilityFor("Membership")
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
      return ctx.service.payment.getCustomerPortalLink(
        bigint(input.membershipId)
      );
    }),

  createCheckoutSession: securedProcedureWithAbilityFor("Membership")
    .input(
      z.object({
        input: CreateCheckoutSessionInputSchema,
        membershipId: BigIntStringSchema
      })
    )
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can(
          "manage",
          subject("Membership", { id: bigint(input.membershipId) })
        )
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.service.payment.createCheckoutSession(
        input.input,
        // hacky to split out but want to keep conversion at the edge layer
        bigint(input.membershipId)
      );
    })
});
