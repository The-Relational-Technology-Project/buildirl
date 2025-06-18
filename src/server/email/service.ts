import {
  EmailService,
  EmailTemplate,
  EmailTemplateId,
  SetEmailTemplateInput,
  EmailBlast,
  SetEmailBlastInput,
  SendDefaultEmailForMembershipApplicationSubmittedInput,
  SendDefaultEmailForMembershipApprovedInput,
  SendDefaultEmailForMembershipDeclinedInput,
  SendDefaultEmailForMembershipDeactivatedByMemberToLeadInput,
  SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
  SendDefaultEmailForMembershipDeactivatedByLeadInput,
  SendDefaultEmailForApplicationWithdrawnByMemberToLeadInput,
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

  async function sendDefaultEmailForMembershipApplicationSubmitted(
    input: SendDefaultEmailForMembershipApplicationSubmittedInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const leadEmails = await userService.getUserEmailsInTransaction(
      input.clubLeadUserIds,
      tx
    );
    await emailClient.sendDefaultEmailForMembershipApplicationSubmitted(
      input,
      leadEmails
    );
  }

  async function sendDefaultEmailForMembershipApproved(
    input: SendDefaultEmailForMembershipApprovedInput,
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
      await emailClient.sendDefaultEmailForMembershipApproved(
        input,
        memberEmail,
        leadEmails
      );
    }
  }

  async function sendDefaultEmailForMembershipDeclined(
    input: SendDefaultEmailForMembershipDeclinedInput,
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
      await emailClient.sendDefaultEmailForMembershipDeclined(
        input,
        memberEmail,
        leadEmails
      );
    }
  }

  async function sendDefaultEmailForMembershipDeactivatedByMemberToLead(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const leadEmails = await userService.getUserEmailsInTransaction(
      input.clubLeadUserIds,
      tx
    );
    await emailClient.sendDefaultEmailForMembershipDeactivatedByMemberToLead(
      input,
      leadEmails
    );
  }

  async function sendDefaultEmailForMembershipDeactivatedByMemberToMember(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
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
      await emailClient.sendDefaultEmailForMembershipDeactivatedByMemberToMember(
        input,
        memberEmail,
        leadEmails
      );
    }
  }

  async function sendDefaultEmailForMembershipDeactivatedByLead(
    input: SendDefaultEmailForMembershipDeactivatedByLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const memberEmail = await userService.getUserEmailInTransaction(
      input.memberUserId,
      tx
    );
    await emailClient.sendDefaultEmailForMembershipDeactivatedByLead(
      input,
      memberEmail
    );
  }

  async function sendDefaultEmailForApplicationWithdrawnByMemberToLead(
    input: SendDefaultEmailForApplicationWithdrawnByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const leadEmails = await userService.getUserEmailsInTransaction(
      input.clubLeadUserIds,
      tx
    );
    await emailClient.sendDefaultEmailForApplicationWithdrawnByMemberToLead(
      input,
      leadEmails
    );
  }

  async function getEmailBlast(id: bigint): Promise<Maybe<EmailBlast>> {
    try {
      const emailBlast = await prisma.emailBlast.findUnique({
        where: { id }
      });

      logger.info(`queried email blast with id ${id}`);
      return emailBlast;
    } catch (e) {
      logger.error(e, `failed to query email blast with id ${id}`);
      throw e;
    }
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
      logger.error(e, `failed to query email blasts for club with id ${clubId}`);
      throw e;
    }
  }

  async function setEmailBlast(
    id: bigint | undefined,
    clubId: number,
    input: SetEmailBlastInput
  ): Promise<{ id: bigint }> {
    try {
      if (id !== undefined) {
        await prisma.emailBlast.upsert({
          where: { id },
          update: {
            ...input
          },
          create: {
            id,
            subject: input.subject ?? "",
            htmlContent: input.htmlContent ?? "",
            textContent: input.textContent ?? "",
            status: "DRAFT",
            clubId
          }
        });

        logger.info(`updated email blast with id ${id} with input ${stringify(input)}`);
        return { id };
      } else {
        const newBlast = await prisma.emailBlast.create({
          data: {
            subject: input.subject ?? "",
            htmlContent: input.htmlContent ?? "",
            textContent: input.textContent ?? "",
            status: "DRAFT",
            clubId
          }
        });

        logger.info(`created new email blast with id ${newBlast.id} with input ${stringify(input)}`);
        return { id: newBlast.id };
      }
    } catch (e) {
      logger.error(e, `failed to set email blast with id ${id} with input ${stringify(input)}`);
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
      logger.error(e, `failed to set email blast status with id ${id} to ${status}`);
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
      const emailBlast = await prisma.emailBlast.findUnique({
        where: { id }
      });

      if (!emailBlast) {
        throw new Error("Email blast not found");
      }

      if (emailBlast.status === "SENT") {
        throw new Error("Email blast has already been sent");
      }

      const leadMembership = await prisma.membership.findFirst({
        where: {
          membershipTier: { clubId: emailBlast.clubId },
          role: "LEAD"
        },
        include: {
          user: { include: { settings: true } }
        }
      });

      if (!leadMembership?.user.settings?.email) {
        logger.error(
          `failed to send email blast ${id} because club owner email not found`
        );
        return;
      }

      const leadEmail = leadMembership.user.settings.email;

      const memberships = await prisma.membership.findMany({
        where: {
          membershipTier: { clubId: emailBlast.clubId },
          status: "ACTIVE"
        },
        include: {
          user: { include: { settings: true } }
        }
      });

      const recipients = memberships
        .map(membership => membership.user.settings?.email)
        .filter((email): email is string => email !== null && email !== undefined);

      await emailClient.sendEmailBlast({
        subject: emailBlast.subject,
        htmlContent: emailBlast.htmlContent,
        textContent: emailBlast.textContent,
        replyTo: leadEmail,
        recipients
      });

      await setEmailBlastStatus(id, "SENT");

      logger.info(`sent email blast with id ${id} to ${recipients.length} members`);
    } catch (e) {
      logger.error(e, `failed to send email blast with id ${id}`);
      throw e;
    }
  }

  return {
    getEmailTemplate,
    setEmailTemplate,
    deleteEmailTemplate,
    getEmailBlast,
    getEmailBlasts,
    setEmailBlast,
    deleteEmailBlast,
    sendDefaultEmailForMembershipApplicationSubmitted,
    sendDefaultEmailForMembershipApproved,
    sendDefaultEmailForMembershipDeclined,
    sendDefaultEmailForMembershipDeactivatedByMemberToLead,
    sendDefaultEmailForMembershipDeactivatedByMemberToMember,
    sendDefaultEmailForMembershipDeactivatedByLead,
    sendDefaultEmailForApplicationWithdrawnByMemberToLead,
    sendEmailBlast
  };
}
