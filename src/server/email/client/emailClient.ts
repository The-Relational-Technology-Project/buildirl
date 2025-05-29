import { Transporter } from "nodemailer";
import {
  EmailClient,
  NotifyMembershipApprovedInput,
  NotifyMembershipDeclinedInput,
  NotifyMembershipDeactivatedByMemberToOwnerInput,
  NotifyMembershipDeactivatedByOwnerInput,
  NotifyMembershipApplicationSubmittedInput,
  NotifyMembershipDeactivatedByMemberToMemberInput
} from "./types";
import { rootLogger } from "~/logger";
import { Email } from "~/server/utils/types";
import { EmailService, EmailTemplateId } from "~/server/email/types";
import { stringify } from "~/utils";

const logger = rootLogger.child({ module: "emailClient" });

export function createEmailClient(
  mailTransport: Transporter,
  emailService: EmailService
): EmailClient {
  const FROM_EMAIL = "outbound@buildirl.com";

  /**
   * Returns boolean if custom email is sent which can be used to determine if fallback is required
   */
  async function sendCustomEmailWithTemplate(
    id: EmailTemplateId,
    sendTo: Email
  ): Promise<boolean> {
    const template = await emailService.getEmailTemplate(id);
    if (null === template) {
      logger.info(
        `no email template found for id ${stringify(id)}, did not send custom email`
      );
      return false;
    }
    try {
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: template.subject,
        text: template.textContent,
        html: template.htmlContent
      });
      logger.info(
        `sent custom email with email template with id ${stringify(id)}`
      );
      return true;
    } catch (e) {
      logger.error(
        e,
        `failed to send custom email with email template with id ${stringify(id)}`
      );
      return false;
    }
  }

  async function notifyMembershipApplicationSubmitted(
    input: NotifyMembershipApplicationSubmittedInput,
    sendTo: Email
  ): Promise<void> {
    const managePeopleDashboardUrl = `${process.env.NEXT_PUBLIC_APPLICATION_URL}/club/${input.clubId}/manage?tab=people`;
    try {
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: "A membership application was submitted! 🎉",
        text: `${input.memberFirstName} ${input.memberLastName} just applied to join ${input.clubName}. 
        Review their application and see if they are a fit: ${managePeopleDashboardUrl}`,
        html: `
          <div>
            <p><strong>${input.memberFirstName} ${input.memberLastName}</strong> just applied to join <strong>${input.clubName}</strong>.</p>
            <p><a href="${managePeopleDashboardUrl}">Review their application</a> and see if they are a fit.</p>
          </div>
        `
      });

      logger.info(
        `sent membership application submitted email to club owner at ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership application submitted email to club owner at ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  async function notifyMembershipApproved(
    input: NotifyMembershipApprovedInput,
    sendTo: Email
  ): Promise<void> {
    const customEmailSent = await sendCustomEmailWithTemplate(
      { clubId: input.clubId, type: "ACCEPTANCE" },
      sendTo
    );
    if (customEmailSent) {
      return;
    }

    try {
      const joinPageUrl = `${process.env.NEXT_PUBLIC_APPLICATION_URL}/join/${input.clubPublicId}`;

      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: `You're in! Welcome to ${input.clubName}! 🎉`,
        text: `Hey ${input.memberFirstName} — amazing news: you're officially a member of ${input.clubName}! 🎉\n\n
        We're hyped to have you! 🥳\n\n
        👉 Click here to see more! ${joinPageUrl}`,
        html: `
          <div>
            <p>Hey <strong>${input.memberFirstName}</strong> — amazing news: you're officially a member of <strong>${input.clubName}</strong>! 🎉</p>
            <p>We're hyped to have you! 🥳</p>
            <p>👉 <a href="${joinPageUrl}">Click here to see more!</a></p>
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
    const customEmailSent = await sendCustomEmailWithTemplate(
      { clubId: input.clubId, type: "REJECTION" },
      sendTo
    );
    if (customEmailSent) {
      return;
    }

    try {
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: `Sorry, your application was not accepted this time`,
        text: `Hey ${input.memberFirstName} — thanks for applying to the ${input.clubName}. 
        We couldn't accept your application this time. 💌 Plenty more clubs to explore — go find your people.
        P.S. If you shared payment info, no worries — you won't be charged.`,
        html: `
          <div>
            <p>Hey <strong>${input.memberFirstName}</strong> — thanks for applying to the <strong>${input.clubName}</strong>.</p>
            <p>We couldn't accept your application this time. 💌 Plenty more clubs to explore — go find your people.</p>
            <p>P.S. If you shared payment info, no worries — you won't be charged.</p>
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

  async function notifyMembershipDeactivatedByMemberToOwner(
    input: NotifyMembershipDeactivatedByMemberToOwnerInput,
    sendTo: Email
  ): Promise<void> {
    const managePeopleDashboardUrl = `${process.env.NEXT_PUBLIC_APPLICATION_URL}/club/${input.clubId}/manage?tab=people`;
    try {
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: "A member just left your club 👋",
        text: `${input.memberFirstName} just deactivated their membership from ${input.clubName}. 
        Your club won't receive contributions from them anymore. Don't forget to bid them a warm goodbye. 🫶 👉Check membership dashboard for more details ${managePeopleDashboardUrl}`,
        html: `
          <div>
            <p><strong>${input.memberFirstName}</strong> just deactivated their membership from <strong>${input.clubName}</strong>.</p>
            <p>Your club won't receive contributions from them anymore.</p>
            <p>Don't forget to bid them a warm goodbye. 🫶</p>
            <p>👉Check <a href="${managePeopleDashboardUrl}">membership dashboard</a> for more details.</p>
          </div>
        `
      });

      logger.info(
        `sent membership deactivated email by member to club owner at ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership deactivated by member email to club owner at ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  async function notifyMembershipDeactivatedByMemberToMember(
    input: NotifyMembershipDeactivatedByMemberToMemberInput,
    sendTo: Email
  ): Promise<void> {
    const customEmailSent = await sendCustomEmailWithTemplate(
      { clubId: input.clubId, type: "DEPARTURE" },
      sendTo
    );
    if (customEmailSent) {
      return;
    }

    try {
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: "Sorry to see you go! 👋",
        text: `The ${input.clubName} will miss you, ${input.memberFirstName} ${input.memberLastName}! 
        Thank-you for being a contributing member! 🙏`,
        html: `
          <div>
            <p>The <strong>${input.clubName}</strong> will miss you, ${input.memberFirstName} ${input.memberLastName}!</p>
            <p>Thank-you for being a contributing member! 🙏</p>
          </div>
        `
      });

      logger.info(
        `sent membership deactivated email by member to member at ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership deactivated email by member to member at ${sendTo} for membership with id ${input.membershipId}`
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
        subject: "Sorry, your membership was deactivated",
        text: `Your membership to ${input.clubName} was deactivated. You will no longer be charged if you had monetary contributions. 
        Thank-you for being a contributing member. 🙏`,
        html: `
          <div>
            <p>Your membership to <strong>${input.clubName}</strong> was deactivated.</p>
            <p>You will no longer be charged if you had monetary contributions.</p>
            <p>Thank-you for being a contributing member. 🙏</p>
          </div>
        `
      });

      logger.info(
        `sent membership deactivated email by owner to member at ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership deactivated email by owner to member at ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  return {
    notifyMembershipApplicationSubmitted,
    notifyMembershipApproved,
    notifyMembershipDeclined,
    notifyMembershipDeactivatedByMemberToOwner,
    notifyMembershipDeactivatedByMemberToMember,
    notifyMembershipDeactivatedByOwner
  };
}
