import { Email } from "../types";

export type EmailClient = {
  notifyMembershipApproved(
    input: NotifyMembershipApprovedInput,
    sendTo: Email
  ): Promise<void>;
  notifyMembershipDeclined(
    input: NotifyMembershipDeclinedInput,
    sendTo: Email
  ): Promise<void>;
  notifyMembershipDeactivatedByMember(
    input: NotifyMembershipDeactivatedByMemberInput,
    sendTo: Email
  ): Promise<void>;
  notifyMembershipDeactivatedByOwner(
    input: NotifyMembershipDeactivatedByOwnerInput,
    sendTo: Email
  ): Promise<void>;
};

export type NotifyMembershipApprovedInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
  clubPublicId: string;
};

export type NotifyMembershipDeclinedInput = {
  membershipId: bigint;
  clubName: string;
};

export type NotifyMembershipDeactivatedByMemberInput = {
  membershipId: bigint;
  memberFirstName: string;
  memberLastName: string;
  clubName: string;
};

export type NotifyMembershipDeactivatedByOwnerInput = {
  membershipId: bigint;
  clubName: string;
};
