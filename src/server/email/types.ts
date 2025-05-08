import { z } from "zod";
import { MutationResult, RequiredStringSchema } from "~/server/service/types";
import { Maybe } from "~/utils/types";

export type EmailService = EmailQueries & EmailMutations;

type EmailQueries = {
  getEmailTemplate(id: EmailTemplateId): Promise<Maybe<EmailTemplate>>;
};

type EmailMutations = {
  setEmailTemplate(
    id: EmailTemplateId,
    input: SetEmailTemplateInput
  ): Promise<MutationResult>;
  // deleting email template will fall back to default
  deleteEmailTemplate(id: EmailTemplateId): Promise<MutationResult>;
};

const EmailTemplateTypeSchema = z.enum([
  "ONBOARDING",
  "OFFBOARDING",
  "REJECTION"
]);
export type EmailTemplateType = z.infer<typeof EmailTemplateTypeSchema>;

export const EmailTemplateIdSchema = z.object({
  clubId: z.number(),
  type: EmailTemplateTypeSchema
});
export type EmailTemplateId = z.infer<typeof EmailTemplateIdSchema>;

export type EmailTemplate = {
  type: EmailTemplateType;
  subject: string;
  htmlContent: string;
  textContent: string;
};

export const SetEmailTemplateInputSchema = z.object({
  subject: RequiredStringSchema,
  htmlContent: RequiredStringSchema,
  textContent: RequiredStringSchema
});
export type SetEmailTemplateInput = z.infer<typeof SetEmailTemplateInputSchema>;
