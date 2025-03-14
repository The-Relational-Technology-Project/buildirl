import { createTRPCRouter, securedProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const paymentsRouter = createTRPCRouter({
  createAccount: securedProcedure.mutation(({ ctx }) => {
    throw new Error("unimplemented");
  }),
  createAccountLink: securedProcedure.mutation(({ ctx }) => {
    throw new Error("unimplemented");
  }),
  getAccountStatus: securedProcedure.query(({ ctx }) => {
    // NOT_STARTED, INCOMPLETE, COMPLETED
    throw new Error("unimplemented");
  }),
  getSubscriptionStatus: securedProcedure
    .input(z.object({ membershipId: z.bigint() }))
    .query(({ ctx, input }) => {
      throw new Error("unimplemented");
    }),
  getCustomerPortalLink: securedProcedure.query(({ ctx }) => {
    // add pre-filled email
    throw new Error("unimplemented");
  }),
  createCheckoutSession: securedProcedure
    .input(z.object({ membershipId: z.number() }))
    .mutation(({ ctx, input }) => {
      throw new Error("unimplemented");
    })
});
