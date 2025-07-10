import {
  EmailService,
  EmailTemplate,
  EmailTemplateId,
  SetEmailTemplateInput,
  EmailBlast,
  EmailBlastInput,
  SendEmailForMembershipApplicationSubmittedInput,
  SendEmailForMembershipApprovedInput,
  SendEmailForMembershipDeclinedInput,
  SendEmailForMembershipDeactivatedByMemberToLeadInput,
  SendEmailForMembershipDeactivatedByMemberToMemberInput,
  SendEmailForMembershipDeactivatedByLeadInput,
  SendEmailForApplicationWithdrawnByMemberToLeadInput,
  EmailBlastStatus
} from "~/server/email/types";
import { PrismaClient, Prisma } from "@prisma/client";
import { rootLogger } from "~/logger";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";
import { EmailClient } from "~/server/email/client/types";
import { UserService } from "~/server/user/types";

const logger = rootLogger.child({ module: "emailTemplateService" });

export function createEmailService(
  prisma: PrismaClient,
  emailClient: EmailClient,
  userService: UserService
): EmailService {
  const EMAIL_TEMPLATE_SELECT = {
    type: true,
    subject: true,
    htmlContent: true,
    textContent: true
  };

  async function getEmailTemplate(
    id: EmailTemplateId
  ): Promise<Maybe<EmailTemplate>> {
    try {
      const template = await prisma.emailTemplate.findUnique({
        select: EMAIL_TEMPLATE_SELECT,
        where: {
          clubId_type: {
            ...id
          }
        }
      });

      logger.info(
        `queried email template for club with clubId ${id.clubId} and type ${id.type}`
      );

      return template;
    } catch (e) {
      logger.error(
        e,
        `failed to query email template for club with clubId ${id.clubId} and type ${id.type}`
      );
      throw e;
    }
  }

  async function setEmailTemplate(
    id: EmailTemplateId,
    input: SetEmailTemplateInput
  ): Promise<MutationResult> {
    try {
      await prisma.emailTemplate.upsert({
        where: {
          clubId_type: {
            ...id
          }
        },
        update: {
          ...input
        },
        create: {
          ...id,
          ...input
        }
      });

      logger.info(
        `set email template for club with clubId ${id.clubId} and type ${id.type} with input ${stringify(input)}`
      );

      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to set email template with input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function deleteEmailTemplate(
    id: EmailTemplateId
  ): Promise<MutationResult> {
    try {
      await prisma.emailTemplate.delete({
        where: {
          clubId_type: {
            ...id
          }
        }
      });

      logger.info(
        `deleted email template for club with clubId ${id.clubId} and type ${id.type}`
      );

      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to delete email template with clubId ${id.clubId} and type ${id.type}`
      );
      throw e;
    }
  }

  async function sendEmailForMembershipApplicationSubmitted(
    input: SendEmailForMembershipApplicationSubmittedInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const leadEmails = await userService.getUserEmailsInTransaction(
      input.clubLeadUserIds,
      tx
    );
    await emailClient.sendEmailForMembershipApplicationSubmitted(
      input,
      leadEmails
    );
  }

  async function sendEmailForMembershipApproved(
    input: SendEmailForMembershipApprovedInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const template = await getEmailTemplate({
      clubId: input.clubId,
      type: "ACCEPTANCE"
    });

    const leadEmails = await userService.getUserEmailsInTransaction(
      input.clubLeadUserIds,
      tx
    );

    const memberEmail = await userService.getUserEmailInTransaction(
      input.memberUserId,
      tx
    );

    if (template) {
      await emailClient.sendCustomEmail(
        memberEmail,
        leadEmails,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.sendEmailForMembershipApproved(
        input,
        memberEmail,
        leadEmails
      );
    }
  }

  async function sendEmailForMembershipDeclined(
    input: SendEmailForMembershipDeclinedInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const template = await getEmailTemplate({
      clubId: input.clubId,
      type: "REJECTION"
    });

    const leadEmails = await userService.getUserEmailsInTransaction(
      input.clubLeadUserIds,
      tx
    );
    const memberEmail = await userService.getUserEmailInTransaction(
      input.memberUserId,
      tx
    );

    if (template) {
      await emailClient.sendCustomEmail(
        memberEmail,
        leadEmails,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.sendEmailForMembershipDeclined(
        input,
        memberEmail,
        leadEmails
      );
    }
  }

  async function sendEmailForMembershipDeactivatedByMemberToLead(
    input: SendEmailForMembershipDeactivatedByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const leadEmails = await userService.getUserEmailsInTransaction(
      input.clubLeadUserIds,
      tx
    );
    await emailClient.sendEmailForMembershipDeactivatedByMemberToLead(
      input,
      leadEmails
    );
  }

  async function sendEmailForMembershipDeactivatedByMemberToMember(
    input: SendEmailForMembershipDeactivatedByMemberToMemberInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const template = await getEmailTemplate({
      clubId: input.clubId,
      type: "DEPARTURE"
    });

    const leadEmails = await userService.getUserEmailsInTransaction(
      input.clubLeadUserIds,
      tx
    );
    const memberEmail = await userService.getUserEmailInTransaction(
      input.memberUserId,
      tx
    );

    if (template) {
      await emailClient.sendCustomEmail(
        memberEmail,
        leadEmails,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.sendEmailForMembershipDeactivatedByMemberToMember(
        input,
        memberEmail,
        leadEmails
      );
    }
  }

  async function sendEmailForMembershipDeactivatedByLead(
    input: SendEmailForMembershipDeactivatedByLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const memberEmail = await userService.getUserEmailInTransaction(
      input.memberUserId,
      tx
    );
    await emailClient.sendEmailForMembershipDeactivatedByLead(
      input,
      memberEmail
    );
  }

  async function sendEmailForApplicationWithdrawnByMemberToLead(
    input: SendEmailForApplicationWithdrawnByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const leadEmails = await userService.getUserEmailsInTransaction(
      input.clubLeadUserIds,
      tx
    );
    await emailClient.sendEmailForApplicationWithdrawnByMemberToLead(
      input,
      leadEmails
    );
  }

  async function getEmailBlasts(clubId: number): Promise<EmailBlast[]> {
    try {
      const emailBlasts = await prisma.emailBlast.findMany({
        where: { clubId },
        orderBy: { updatedAt: "desc" }
      });

      logger.info(
        `queried email blasts for club with id ${clubId}, found ${emailBlasts.length} blasts`
      );
      return emailBlasts;
    } catch (e) {
      logger.error(
        e,
        `failed to query email blasts for club with id ${clubId}`
      );
      throw e;
    }
  }

  async function createEmailBlast(
    clubId: number,
    input: EmailBlastInput
  ): Promise<{ id: bigint }> {
    try {
      const newBlast = await prisma.emailBlast.create({
        data: {
          subject: input.subject ?? "",
          htmlContent: input.htmlContent ?? "",
          textContent: input.textContent ?? "",
          status: "DRAFT",
          clubId
        }
      });

      logger.info(
        `created new email blast with id ${newBlast.id} with input ${stringify(input)}`
      );
      return { id: newBlast.id };
    } catch (e) {
      logger.error(
        e,
        `failed to create email blast with input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function updateEmailBlast(
    id: bigint,
    input: EmailBlastInput
  ): Promise<{ id: bigint }> {
    try {
      await prisma.emailBlast.update({
        where: { id },
        data: {
          ...input
        }
      });

      logger.info(
        `updated email blast with id ${id} with input ${stringify(input)}`
      );
      return { id };
    } catch (e) {
      logger.error(
        e,
        `failed to update email blast with id ${id} with input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function setEmailBlastStatus(
    id: bigint,
    status: EmailBlastStatus
  ): Promise<MutationResult> {
    try {
      await prisma.emailBlast.update({
        where: { id },
        data: { status }
      });

      logger.info(`set email blast status with id ${id} to ${status}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to set email blast status with id ${id} to ${status}`
      );
      throw e;
    }
  }

  async function deleteEmailBlast(id: bigint): Promise<MutationResult> {
    try {
      await prisma.emailBlast.delete({
        where: { id }
      });

      logger.info(`deleted email blast with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to delete email blast with id ${id}`);
      throw e;
    }
  }

  async function sendEmailBlast(id: bigint): Promise<void> {
    try {
      const emailBlast = await prisma.emailBlast.findUniqueOrThrow({
        where: { id }
      });

      if (emailBlast.status === "SENT") {
        throw new Error("Email blast has already been sent");
      }

      const leadMemberships = await prisma.membership.findMany({
        where: {
          membershipTier: { clubId: emailBlast.clubId },
          status: "ACTIVE",
          role: "LEAD"
        },
        select: {
          userId: true
        }
      });

      const leadUserIds = leadMemberships.map((m) => m.userId);
      if (leadUserIds.length === 0) {
        throw new Error(
          `No lead memberships found for club ${emailBlast.clubId}`
        );
      }

      const leadEmails = await userService.getUserEmails(leadUserIds);
      if (leadEmails.length === 0) {
        throw new Error(`No lead emails found for club ${emailBlast.clubId}`);
      }

      const memberships = await prisma.membership.findMany({
        where: {
          membershipTier: { clubId: emailBlast.clubId },
          status: "ACTIVE"
        },
        select: {
          userId: true
        }
      });

      const memberUserIds = memberships.map((membership) => membership.userId);
      const recipients = await userService.getUserEmails(memberUserIds);

      await emailClient.sendEmailBlast({
        subject: emailBlast.subject,
        htmlContent: emailBlast.htmlContent,
        textContent: emailBlast.textContent,
        replyTo: leadEmails,
        recipients
      });

      await setEmailBlastStatus(id, "SENT");

      logger.info(
        `sent email blast with id ${id} to ${recipients.length} members`
      );
    } catch (e) {
      logger.error(e, `failed to send email blast with id ${id}`);
      throw e;
    }
  }

  return {
    getEmailTemplate,
    setEmailTemplate,
    deleteEmailTemplate,
    getEmailBlasts,
    createEmailBlast,
    updateEmailBlast,
    deleteEmailBlast,
    sendEmailForMembershipApplicationSubmitted,
    sendEmailForMembershipApproved,
    sendEmailForMembershipDeclined,
    sendEmailForMembershipDeactivatedByMemberToLead,
    sendEmailForMembershipDeactivatedByMemberToMember,
    sendEmailForMembershipDeactivatedByLead,
    sendEmailForApplicationWithdrawnByMemberToLead,
    sendEmailBlast
  };
}
