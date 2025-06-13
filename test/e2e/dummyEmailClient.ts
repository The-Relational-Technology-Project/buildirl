/* eslint-disable @typescript-eslint/no-unused-vars */
// NOTE: Added above line to prevent this file throwing type-errors. 
import {
  EmailClient,
  SendDefaultEmailForMembershipApplicationSubmittedInput,
  SendDefaultEmailForMembershipApprovedInput,
  SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
  SendDefaultEmailForMembershipDeactivatedByMemberToOwnerInput,
  SendDefaultEmailForMembershipDeactivatedByOwnerInput,
  SendDefaultEmailForMembershipDeclinedInput,
  SendDefaultEmailForApplicationWithdrawnByMemberToOwnerInput
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

  async function sendDefaultEmailForMembershipApplicationSubmitted(
    _: SendDefaultEmailForMembershipApplicationSubmittedInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function sendDefaultEmailForMembershipApproved(
    _: SendDefaultEmailForMembershipApprovedInput,
    __: Email,
    ___: Email
  ): Promise<void> {
    return;
  }

  async function sendDefaultEmailForMembershipDeclined(
    _: SendDefaultEmailForMembershipDeclinedInput,
    __: Email,
    ___: Email
  ): Promise<void> {
    return;
  }

  async function sendDefaultEmailForMembershipDeactivatedByMemberToOwner(
    _: SendDefaultEmailForMembershipDeactivatedByMemberToOwnerInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function sendDefaultEmailForMembershipDeactivatedByMemberToMember(
    _: SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
    __: Email,
    ___: Email
  ): Promise<void> {
    return;
  }

  async function sendDefaultEmailForMembershipDeactivatedByOwner(
    _: SendDefaultEmailForMembershipDeactivatedByOwnerInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function sendDefaultEmailForApplicationWithdrawnByMemberToOwner(
    _: SendDefaultEmailForApplicationWithdrawnByMemberToOwnerInput,
    __: Email
  ): Promise<void> {
    return;
  }

  return {
    sendDefaultEmailForMembershipApplicationSubmitted,
    sendDefaultEmailForMembershipApproved,
    sendDefaultEmailForMembershipDeclined,
    sendDefaultEmailForMembershipDeactivatedByOwner,
    sendDefaultEmailForMembershipDeactivatedByMemberToOwner,
    sendDefaultEmailForMembershipDeactivatedByMemberToMember,
    sendDefaultEmailForApplicationWithdrawnByMemberToOwner,
    sendCustomEmail
  };
}
