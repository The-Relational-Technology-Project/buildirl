import { Email } from "~/server/utils/types";

export type EmailClient = {
  sendCustomEmail(
    sendTo: Emails,
    replyTo: Emails,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<void>;
  sendEmailBlast(input: SendEmailBlastInput): Promise<void>;
  sendDefaultEmailForMembershipApplicationSubmitted(
    input: SendDefaultEmailForMembershipApplicationSubmittedInput,
    sendTo: Emails
  ): Promise<void>;
  sendDefaultEmailForMembershipApproved(
    input: SendDefaultEmailForMembershipApprovedInput,
    sendTo: Email,
    replyTo: Emails
  ): Promise<void>;
  sendDefaultEmailForMembershipDeclined(
    input: SendDefaultEmailForMembershipDeclinedInput,
    sendTo: Email,
    replyTo: Emails
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByMemberToLead(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToLeadInput,
    sendTo: Emails
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByMemberToMember(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
    sendTo: Email,
    replyTo: Emails
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByLead(
    input: SendDefaultEmailForMembershipDeactivatedByLeadInput,
    sendTo: Email
  ): Promise<void>;
  sendDefaultEmailForApplicationWithdrawnByMemberToLead(
    input: SendDefaultEmailForApplicationWithdrawnByMemberToLeadInput,
    sendTo: Emails
  ): Promise<void>;
};

export type SendEmailBlastInput = {
  subject: string;
  htmlContent: string;
  textContent: string;
  replyTo: Emails;
  recipients: Emails;
};

export type Emails = Email | Email[];

export type SendDefaultEmailForMembershipApplicationSubmittedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
};

export type SendDefaultEmailForMembershipApprovedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubId: number;
  clubName: string;
  clubPublicId: string;
};

export type SendDefaultEmailForMembershipDeclinedInput = {
  membershipId: bigint;
  memberFirstName: string;
  clubId: number;
  clubName: string;
};

export type SendDefaultEmailForMembershipDeactivatedByMemberToLeadInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
};

export type SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
};

export type SendDefaultEmailForMembershipDeactivatedByLeadInput = {
  membershipId: bigint;
  clubName: string;
};

export type SendDefaultEmailForApplicationWithdrawnByMemberToLeadInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
};
