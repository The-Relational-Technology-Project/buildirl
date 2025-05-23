import { z } from "zod";
import {
  createTRPCRouter,
  securedProcedureWithAbilityFor
} from "~/server/api/trpc";
import {
  EmailTemplateIdSchema,
  SetEmailTemplateInputSchema
} from "~/server/email/types";
import { subject } from "@casl/ability";
import { TRPCError } from "@trpc/server";

export const emailRouter = createTRPCRouter({
  emailTemplate: securedProcedureWithAbilityFor("Club")
    .input(EmailTemplateIdSchema)
    .query(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.email.getEmailTemplate(input);
    }),

  setEmailTemplate: securedProcedureWithAbilityFor("Club")
    .input(
      z.object({
        id: EmailTemplateIdSchema,
        input: SetEmailTemplateInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can("manage", subject("Club", { id: input.id.clubId }))
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.email.setEmailTemplate(input.id, input.input);
    }),

  deleteEmailTemplate: securedProcedureWithAbilityFor("Club")
    .input(EmailTemplateIdSchema)
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.email.deleteEmailTemplate(input);
    })
});
