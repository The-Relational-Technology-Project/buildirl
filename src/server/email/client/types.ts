import { Email } from "~/server/utils/types";

export type EmailClient = {
  sendCustomEmail(
    sendTo: Email,
    replyTo: Email,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<void>;
  sendDefaultEmailForMembershipApplicationSubmitted(
    input: SendDefaultEmailForMembershipApplicationSubmittedInput,
    sendTo: Email
  ): Promise<void>;
  sendDefaultEmailForMembershipApproved(
    input: SendDefaultEmailForMembershipApprovedInput,
    sendTo: Email,
    replyTo: Email
  ): Promise<void>;
  sendDefaultEmailForMembershipDeclined(
    input: SendDefaultEmailForMembershipDeclinedInput,
    sendTo: Email,
    replyTo: Email
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByMemberToOwner(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToOwnerInput,
    sendTo: Email
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByMemberToMember(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
    sendTo: Email,
    replyTo: Email
  ): Promise<void>;
  sendDefaultEmailForMembershipDeactivatedByOwner(
    input: SendDefaultEmailForMembershipDeactivatedByOwnerInput,
    sendTo: Email
  ): Promise<void>;
  sendDefaultEmailForApplicationWithdrawnByMemberToOwner(
    input: SendDefaultEmailForApplicationWithdrawnByMemberToOwnerInput,
    sendTo: Email
  ): Promise<void>;
};

export type SendDefaultEmailForMembershipApplicationSubmittedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
  clubOwnerUserId: number;
};

export type SendDefaultEmailForMembershipApprovedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubId: number;
  clubName: string;
  clubPublicId: string;
  clubOwnerUserId: number;
  memberUserId: number;
};

export type SendDefaultEmailForMembershipDeclinedInput = {
  membershipId: bigint;
  memberFirstName: string;
  clubId: number;
  clubName: string;
  clubOwnerUserId: number;
  memberUserId: number;
};

export type SendDefaultEmailForMembershipDeactivatedByMemberToOwnerInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
  clubOwnerUserId: number;
};

export type SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
  clubOwnerUserId: number;
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
  clubOwnerUserId: number;
};
