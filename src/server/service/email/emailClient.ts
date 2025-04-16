import { Transporter } from "nodemailer";
import {
  EmailClient,
  NotifyMembershipApprovedInput,
  NotifyMembershipDeclinedInput,
  NotifyMembershipDeactivatedByMemberInput,
  NotifyMembershipDeactivatedByOwnerInput
} from "./types";
import { Email } from "../types";
import { rootLogger } from "~/logger";

const logger = rootLogger.child({ module: "emailClient" });

export function createEmailClient(mailTransport: Transporter): EmailClient {
  const FROM_EMAIL = "outbound@buildirl.com";

  async function notifyMembershipApproved(
    input: NotifyMembershipApprovedInput,
    sendTo: Email
  ): Promise<void> {
    try {
      const joinPageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${input.clubPublicId}`;
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: `You have been accepted!`,
        text: `Welcome to ${input.clubName}, ${input.memberFirstName} ${input.memberLastName}!\n\n
        Visit us at ${joinPageUrl}`,
        html: `
          <div>
            <p>Welcome to <strong>${input.clubName}</strong>, ${input.memberFirstName} ${input.memberLastName}!</p>
            <p>Visit us to find out <a href="${joinPageUrl}">more</a>.</p>
          </div>
        `
      });

      logger.info(
        `sent membership accepted email to ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership accepted email to ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  async function notifyMembershipDeclined(
    input: NotifyMembershipDeclinedInput,
    sendTo: Email
  ): Promise<void> {
    try {
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: `Sorry, your application was not accepted.`,
        text: `Unfortunately, your application to ${input.clubName} was not accepted as this time. 
        You will not be charged if you submitted payment details.`,
        html: `
          <div>
            <p>Unfortunately, your application to <strong>${input.clubName}</strong> was not accepted at this time.</p>
            <p>You will not be charged if you submitted payment details.</p>
          </div>
        `
      });

      logger.info(
        `sent membership declined email to ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership declined email to ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  async function notifyMembershipDeactivatedByMember(
    input: NotifyMembershipDeactivatedByMemberInput,
    sendTo: Email
  ): Promise<void> {
    const managePeopleDashboardUrl = `process.env.NEXT_PUBLIC_APP_URL}/club/${input.clubId}/manage?tab=people`;
    try {
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: "A membership was deactivated",
        text: `${input.memberFirstName} ${input.memberLastName} has deactivated their membership for ${input.clubName}. 
        Your club will no longer received contributions from them. See membership dashboard at ${managePeopleDashboardUrl}`,
        html: `
          <div>
            <p><strong>${input.memberFirstName} ${input.memberLastName}</strong> has deactivated their membership for <strong>${input.clubName}</strong>.</p>
            <p>Your club will no longer receive contributions from them.</p>
            <p>See membership <a href="${managePeopleDashboardUrl}">dashboard</a>.</p>
          </div>
        `
      });

      logger.info(
        `sent membership deactivated email to club owner at ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership deactivated email to club owner at ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  async function notifyMembershipDeactivatedByOwner(
    input: NotifyMembershipDeactivatedByOwnerInput,
    sendTo: Email
  ): Promise<void> {
    try {
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: "Sorry, your membership was deactivated.",
        text: `Your membership to ${input.clubName} was deactivated. You will no longer be charged if you were contributing.`,
        html: `
          <div>
            <p>Your membership to <strong>${input.clubName}</strong> was deactivated.</p>
            <p>You will no longer be charged if you were contributing.</p>
          </div>
        `
      });

      logger.info(
        `sent membership deactivated email to member at ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership deactivated email to member at ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  return {
    notifyMembershipApproved,
    notifyMembershipDeclined,
    notifyMembershipDeactivatedByMember,
    notifyMembershipDeactivatedByOwner
  };
}
