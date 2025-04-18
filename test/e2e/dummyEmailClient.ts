import {
  EmailClient,
  NotifyMembershipApplicationSubmittedInput,
  NotifyMembershipApprovedInput,
  NotifyMembershipDeactivatedByMemberInput,
  NotifyMembershipDeactivatedByOwnerInput,
  NotifyMembershipDeclinedInput
} from "~/server/service/email/types";
import { Email } from "~/server/service/types";

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
    notifyMembershipApplicationSubmitted,
    notifyMembershipApproved,
    notifyMembershipDeclined,
    notifyMembershipDeactivatedByOwner,
    notifyMembershipDeactivatedByMember
  };
}
