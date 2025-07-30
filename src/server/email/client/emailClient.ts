import { Transporter } from "nodemailer";
import {
  EmailClient,
  SendEmailForMembershipApplicationSubmittedInput,
  SendEmailForMembershipApprovedInput,
  SendEmailForMembershipDeclinedInput,
  SendEmailForMembershipDeactivatedByMemberToLeadInput,
  SendEmailForMembershipDeactivatedByMemberToMemberInput,
  SendEmailForMembershipDeactivatedByLeadInput,
  SendEmailForApplicationWithdrawnByMemberToLeadInput,
  Emails
} from "./types";
import { rootLogger } from "~/logger";
import { 
  DEFAULT_EMAIL_TEMPLATES, 
  interpolateEmail,
  EmailVariables,
  EmailContent
} from "~/utils/emailTemplates";

const logger = rootLogger.child({ module: "emailClient" });

export function createEmailClient(mailTransport: Transporter): EmailClient {
  const FROM_EMAIL = "outbound@buildirl.com";

  async function sendCustomEmail(
    sendTo: Emails,
    replyTo: Emails,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<void> {
    try {
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        replyTo: replyTo,
        subject: subject,
        text: textContent,
        html: htmlContent
      });
      logger.info(
        `sent custom email to ${sendTo} from ${replyTo} with subject "${subject}"`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to send custom email to ${sendTo} from ${replyTo} with subject "${subject}"`
      );
      throw e;
    }
  }

  async function sendInterpolatedEmail(
    template: EmailContent,
    variables: EmailVariables,
    sendTo: Emails,
    replyTo: Emails
  ): Promise<void> {
    const interpolatedTemplate = interpolateEmail(template, variables);
    
    await sendCustomEmail(
      sendTo,
      replyTo,
      interpolatedTemplate.subject,
      interpolatedTemplate.htmlContent,
      interpolatedTemplate.textContent
    );
  }


  async function sendEmailForMembershipApplicationSubmitted(
    input: SendEmailForMembershipApplicationSubmittedInput,
    sendTo: Emails
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
        `sent membership application submitted email to club lead at ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership application submitted email to club lead at ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  async function sendEmailForMembershipApproved(
    input: SendEmailForMembershipApprovedInput,
    sendTo: Emails,
    replyTo: Emails
  ): Promise<void> {
    try {
      const joinPageUrl = `${process.env.NEXT_PUBLIC_APPLICATION_URL}/join/${input.clubPublicId}`;
      
      const variables: EmailVariables = {
        clubName: input.clubName,
        memberFirstName: input.memberFirstName,
        joinPageUrl
      };
      
      const emailContent = interpolateEmail(
        DEFAULT_EMAIL_TEMPLATES.ACCEPTANCE,
        variables
      );

      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        replyTo: replyTo,
        subject: emailContent.subject,
        text: emailContent.textContent,
        html: emailContent.htmlContent
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

  async function sendEmailForMembershipDeclined(
    input: SendEmailForMembershipDeclinedInput,
    sendTo: Emails,
    replyTo: Emails
  ): Promise<void> {
    try {
      const variables: EmailVariables = {
        clubName: input.clubName,
        memberFirstName: input.memberFirstName
      };
      
      const emailContent = interpolateEmail(
        DEFAULT_EMAIL_TEMPLATES.REJECTION,
        variables
      );

      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        replyTo: replyTo,
        subject: emailContent.subject,
        text: emailContent.textContent,
        html: emailContent.htmlContent
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

  async function sendEmailForMembershipDeactivatedByMemberToLead(
    input: SendEmailForMembershipDeactivatedByMemberToLeadInput,
    sendTo: Emails
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
        `sent membership deactivated email by member to club lead at ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership deactivated by member email to club lead at ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  async function sendEmailForMembershipDeactivatedByMemberToMember(
    input: SendEmailForMembershipDeactivatedByMemberToMemberInput,
    sendTo: Emails,
    replyTo: Emails
  ): Promise<void> {
    try {
      const variables: EmailVariables = {
        clubName: input.clubName,
        memberFirstName: input.memberFirstName,
        memberLastName: input.memberLastName
      };
      
      const emailContent = interpolateEmail(
        DEFAULT_EMAIL_TEMPLATES.DEPARTURE,
        variables
      );

      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        replyTo: replyTo,
        subject: emailContent.subject,
        text: emailContent.textContent,
        html: emailContent.htmlContent
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

  async function sendEmailForMembershipDeactivatedByLead(
    input: SendEmailForMembershipDeactivatedByLeadInput,
    sendTo: Emails
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
        `sent membership deactivated email by lead to member at ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send membership deactivated email by lead to member at ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  async function sendEmailForApplicationWithdrawnByMemberToLead(
    input: SendEmailForApplicationWithdrawnByMemberToLeadInput,
    sendTo: Emails
  ): Promise<void> {
    const managePeopleDashboardUrl = `${process.env.NEXT_PUBLIC_APPLICATION_URL}/club/${input.clubId}/manage?tab=people`;
    try {
      await mailTransport.sendMail({
        from: FROM_EMAIL,
        to: sendTo,
        subject: "A membership application was withdrawn 💫",
        text: `${input.memberFirstName} ${input.memberLastName} has decided to withdraw their application to join ${input.clubName}. These things happen! 🌟 
        Keep building your amazing community - you can review other pending applications in your membership dashboard: ${managePeopleDashboardUrl}`,
        html: `
          <div>
            <p><strong>${input.memberFirstName} ${input.memberLastName}</strong> has decided to withdraw their application to join <strong>${input.clubName}</strong>. These things happen! 🌟</p>
            <p>Keep building your amazing community - you can review other pending applications in your <a href="${managePeopleDashboardUrl}">membership dashboard</a>. ✨</p>
          </div>
        `
      });

      logger.info(
        `sent application withdrawn email to club lead at ${sendTo} for membership with id ${input.membershipId}`
      );
    } catch (error) {
      logger.error(
        error,
        `failed to send application withdrawn email to club lead at ${sendTo} for membership with id ${input.membershipId}`
      );
    }
  }

  return {
    sendCustomEmail,
    sendInterpolatedEmail,
    sendEmailForMembershipApplicationSubmitted,
    sendEmailForMembershipApproved,
    sendEmailForMembershipDeclined,
    sendEmailForMembershipDeactivatedByMemberToLead,
    sendEmailForMembershipDeactivatedByMemberToMember,
    sendEmailForMembershipDeactivatedByLead,
    sendEmailForApplicationWithdrawnByMemberToLead
  };
}
