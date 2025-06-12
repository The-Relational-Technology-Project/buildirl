import { z } from "zod";
import { MutationResult } from "~/server/utils/types";
import { Maybe } from "~/utils/types";
import { Email } from "~/server/utils/types";
import {
  NotifyMembershipApplicationSubmittedInput,
  NotifyMembershipApprovedInput,
  NotifyMembershipDeclinedInput,
  NotifyMembershipDeactivatedByMemberToOwnerInput,
  NotifyMembershipDeactivatedByMemberToMemberInput,
  NotifyMembershipDeactivatedByOwnerInput,
  NotifyApplicationWithdrawnByMemberToOwnerInput
} from "~/server/email/client/types";

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
  notifyMembershipApplicationSubmitted(
    input: NotifyMembershipApplicationSubmittedInput,
    sendTo: Email
  ): Promise<void>;
  notifyMembershipApproved(
    input: NotifyMembershipApprovedInput,
    sendTo: Email,
    replyTo: Email
  ): Promise<void>;
  notifyMembershipDeclined(
    input: NotifyMembershipDeclinedInput,
    sendTo: Email,
    replyTo: Email
  ): Promise<void>;
  notifyMembershipDeactivatedByMemberToOwner(
    input: NotifyMembershipDeactivatedByMemberToOwnerInput,
    sendTo: Email
  ): Promise<void>;
  notifyMembershipDeactivatedByMemberToMember(
    input: NotifyMembershipDeactivatedByMemberToMemberInput,
    sendTo: Email,
    replyTo: Email
  ): Promise<void>;
  notifyMembershipDeactivatedByOwner(
    input: NotifyMembershipDeactivatedByOwnerInput,
    sendTo: Email
  ): Promise<void>;
  notifyApplicationWithdrawnByMemberToOwner(
    input: NotifyApplicationWithdrawnByMemberToOwnerInput,
    sendTo: Email
  ): Promise<void>;
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
