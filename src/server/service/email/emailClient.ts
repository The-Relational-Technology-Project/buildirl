import { Transporter } from "nodemailer";
import {
  EmailClient,
  NotifyMembershipApprovedInput,
  NotifyMembershipDeclinedInput,
  NotifyMembershipDeactivatedByMemberToOwnerInput,
  NotifyMembershipDeactivatedByOwnerInput,
  NotifyMembershipApplicationSubmittedInput
} from "./types";
import { Email } from "../types";
import { rootLogger } from "~/logger";
import fs from "fs";
import path from "path";

const logger = rootLogger.child({ module: "emailClient" });

export function createEmailClient(mailTransport: Transporter): EmailClient {
  const FROM_EMAIL = "outbound@buildirl.com";

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
        text: `${input.memberFirstName} ${input.memberLastName} just applied to join ${input.clubName} Club. 
        Review their application and see if they are a fit: ${managePeopleDashboardUrl}`,
        html: `
          <div>
            <p><strong>${input.memberFirstName} ${input.memberLastName}</strong> just applied to join <strong>${input.clubName} Club</strong>.</p>
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
    try {
      const joinPageUrl = `${process.env.NEXT_PUBLIC_APPLICATION_URL}/join/${input.clubPublicId}`;
      
      // Get path to the celebration image
      const imagePath = path.join(process.cwd(), 'public', 'images', 'you-are-in-hands-clapping.jpeg');
      let imageAttachment = null;
      
      // Try to read the image file
      try {
        const imageContent = fs.readFileSync(imagePath);
        imageAttachment = {
          filename: 'celebration.jpeg',
          content: imageContent,
          cid: 'membership-approved-image'  // Content ID to reference in HTML
        };
      } catch (fileError) {
        // Log error but continue sending the email without the image
        logger.error(
          fileError,
          `Failed to read celebration image for membership approval email. Will send without image.`
        );
      }
      
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: `You're in! Welcome to Our Club! 🎉`,
        text: `Hey ${input.memberFirstName} — amazing news: you're officially a member of ${input.clubName} Club! 🎉\n\n
        We're hyped to have you! 🥳\n\n
        👉 Click here to see more! ${joinPageUrl}`,
        html: `
          <div>
            <p>Hey <strong>${input.memberFirstName}</strong> — amazing news: you're officially a member of <strong>${input.clubName} Club</strong>! 🎉</p>
            <p>We're hyped to have you! 🥳</p>
            <p>👉 <a href="${joinPageUrl}">Click here to see more!</a></p>
            ${imageAttachment ? `<div style="text-align: center; margin-top: 20px;">
              <img src="cid:membership-approved-image" alt="You're in! Celebration image" style="width: 350px; max-width: 100%; border-radius: 8px;" />
            </div>` : ''}
          </div>
        `,
        attachments: imageAttachment ? [imageAttachment] : []
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
        subject: `Sorry, your application was not accepted this time`,
        text: `Hey ${input.memberFirstName} — thanks for applying to the ${input.clubName} Club. 
        We couldn't accept your application this time. 💌 Plenty more clubs to explore — go find your people.
        P.S. If you shared payment info, no worries — you won't be charged.`,
        html: `
          <div>
            <p>Hey <strong>${input.memberFirstName}</strong> — thanks for applying to the <strong>${input.clubName} Club</strong>.</p>
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
        text: `${input.memberFirstName} just deactivated their membership from ${input.clubName} Club. 
        Your club won't receive contributions from them anymore. Don't forget to bid them a warm goodbye. 🫶 👉Check membership dashboard for more details ${managePeopleDashboardUrl}`,
        html: `
          <div>
            <p><strong>${input.memberFirstName}</strong> just deactivated their membership from <strong>${input.clubName} Club</strong>.</p>
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
    input: NotifyMembershipDeactivatedByMemberToOwnerInput,
    sendTo: Email
  ): Promise<void> {
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
