/* eslint-disable @typescript-eslint/no-unused-vars */
// NOTE: Added above line to prevent this file throwing type-errors.
import {
  EmailClient,
  SendEmailForMembershipApplicationSubmittedInput,
  SendEmailForMembershipDeactivatedByMemberToLeadInput,
  SendEmailForMembershipDeactivatedByLeadInput,
  SendEmailForApplicationWithdrawnByMemberToLeadInput,
  Emails
} from "~/server/email/client/types";
import { Email } from "~/server/utils/types";
import { EmailContent, EmailVariables } from "~/utils/email";

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

  async function sendInterpolatedEmail(
    _: EmailContent,
    __: EmailVariables,
    ___: Emails,
    ____: Emails
  ): Promise<void> {
    return;
  }


  async function sendEmailForMembershipApplicationSubmitted(
    _: SendEmailForMembershipApplicationSubmittedInput,
    __: Email
  ): Promise<void> {
    return;
  }

  async function sendEmailForMembershipDeactivatedByMemberToLead(
    _: SendEmailForMembershipDeactivatedByMemberToLeadInput,
    __: Email
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
    sendInterpolatedEmail,
    sendEmailForMembershipApplicationSubmitted,
    sendEmailForMembershipDeactivatedByLead,
    sendEmailForMembershipDeactivatedByMemberToLead,
    sendEmailForApplicationWithdrawnByMemberToLead
  };
}
