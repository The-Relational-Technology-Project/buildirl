/* eslint-disable @typescript-eslint/no-unused-vars */
// NOTE: Added above line to prevent this file throwing type-errors.
import {
  EmailClient,
  SendEmailBlastInput,
  SendEmailForMembershipApplicationSubmittedInput,
  SendEmailForMembershipApprovedInput,
  SendEmailForMembershipDeactivatedByMemberToMemberInput,
  SendEmailForMembershipDeactivatedByMemberToLeadInput,
  SendEmailForMembershipDeactivatedByLeadInput,
  SendEmailForMembershipDeclinedInput,
  SendEmailForApplicationWithdrawnByMemberToLeadInput,
  Emails
} from "~/server/email/client/types";
import { Email } from "~/server/utils/types";

export function createDummyEmailClient(): EmailClient {
  async function sendCustomEmail(
    _: Emails,
    __: Emails,
    ___: string,
    ____: string,
    _____: string
  ): Promise<void> {
    return;
  }

  async function sendEmailBlast(_: SendEmailBlastInput): Promise<void> {
    return;
  }

  async function sendEmailForMembershipApplicationSubmitted(
    _: SendEmailForMembershipApplicationSubmittedInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function sendEmailForMembershipApproved(
    _: SendEmailForMembershipApprovedInput,
    __: Email,
    ___: Email
  ): Promise<void> {
    return;
  }

  async function sendEmailForMembershipDeclined(
    _: SendEmailForMembershipDeclinedInput,
    __: Email,
    ___: Email
  ): Promise<void> {
    return;
  }

  async function sendEmailForMembershipDeactivatedByMemberToLead(
    _: SendEmailForMembershipDeactivatedByMemberToLeadInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function sendEmailForMembershipDeactivatedByMemberToMember(
    _: SendEmailForMembershipDeactivatedByMemberToMemberInput,
    __: Email,
    ___: Email
  ): Promise<void> {
    return;
  }

  async function sendEmailForMembershipDeactivatedByLead(
    _: SendEmailForMembershipDeactivatedByLeadInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function sendEmailForApplicationWithdrawnByMemberToLead(
    _: SendEmailForApplicationWithdrawnByMemberToLeadInput,
    __: Email
  ): Promise<void> {
    return;
  }

  return {
    sendCustomEmail,
    sendEmailBlast,
    sendEmailForMembershipApplicationSubmitted,
    sendEmailForMembershipApproved,
    sendEmailForMembershipDeclined,
    sendEmailForMembershipDeactivatedByLead,
    sendEmailForMembershipDeactivatedByMemberToLead,
    sendEmailForMembershipDeactivatedByMemberToMember,
    sendEmailForApplicationWithdrawnByMemberToLead
  };
}
