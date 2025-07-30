import { Email } from "~/server/utils/types";
import { EmailContent, EmailVariables } from "~/utils/email";

export type EmailClient = {
  sendCustomEmail(
    sendTo: Emails,
    replyTo: Emails,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<void>;
  sendInterpolatedEmail(
    template: EmailContent,
    variables: EmailVariables,
    sendTo: Emails,
    replyTo: Emails
  ): Promise<void>;
  sendEmailForMembershipApplicationSubmitted(
    input: SendEmailForMembershipApplicationSubmittedInput,
    sendTo: Emails
  ): Promise<void>;
  sendEmailForMembershipApproved(
    input: SendEmailForMembershipApprovedInput,
    sendTo: Email,
    replyTo: Emails
  ): Promise<void>;
  sendEmailForMembershipDeclined(
    input: SendEmailForMembershipDeclinedInput,
    sendTo: Email,
    replyTo: Emails
  ): Promise<void>;
  sendEmailForMembershipDeactivatedByMemberToLead(
    input: SendEmailForMembershipDeactivatedByMemberToLeadInput,
    sendTo: Emails
  ): Promise<void>;
  sendEmailForMembershipDeactivatedByMemberToMember(
    input: SendEmailForMembershipDeactivatedByMemberToMemberInput,
    sendTo: Email,
    replyTo: Emails
  ): Promise<void>;
  sendEmailForMembershipDeactivatedByLead(
    input: SendEmailForMembershipDeactivatedByLeadInput,
    sendTo: Email
  ): Promise<void>;
  sendEmailForApplicationWithdrawnByMemberToLead(
    input: SendEmailForApplicationWithdrawnByMemberToLeadInput,
    sendTo: Emails
  ): Promise<void>;
};


export type Emails = Email | Email[];

export type SendEmailForMembershipApplicationSubmittedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
};

export type SendEmailForMembershipApprovedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubId: number;
  clubName: string;
  clubPublicId: string;
};

export type SendEmailForMembershipDeclinedInput = {
  membershipId: bigint;
  memberFirstName: string;
  clubId: number;
  clubName: string;
};

export type SendEmailForMembershipDeactivatedByMemberToLeadInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
};

export type SendEmailForMembershipDeactivatedByMemberToMemberInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
};

export type SendEmailForMembershipDeactivatedByLeadInput = {
  membershipId: bigint;
  clubName: string;
};

export type SendEmailForApplicationWithdrawnByMemberToLeadInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
};
