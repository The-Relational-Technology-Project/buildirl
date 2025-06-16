import {
  EmailService,
  EmailTemplate,
  EmailTemplateId,
  SetEmailTemplateInput,
  SendDefaultEmailForMembershipApplicationSubmittedInput,
  SendDefaultEmailForMembershipApprovedInput,
  SendDefaultEmailForMembershipDeclinedInput,
  SendDefaultEmailForMembershipDeactivatedByMemberToLeadInput,
  SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
  SendDefaultEmailForMembershipDeactivatedByLeadInput,
  SendDefaultEmailForApplicationWithdrawnByMemberToLeadInput
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
    const leadEmail = await userService.getUserEmailInTransaction(
      input.clubLeadUserId,
      tx
    );
    if (!leadEmail) {
      logger.error(
        `failed to send membership application submitted email for membership ${input.membershipId} because email not found for lead with id ${input.clubLeadUserId}`
      );
      return;
    }
    await emailClient.sendDefaultEmailForMembershipApplicationSubmitted(
      input,
      leadEmail
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

    const leadEmail = await userService.getUserEmailInTransaction(
      input.clubLeadUserId,
      tx
    );
    if (!leadEmail) {
      logger.error(
        `failed to send membership approved email for membership ${input.membershipId} because email not found for lead with id ${input.clubLeadUserId}`
      );
      return;
    }

    const memberEmail = await userService.getUserEmailInTransaction(
      input.memberUserId,
      tx
    );
    if (!memberEmail) {
      logger.error(
        `failed to send membership approved email for membership ${input.membershipId} because member email not found for memberUserId ${input.memberUserId}`
      );
      return;
    }

    if (template) {
      await emailClient.sendCustomEmail(
        memberEmail,
        leadEmail,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.sendDefaultEmailForMembershipApproved(
        input,
        memberEmail,
        leadEmail
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

    const leadEmail = await userService.getUserEmailInTransaction(
      input.clubLeadUserId,
      tx
    );
    if (!leadEmail) {
      logger.error(
        `failed to send membership declined email for membership ${input.membershipId} because email not found for lead with id ${input.clubLeadUserId}`
      );
      return;
    }

    const memberEmail = await userService.getUserEmailInTransaction(
      input.memberUserId,
      tx
    );
    if (!memberEmail) {
      logger.error(
        `failed to send membership declined email for membership ${input.membershipId} because member email not found for memberUserId ${input.memberUserId}`
      );
      return;
    }

    if (template) {
      await emailClient.sendCustomEmail(
        memberEmail,
        leadEmail,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.sendDefaultEmailForMembershipDeclined(
        input,
        memberEmail,
        leadEmail
      );
    }
  }

  async function sendDefaultEmailForMembershipDeactivatedByMemberToLead(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const leadEmail = await userService.getUserEmailInTransaction(
      input.clubLeadUserId,
      tx
    );
    if (!leadEmail) {
      logger.error(
        `failed to send membership deactivated by member to lead email for membership ${input.membershipId} because email not found for lead with id ${input.clubLeadUserId}`
      );
      return;
    }
    await emailClient.sendDefaultEmailForMembershipDeactivatedByMemberToLead(
      input,
      leadEmail
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

    const leadEmail = await userService.getUserEmailInTransaction(
      input.clubLeadUserId,
      tx
    );
    if (!leadEmail) {
      logger.error(
        `failed to send membership deactivated by member to member email for membership ${input.membershipId} because email not found for lead with id ${input.clubLeadUserId}`
      );
      return;
    }

    const memberEmail = await userService.getUserEmailInTransaction(
      input.memberUserId,
      tx
    );
    if (!memberEmail) {
      logger.error(
        `failed to send membership deactivated by member to member email for membership ${input.membershipId} because member email not found for memberUserId ${input.memberUserId}`
      );
      return;
    }

    if (template) {
      await emailClient.sendCustomEmail(
        memberEmail,
        leadEmail,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.sendDefaultEmailForMembershipDeactivatedByMemberToMember(
        input,
        memberEmail,
        leadEmail
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
    if (!memberEmail) {
      logger.error(
        `failed to send membership deactivated by lead email for membership ${input.membershipId} because member email not found for memberUserId ${input.memberUserId}`
      );
      return;
    }

    await emailClient.sendDefaultEmailForMembershipDeactivatedByLead(
      input,
      memberEmail
    );
  }

  async function sendDefaultEmailForApplicationWithdrawnByMemberToLead(
    input: SendDefaultEmailForApplicationWithdrawnByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const leadEmail = await userService.getUserEmailInTransaction(
      input.clubLeadUserId,
      tx
    );
    if (!leadEmail) {
      logger.error(
        `failed to send application withdrawn by member to lead email for membership ${input.membershipId} because email not found for lead with id ${input.clubLeadUserId}`
      );
      return;
    }
    await emailClient.sendDefaultEmailForApplicationWithdrawnByMemberToLead(
      input,
      leadEmail
    );
  }

  return {
    getEmailTemplate,
    setEmailTemplate,
    deleteEmailTemplate,
    sendDefaultEmailForMembershipApplicationSubmitted,
    sendDefaultEmailForMembershipApproved,
    sendDefaultEmailForMembershipDeclined,
    sendDefaultEmailForMembershipDeactivatedByMemberToLead,
    sendDefaultEmailForMembershipDeactivatedByMemberToMember,
    sendDefaultEmailForMembershipDeactivatedByLead,
    sendDefaultEmailForApplicationWithdrawnByMemberToLead
  };
}
