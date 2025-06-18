import { z } from "zod";
import {
  createTRPCRouter,
  securedProcedureWithAbilityFor
} from "~/server/api/trpc";
import { subject } from "@casl/ability";
import { TRPCError } from "@trpc/server";
import {
  EmailTemplateIdSchema,
  SetEmailTemplateInputSchema,
  SetEmailBlastInputSchema
} from "~/server/email/types";

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
    }),

  emailBlasts: securedProcedureWithAbilityFor("Club")
    .input(z.object({ clubId: z.number() }))
    .query(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.email.getEmailBlasts(input.clubId);
    }),

  setEmailBlast: securedProcedureWithAbilityFor("Club")
    .input(
      z.object({
        id: z.bigint().optional(),
        clubId: z.number(),
        input: SetEmailBlastInputSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.email.setEmailBlast(input.id, input.clubId, input.input);
    }),

  deleteEmailBlast: securedProcedureWithAbilityFor("EmailBlast")
    .input(z.object({ id: z.bigint() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("EmailBlast", { id: input.id }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.email.deleteEmailBlast(input.id);
    }),

  sendEmailBlast: securedProcedureWithAbilityFor("EmailBlast")
    .input(z.object({ id: z.bigint() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("EmailBlast", { id: input.id }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.email.sendEmailBlast(input.id);
    })
}); 