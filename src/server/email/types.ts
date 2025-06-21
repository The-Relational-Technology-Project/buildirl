import { z } from "zod";
import { MutationResult } from "~/server/utils/types";
import { Maybe } from "~/utils/types";
import { Prisma } from "@prisma/client";
import { EMAIL_CONTENT_LIMITS } from "~/server/utils/defaults";

export type EmailService = EmailQueries & EmailMutations & EmailNotifications;

type EmailQueries = {
  getEmailTemplate(id: EmailTemplateId): Promise<Maybe<EmailTemplate>>;
  getEmailBlastsForClub(clubId: number): Promise<EmailBlast[]>;
};

type EmailMutations = {
  setEmailTemplate(
    id: EmailTemplateId,
    input: SetEmailTemplateInput
  ): Promise<MutationResult>;
  // deleting email template will fall back to default
  deleteEmailTemplate(id: EmailTemplateId): Promise<MutationResult>;
  createEmailBlast(clubId: number, input: EmailBlastInput): Promise<{ id: bigint }>;
  updateEmailBlast(id: bigint, input: EmailBlastInput): Promise<{ id: bigint }>;
  deleteEmailBlast(id: bigint): Promise<MutationResult>;
};

type EmailNotifications = {
  sendDefaultEmailForMembershipApplicationSubmitted(
    input: SendDefaultEmailForMembershipApplicationSubmittedInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendDefaultEmailForMembershipApproved(
    input: SendDefaultEmailForMembershipApprovedInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendDefaultEmailForMembershipDeclined(
    input: SendDefaultEmailForMembershipDeclinedInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByMemberToLead(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByMemberToMember(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByLead(
    input: SendDefaultEmailForMembershipDeactivatedByLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendDefaultEmailForApplicationWithdrawnByMemberToLead(
    input: SendDefaultEmailForApplicationWithdrawnByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendEmailBlast(id: bigint): Promise<void>;
};

export type SendDefaultEmailForMembershipApplicationSubmittedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
  clubLeadUserIds: number[];
};

export type SendDefaultEmailForMembershipApprovedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubId: number;
  clubName: string;
  clubPublicId: string;
  clubLeadUserIds: number[];
  memberUserId: number;
};

export type SendDefaultEmailForMembershipDeclinedInput = {
  membershipId: bigint;
  memberFirstName: string;
  clubId: number;
  clubName: string;
  clubLeadUserIds: number[];
  memberUserId: number;
};

export type SendDefaultEmailForMembershipDeactivatedByMemberToLeadInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
  clubLeadUserIds: number[];
};

export type SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
  clubLeadUserIds: number[];
  memberUserId: number;
};

export type SendDefaultEmailForMembershipDeactivatedByLeadInput = {
  membershipId: bigint;
  clubName: string;
  memberUserId: number;
};

export type SendDefaultEmailForApplicationWithdrawnByMemberToLeadInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
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
  subject: z.string().max(EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH, `Length must be <= ${EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH}`),
  htmlContent: z.string().max(EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH, `Length must be <= ${EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH}`),
  textContent: z.string().max(EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH, `Length must be <= ${EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH}`)
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
  subject: z.string().min(1, "Subject is required").max(EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH, `Subject must be <= ${EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH} characters`).optional(),
  htmlContent: z.string().max(EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH, `HTML content must be <= ${EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH} characters`).optional(),
  textContent: z.string().max(EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH, `Text content must be <= ${EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH} characters`).optional()
});
export type EmailBlastInput = z.infer<typeof EmailBlastInputSchema>;
