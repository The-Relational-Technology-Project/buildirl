import { Email } from "~/server/service/types";

export type EmailClient = {
  notifyMembershipApplicationSubmitted(
    input: NotifyMembershipApplicationSubmittedInput,
    sendTo: Email
  ): Promise<void>;
  notifyMembershipApproved(
    input: NotifyMembershipApprovedInput,
    sendTo: Email
  ): Promise<void>;
  notifyMembershipDeclined(
    input: NotifyMembershipDeclinedInput,
    sendTo: Email
  ): Promise<void>;
  notifyMembershipDeactivatedByMemberToOwner(
    input: NotifyMembershipDeactivatedByMemberToOwnerInput,
    sendTo: Email
  ): Promise<void>;
  notifyMembershipDeactivatedByMemberToMember(
    input: NotifyMembershipDeactivatedByMemberToMemberInput,
    sendTo: Email
  ): Promise<void>;
  notifyMembershipDeactivatedByOwner(
    input: NotifyMembershipDeactivatedByOwnerInput,
    sendTo: Email
  ): Promise<void>;
};

export type NotifyMembershipApplicationSubmittedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
};

export type NotifyMembershipApprovedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubId: number;
  clubName: string;
  clubPublicId: string;
};

export type NotifyMembershipDeclinedInput = {
  membershipId: bigint;
  memberFirstName: string;
  clubId: number;
  clubName: string;
};

export type NotifyMembershipDeactivatedByMemberToOwnerInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubId: number;
};

export type NotifyMembershipDeactivatedByMemberToMemberInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
};

export type NotifyMembershipDeactivatedByOwnerInput = {
  membershipId: bigint;
  clubName: string;
};
