import {
  EmailClient,
  NotifyMembershipApprovedInput,
  NotifyMembershipDeactivatedByMemberInput,
  NotifyMembershipDeactivatedByOwnerInput,
  NotifyMembershipDeclinedInput
} from "~/server/service/email/types";
import { Email } from "~/server/service/types";

export function createDummyEmailClient(): EmailClient {
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

  async function notifyMembershipDeactivatedByMember(
    _: NotifyMembershipDeactivatedByMemberInput,
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
    notifyMembershipApproved,
    notifyMembershipDeclined,
    notifyMembershipDeactivatedByOwner,
    notifyMembershipDeactivatedByMember
  };
}
