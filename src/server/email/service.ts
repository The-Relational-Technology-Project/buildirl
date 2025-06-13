import {
  EmailService,
  EmailTemplate,
  EmailTemplateId,
  SetEmailTemplateInput,
  SendDefaultEmailForMembershipApplicationSubmittedInput,
  SendDefaultEmailForMembershipApprovedInput,
  SendDefaultEmailForMembershipDeclinedInput,
  SendDefaultEmailForMembershipDeactivatedByMemberToOwnerInput,
  SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
  SendDefaultEmailForMembershipDeactivatedByOwnerInput,
  SendDefaultEmailForApplicationWithdrawnByMemberToOwnerInput
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
    const ownerEmail = await userService.getUserEmailInTransaction(
      input.clubOwnerUserId,
      tx
    );
    if (!ownerEmail) {
      logger.error(
        `failed to send membership application submitted email for membership ${input.membershipId} because email not found for owner with id ${input.clubOwnerUserId}`
      );
      return;
    }
    await emailClient.sendDefaultEmailForMembershipApplicationSubmitted(
      input,
      ownerEmail
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

    const ownerEmail = await userService.getUserEmailInTransaction(
      input.clubOwnerUserId,
      tx
    );
    if (!ownerEmail) {
      logger.error(
        `failed to send membership approved email for membership ${input.membershipId} because email not found for owner with id ${input.clubOwnerUserId}`
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
        ownerEmail,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.sendDefaultEmailForMembershipApproved(
        input,
        memberEmail,
        ownerEmail
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

    const ownerEmail = await userService.getUserEmailInTransaction(
      input.clubOwnerUserId,
      tx
    );
    if (!ownerEmail) {
      logger.error(
        `failed to send membership declined email for membership ${input.membershipId} because email not found for owner with id ${input.clubOwnerUserId}`
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
        ownerEmail,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.sendDefaultEmailForMembershipDeclined(
        input,
        memberEmail,
        ownerEmail
      );
    }
  }

  async function sendDefaultEmailForMembershipDeactivatedByMemberToOwner(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToOwnerInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const ownerEmail = await userService.getUserEmailInTransaction(
      input.clubOwnerUserId,
      tx
    );
    if (!ownerEmail) {
      logger.error(
        `failed to send membership deactivated by member to owner email for membership ${input.membershipId} because email not found for owner with id ${input.clubOwnerUserId}`
      );
      return;
    }
    await emailClient.sendDefaultEmailForMembershipDeactivatedByMemberToOwner(
      input,
      ownerEmail
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

    const ownerEmail = await userService.getUserEmailInTransaction(
      input.clubOwnerUserId,
      tx
    );
    if (!ownerEmail) {
      logger.error(
        `failed to send membership deactivated by member to member email for membership ${input.membershipId} because email not found for owner with id ${input.clubOwnerUserId}`
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
        ownerEmail,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.sendDefaultEmailForMembershipDeactivatedByMemberToMember(
        input,
        memberEmail,
        ownerEmail
      );
    }
  }

  async function sendDefaultEmailForMembershipDeactivatedByOwner(
    input: SendDefaultEmailForMembershipDeactivatedByOwnerInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const memberEmail = await userService.getUserEmailInTransaction(
      input.memberUserId,
      tx
    );
    if (!memberEmail) {
      logger.error(
        `failed to send membership deactivated by owner email for membership ${input.membershipId} because member email not found for memberUserId ${input.memberUserId}`
      );
      return;
    }

    await emailClient.sendDefaultEmailForMembershipDeactivatedByOwner(
      input,
      memberEmail
    );
  }

  async function sendDefaultEmailForApplicationWithdrawnByMemberToOwner(
    input: SendDefaultEmailForApplicationWithdrawnByMemberToOwnerInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const ownerEmail = await userService.getUserEmailInTransaction(
      input.clubOwnerUserId,
      tx
    );
    if (!ownerEmail) {
      logger.error(
        `failed to send application withdrawn by member to owner email for membership ${input.membershipId} because email not found for owner with id ${input.clubOwnerUserId}`
      );
      return;
    }
    await emailClient.sendDefaultEmailForApplicationWithdrawnByMemberToOwner(
      input,
      ownerEmail
    );
  }

  return {
    getEmailTemplate,
    setEmailTemplate,
    deleteEmailTemplate,
    sendDefaultEmailForMembershipApplicationSubmitted,
    sendDefaultEmailForMembershipApproved,
    sendDefaultEmailForMembershipDeclined,
    sendDefaultEmailForMembershipDeactivatedByMemberToOwner,
    sendDefaultEmailForMembershipDeactivatedByMemberToMember,
    sendDefaultEmailForMembershipDeactivatedByOwner,
    sendDefaultEmailForApplicationWithdrawnByMemberToOwner
  };
}
