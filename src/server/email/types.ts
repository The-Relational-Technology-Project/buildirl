import { z } from "zod";
import { MutationResult } from "~/server/utils/types";
import { Maybe } from "~/utils/types";
import { Prisma } from "@prisma/client";
import { EmailVariables } from "~/utils/email";

export const EMAIL_CONTENT_LIMITS = {
  SUBJECT_MAX_LENGTH: 500,
  HTML_CONTENT_MAX_LENGTH: 15000,
  TEXT_CONTENT_MAX_LENGTH: 15000
};

export type EmailService = EmailQueries & EmailMutations & EmailNotifications;

type EmailQueries = {
  getEmailTemplate(id: EmailTemplateId): Promise<Maybe<EmailTemplate>>;
  getEmailBlasts(clubId: number): Promise<EmailBlast[]>;
};

type EmailMutations = {
  setEmailTemplate(
    id: EmailTemplateId,
    input: SetEmailTemplateInput
  ): Promise<MutationResult>;
  // deleting email template will fall back to default
  deleteEmailTemplate(id: EmailTemplateId): Promise<MutationResult>;
  createEmailBlast(
    clubId: number,
    input: EmailBlastInput
  ): Promise<MutationResult>;
  updateEmailBlast(id: bigint, input: EmailBlastInput): Promise<MutationResult>;
  deleteEmailBlast(id: bigint): Promise<MutationResult>;
};

type EmailNotifications = {
  sendEmailForMembershipApplicationSubmitted(
    input: SendEmailForMembershipApplicationSubmittedInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendEmailForMembershipApproved(
    input: SendEmailForMembershipApprovedInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendEmailForMembershipDeclined(
    input: SendEmailForMembershipDeclinedInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendEmailForMembershipDeactivatedByMemberToLead(
    input: SendEmailForMembershipDeactivatedByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendEmailForMembershipDeactivatedByMemberToMember(
    input: SendEmailForMembershipDeactivatedByMemberToMemberInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendEmailForMembershipDeactivatedByLead(
    input: SendEmailForMembershipDeactivatedByLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendEmailForApplicationWithdrawnByMemberToLead(
    input: SendEmailForApplicationWithdrawnByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendEmailBlast(id: bigint): Promise<void>;
};

export type SendEmailForMembershipApplicationSubmittedInput = {
  membershipId: bigint;
  memberUserId: number;
  clubId: number;
  clubLeadUserIds: number[];
};

export type SendEmailForMembershipApprovedInput = {
  membershipId: bigint;
  clubId: number;
  clubLeadUserIds: number[];
  memberUserId: number;
};

export type SendEmailForMembershipDeclinedInput = {
  membershipId: bigint;
  clubId: number;
  clubLeadUserIds: number[];
  memberUserId: number;
};

export type SendEmailForMembershipDeactivatedByMemberToLeadInput = {
  membershipId: bigint;
  memberUserId: number;
  clubId: number;
  clubLeadUserIds: number[];
};

export type SendEmailForMembershipDeactivatedByMemberToMemberInput = {
  membershipId: bigint;
  clubId: number;
  clubLeadUserIds: number[];
  memberUserId: number;
};

export type SendEmailForMembershipDeactivatedByLeadInput = {
  membershipId: bigint;
  clubId: number;
  memberUserId: number;
};

export type SendEmailForApplicationWithdrawnByMemberToLeadInput = {
  membershipId: bigint;
  memberUserId: number;
  clubId: number;
  clubLeadUserIds: number[];
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
  subject: z
    .string()
    .max(
      EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH,
      `Length must be <= ${EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH}`
    ),
  htmlContent: z
    .string()
    .max(
      EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH,
      `Length must be <= ${EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH}`
    ),
  textContent: z
    .string()
    .max(
      EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH,
      `Length must be <= ${EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH}`
    )
});
export type SetEmailTemplateInput = z.infer<typeof SetEmailTemplateInputSchema>;

export type EmailBlast = {
  id: bigint;
  clubId: number;
  subject: string;
  htmlContent: string;
  textContent: string;
  status: EmailBlastStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type EmailBlastStatus = "DRAFT" | "SENT";

export const EmailBlastInputSchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(
      EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH,
      `Subject must be <= ${EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH} characters`
    ),
  htmlContent: z
    .string()
    .max(
      EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH,
      `HTML content must be <= ${EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH} characters`
    ),
  textContent: z
    .string()
    .max(
      EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH,
      `Text content must be <= ${EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH} characters`
    )
});
export type EmailBlastInput = z.infer<typeof EmailBlastInputSchema>;

