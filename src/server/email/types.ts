import { z } from "zod";
import { MutationResult } from "~/server/utils/types";
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
  "ACCEPTANCE",
  "REJECTION",
  "DEPARTURE"
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
  subject: z.string().max(500, "Length must be <= 500"),
  htmlContent: z.string().max(15000, "Length must be <= 15000"),
  textContent: z.string().max(10000, "Length must be <= 15000")
});
export type SetEmailTemplateInput = z.infer<typeof SetEmailTemplateInputSchema>;
