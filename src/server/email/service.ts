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
import { MutationResult, NO_ID_MUTATION_RESULT, Email } from "~/server/utils/types";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";
import { 
  EmailClient
} from "~/server/email/client/types";
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
    sendTo: Email,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    // New pattern: resolve owner email if clubOwnerId and transaction provided
    if (input.clubOwnerId && tx) {
      const ownerEmail = await userService.getUserEmailInTransaction(input.clubOwnerId, tx);
      if (!ownerEmail) {
        logger.error(
          `failed to send membership application submitted email for membership ${input.membershipId} because owner email not found for clubOwnerId ${input.clubOwnerId}`
        );
        return;
      }
      await emailClient.sendDefaultEmailForMembershipApplicationSubmitted(input, ownerEmail);
    } else {
      // Legacy pattern: use provided sendTo email
      await emailClient.sendDefaultEmailForMembershipApplicationSubmitted(input, sendTo);
    }
  }

  async function sendDefaultEmailForMembershipApproved(
    input: SendDefaultEmailForMembershipApprovedInput,
    sendTo: Email,
    replyTo: Email,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const template = await getEmailTemplate({
      clubId: input.clubId,
      type: "ACCEPTANCE"
    });
    
    if (template) {
      // NOTE: The below approach is temporary to ensure backwards compatibility.  
      // New pattern: resolve owner email if clubOwnerId and transaction provided
      if (input.clubOwnerId && tx) {
        const ownerEmail = await userService.getUserEmailInTransaction(input.clubOwnerId, tx);
        if (!ownerEmail) {
          logger.error(
            `failed to send membership approved email for membership ${input.membershipId} because owner email not found for clubOwnerId ${input.clubOwnerId}`
          );
          return;
        }
        await emailClient.sendCustomEmail(
          sendTo,
          ownerEmail,
          template.subject,
          template.htmlContent,
          template.textContent
        );
      } else {
        // Legacy pattern: use provided replyTo email
        await emailClient.sendCustomEmail(
          sendTo,
          replyTo,
          template.subject,
          template.htmlContent,
          template.textContent
        );
      }
    } else {
      // New pattern: resolve owner email if clubOwnerId and transaction provided
      if (input.clubOwnerId && tx) {
        const ownerEmail = await userService.getUserEmailInTransaction(input.clubOwnerId, tx);
        if (!ownerEmail) {
          logger.error(
            `failed to send membership approved email for membership ${input.membershipId} because owner email not found for clubOwnerId ${input.clubOwnerId}`
          );
          return;
        }
        await emailClient.sendDefaultEmailForMembershipApproved(input, sendTo, ownerEmail);
      } else {
        // Legacy pattern: use provided replyTo email
        await emailClient.sendDefaultEmailForMembershipApproved(input, sendTo, replyTo);
      }
    }
  }

  async function sendDefaultEmailForMembershipDeclined(
    input: SendDefaultEmailForMembershipDeclinedInput,
    sendTo: Email,
    replyTo: Email,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const template = await getEmailTemplate({
      clubId: input.clubId,
      type: "REJECTION"
    });
    
    if (template) {
      // New pattern: resolve owner email if clubOwnerId and transaction provided
      if (input.clubOwnerId && tx) {
        const ownerEmail = await userService.getUserEmailInTransaction(input.clubOwnerId, tx);
        if (!ownerEmail) {
          logger.error(
            `failed to send membership declined email for membership ${input.membershipId} because owner email not found for clubOwnerId ${input.clubOwnerId}`
          );
          return;
        }
        await emailClient.sendCustomEmail(
          sendTo,
          ownerEmail,
          template.subject,
          template.htmlContent,
          template.textContent
        );
      } else {
        // Legacy pattern: use provided replyTo email
        await emailClient.sendCustomEmail(
          sendTo,
          replyTo,
          template.subject,
          template.htmlContent,
          template.textContent
        );
      }
    } else {
      // New pattern: resolve owner email if clubOwnerId and transaction provided
      if (input.clubOwnerId && tx) {
        const ownerEmail = await userService.getUserEmailInTransaction(input.clubOwnerId, tx);
        if (!ownerEmail) {
          logger.error(
            `failed to send membership declined email for membership ${input.membershipId} because owner email not found for clubOwnerId ${input.clubOwnerId}`
          );
          return;
        }
        await emailClient.sendDefaultEmailForMembershipDeclined(input, sendTo, ownerEmail);
      } else {
        // Legacy pattern: use provided replyTo email
        await emailClient.sendDefaultEmailForMembershipDeclined(input, sendTo, replyTo);
      }
    }
  }

  async function sendDefaultEmailForMembershipDeactivatedByMemberToOwner(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToOwnerInput,
    sendTo: Email,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    // New pattern: resolve owner email if clubOwnerId and transaction provided
    if (input.clubOwnerId && tx) {
      const ownerEmail = await userService.getUserEmailInTransaction(input.clubOwnerId, tx);
      if (!ownerEmail) {
        logger.error(
          `failed to send membership deactivated by member to owner email for membership ${input.membershipId} because owner email not found for clubOwnerId ${input.clubOwnerId}`
        );
        return;
      }
      await emailClient.sendDefaultEmailForMembershipDeactivatedByMemberToOwner(input, ownerEmail);
    } else {
      // Legacy pattern: use provided sendTo email
      await emailClient.sendDefaultEmailForMembershipDeactivatedByMemberToOwner(input, sendTo);
    }
  }

  async function sendDefaultEmailForMembershipDeactivatedByMemberToMember(
    input: SendDefaultEmailForMembershipDeactivatedByMemberToMemberInput,
    sendTo: Email,
    replyTo: Email,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const template = await getEmailTemplate({
      clubId: input.clubId,
      type: "DEPARTURE"
    });
    
    if (template) {
      // New pattern: resolve owner email if clubOwnerId and transaction provided
      if (input.clubOwnerId && tx) {
        const ownerEmail = await userService.getUserEmailInTransaction(input.clubOwnerId, tx);
        if (!ownerEmail) {
          logger.error(
            `failed to send membership deactivated by member to member email for membership ${input.membershipId} because owner email not found for clubOwnerId ${input.clubOwnerId}`
          );
          return;
        }
        await emailClient.sendCustomEmail(
          sendTo,
          ownerEmail,
          template.subject,
          template.htmlContent,
          template.textContent
        );
      } else {
        // Legacy pattern: use provided replyTo email
        await emailClient.sendCustomEmail(
          sendTo,
          replyTo,
          template.subject,
          template.htmlContent,
          template.textContent
        );
      }
    } else {
      // New pattern: resolve owner email if clubOwnerId and transaction provided
      if (input.clubOwnerId && tx) {
        const ownerEmail = await userService.getUserEmailInTransaction(input.clubOwnerId, tx);
        if (!ownerEmail) {
          logger.error(
            `failed to send membership deactivated by member to member email for membership ${input.membershipId} because owner email not found for clubOwnerId ${input.clubOwnerId}`
          );
          return;
        }
        await emailClient.sendDefaultEmailForMembershipDeactivatedByMemberToMember(input, sendTo, ownerEmail);
      } else {
        // Legacy pattern: use provided replyTo email
        await emailClient.sendDefaultEmailForMembershipDeactivatedByMemberToMember(input, sendTo, replyTo);
      }
    }
  }

  async function sendDefaultEmailForMembershipDeactivatedByOwner(
    input: SendDefaultEmailForMembershipDeactivatedByOwnerInput,
    sendTo: Email
  ): Promise<void> {
    await emailClient.sendDefaultEmailForMembershipDeactivatedByOwner(input, sendTo);
  }

  async function sendDefaultEmailForApplicationWithdrawnByMemberToOwner(
    input: SendDefaultEmailForApplicationWithdrawnByMemberToOwnerInput,
    sendTo: Email,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    // New pattern: resolve owner email if clubOwnerId and transaction provided
    if (input.clubOwnerId && tx) {
      const ownerEmail = await userService.getUserEmailInTransaction(input.clubOwnerId, tx);
      if (!ownerEmail) {
        logger.error(
          `failed to send application withdrawn by member to owner email for membership ${input.membershipId} because owner email not found for clubOwnerId ${input.clubOwnerId}`
        );
        return;
      }
      await emailClient.sendDefaultEmailForApplicationWithdrawnByMemberToOwner(input, ownerEmail);
    } else {
      // Legacy pattern: use provided sendTo email
      await emailClient.sendDefaultEmailForApplicationWithdrawnByMemberToOwner(input, sendTo);
    }
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
