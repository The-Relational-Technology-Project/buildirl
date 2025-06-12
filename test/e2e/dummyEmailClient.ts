/* eslint-disable @typescript-eslint/no-unused-vars */
// NOTE: Added above line to prevent this file throwing type-errors. 
import {
  EmailClient,
  NotifyMembershipApplicationSubmittedInput,
  NotifyMembershipApprovedInput,
  NotifyMembershipDeactivatedByMemberToMemberInput,
  NotifyMembershipDeactivatedByMemberToOwnerInput,
  NotifyMembershipDeactivatedByOwnerInput,
  NotifyMembershipDeclinedInput,
  NotifyApplicationWithdrawnByMemberToOwnerInput
} from "~/server/email/client/types";
import { Email } from "~/server/utils/types";

export function createDummyEmailClient(): EmailClient {
  async function sendCustomEmail(
    _: Email,
    __: Email,
    ___: string,
    ____: string,
    _____: string
  ): Promise<void> {
    return;
  }

  async function notifyMembershipApplicationSubmitted(
    _: NotifyMembershipApplicationSubmittedInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function notifyMembershipApproved(
    _: NotifyMembershipApprovedInput,
    __: Email,
    ___: Email
  ): Promise<void> {
    return;
  }

  async function notifyMembershipDeclined(
    _: NotifyMembershipDeclinedInput,
    __: Email,
    ___: Email
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
    __: Email,
    ___: Email
  ): Promise<void> {
    return;
  }

  async function notifyMembershipDeactivatedByOwner(
    _: NotifyMembershipDeactivatedByOwnerInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function notifyApplicationWithdrawnByMemberToOwner(
    _: NotifyApplicationWithdrawnByMemberToOwnerInput,
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
    notifyMembershipDeactivatedByMemberToMember,
    notifyApplicationWithdrawnByMemberToOwner,
    sendCustomEmail
  };
}
