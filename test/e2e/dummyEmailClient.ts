/* eslint-disable @typescript-eslint/no-unused-vars */
// NOTE: Added above line to prevent this file throwing type-errors.
import {
  EmailClient,
  SendEmailBlastInput,
  SendDefaultEmailForMembershipApplicationSubmittedInput,
  SendDefaultEmailForMembershipApprovedInput,
  SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
  SendDefaultEmailForMembershipDeactivatedByMemberToLeadInput,
  SendDefaultEmailForMembershipDeactivatedByLeadInput,
  SendDefaultEmailForMembershipDeclinedInput,
  SendDefaultEmailForApplicationWithdrawnByMemberToLeadInput
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

  async function sendEmailBlast(
    _: SendEmailBlastInput
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

  async function sendDefaultEmailForMembershipDeactivatedByMemberToLead(
    _: SendDefaultEmailForMembershipDeactivatedByMemberToLeadInput,
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

  async function sendDefaultEmailForMembershipDeactivatedByLead(
    _: SendDefaultEmailForMembershipDeactivatedByLeadInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function sendDefaultEmailForApplicationWithdrawnByMemberToLead(
    _: SendDefaultEmailForApplicationWithdrawnByMemberToLeadInput,
    __: Email
  ): Promise<void> {
    return;
  }

  return {
    sendCustomEmail,
    sendEmailBlast,
    sendDefaultEmailForMembershipApplicationSubmitted,
    sendDefaultEmailForMembershipApproved,
    sendDefaultEmailForMembershipDeclined,
    sendDefaultEmailForMembershipDeactivatedByLead,
    sendDefaultEmailForMembershipDeactivatedByMemberToLead,
    sendDefaultEmailForMembershipDeactivatedByMemberToMember,
    sendDefaultEmailForApplicationWithdrawnByMemberToLead,
  };
}
