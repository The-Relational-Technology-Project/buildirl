import { Email, Membership } from "../types";

export type EmailClient = {
    notifyMembershipAccepted(input: NotifyMembershipAcceptedInput, sendTo: Email): Promise<void>;
    notifyMembershipDeclined(input: NotifyMembershipDeclinedInput, sendTo: Email): Promise<void>;
    notifyMembershipCanceledByMember(input: NotifyMembershipCanceledByMemberInput, sendTo: Email): Promise<void>;
    notifyMembershipCanceledByOwner(input: NotifyMembershipCanceledByOwnerInput, sendTo: Email): Promise<void>;
}

export type NotifyMembershipAcceptedInput = {
    membership: Membership;
}

export type NotifyMembershipDeclinedInput = {
    membership: Membership;
}

export type NotifyMembershipCanceledByMemberInput = {
    membership: Membership;
}

export type NotifyMembershipCanceledByOwnerInput = {
    membership: Membership;
}
