import {
  EmailClient,
  NotifyMembershipApplicationSubmittedInput,
  NotifyMembershipApprovedInput,
  NotifyMembershipDeactivatedByMemberToMemberInput,
  NotifyMembershipDeactivatedByMemberToOwnerInput,
  NotifyMembershipDeactivatedByOwnerInput,
  NotifyMembershipDeclinedInput
} from "~/server/email/client/types";
import { Email } from "~/server/utils/types";

export function createDummyEmailClient(): EmailClient {
  async function notifyMembershipApplicationSubmitted(
    _: NotifyMembershipApplicationSubmittedInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function notifyMembershipApproved(
    _: NotifyMembershipApprovedInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function notifyMembershipDeclined(
    _: NotifyMembershipDeclinedInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function notifyMembershipDeactivatedByMemberToOwner(
    _: NotifyMembershipDeactivatedByMemberToOwnerInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function notifyMembershipDeactivatedByMemberToMember(
    _: NotifyMembershipDeactivatedByMemberToMemberInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function notifyMembershipDeactivatedByOwner(
    _: NotifyMembershipDeactivatedByOwnerInput,
    __: Email
  ): Promise<void> {
    return;
  }

  return {
    notifyMembershipApplicationSubmitted,
    notifyMembershipApproved,
    notifyMembershipDeclined,
    notifyMembershipDeactivatedByOwner,
    notifyMembershipDeactivatedByMemberToOwner,
    notifyMembershipDeactivatedByMemberToMember
  };
}
