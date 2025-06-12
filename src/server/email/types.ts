import { z } from "zod";
import { MutationResult } from "~/server/utils/types";
import { Maybe } from "~/utils/types";
import { Prisma } from "@prisma/client";

export type EmailService = EmailQueries & EmailMutations & EmailNotifications;

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
  sendDefaultEmailForMembershipDeactivatedByMemberToOwner(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToOwnerInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByMemberToMember(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByOwner(
    input: SendDefaultEmailForMembershipDeactivatedByOwnerInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  sendDefaultEmailForApplicationWithdrawnByMemberToOwner(
    input: SendDefaultEmailForApplicationWithdrawnByMemberToOwnerInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
};

export type SendDefaultEmailForMembershipApplicationSubmittedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
  clubOwnerId: number;
};

export type SendDefaultEmailForMembershipApprovedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubId: number;
  clubName: string;
  clubPublicId: string;
  clubOwnerId: number;
  memberUserId: number;
};

export type SendDefaultEmailForMembershipDeclinedInput = {
  membershipId: bigint;
  memberFirstName: string;
  clubId: number;
  clubName: string;
  clubOwnerId: number;
  memberUserId: number;
};

export type SendDefaultEmailForMembershipDeactivatedByMemberToOwnerInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
  clubOwnerId: number;
};

export type SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
  clubOwnerId: number;
  memberUserId: number;
};

export type SendDefaultEmailForMembershipDeactivatedByOwnerInput = {
  membershipId: bigint;
  clubName: string;
  memberUserId: number;
};

export type SendDefaultEmailForApplicationWithdrawnByMemberToOwnerInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
  clubOwnerId: number;
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
