import {
  EmailService,
  EmailTemplate,
  EmailTemplateId,
  SetEmailTemplateInput
} from "~/server/email/types";
import { PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { MutationResult, NO_ID_MUTATION_RESULT, Email } from "~/server/utils/types";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";
import { 
  EmailClient,
  NotifyMembershipApplicationSubmittedInput,
  NotifyMembershipApprovedInput,
  NotifyMembershipDeclinedInput,
  NotifyMembershipDeactivatedByMemberToOwnerInput,
  NotifyMembershipDeactivatedByMemberToMemberInput,
  NotifyMembershipDeactivatedByOwnerInput,
  NotifyApplicationWithdrawnByMemberToOwnerInput
} from "~/server/email/client/types";

const logger = rootLogger.child({ module: "emailTemplateService" });

export function createEmailService(
  prisma: PrismaClient,
  emailClient: EmailClient
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

  async function notifyMembershipApplicationSubmitted(
    input: NotifyMembershipApplicationSubmittedInput,
    sendTo: Email
  ): Promise<void> {
    await emailClient.notifyMembershipApplicationSubmitted(input, sendTo);
  }

  async function notifyMembershipApproved(
    input: NotifyMembershipApprovedInput,
    sendTo: Email,
    replyTo: Email
  ): Promise<void> {
    const template = await getEmailTemplate({
      clubId: input.clubId,
      type: "ACCEPTANCE"
    });
    
    if (template) {
      await emailClient.sendCustomEmail(
        sendTo,
        replyTo,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.notifyMembershipApproved(input, sendTo, replyTo);
    }
  }

  async function notifyMembershipDeclined(
    input: NotifyMembershipDeclinedInput,
    sendTo: Email,
    replyTo: Email
  ): Promise<void> {
    const template = await getEmailTemplate({
      clubId: input.clubId,
      type: "REJECTION"
    });
    
    if (template) {
      await emailClient.sendCustomEmail(
        sendTo,
        replyTo,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.notifyMembershipDeclined(input, sendTo, replyTo);
    }
  }

  async function notifyMembershipDeactivatedByMemberToOwner(
    input: NotifyMembershipDeactivatedByMemberToOwnerInput,
    sendTo: Email
  ): Promise<void> {
    await emailClient.notifyMembershipDeactivatedByMemberToOwner(input, sendTo);
  }

  async function notifyMembershipDeactivatedByMemberToMember(
    input: NotifyMembershipDeactivatedByMemberToMemberInput,
    sendTo: Email,
    replyTo: Email
  ): Promise<void> {
    const template = await getEmailTemplate({
      clubId: input.clubId,
      type: "DEPARTURE"
    });
    
    if (template) {
      await emailClient.sendCustomEmail(
        sendTo,
        replyTo,
        template.subject,
        template.htmlContent,
        template.textContent
      );
    } else {
      await emailClient.notifyMembershipDeactivatedByMemberToMember(input, sendTo, replyTo);
    }
  }

  async function notifyMembershipDeactivatedByOwner(
    input: NotifyMembershipDeactivatedByOwnerInput,
    sendTo: Email
  ): Promise<void> {
    await emailClient.notifyMembershipDeactivatedByOwner(input, sendTo);
  }

  async function notifyApplicationWithdrawnByMemberToOwner(
    input: NotifyApplicationWithdrawnByMemberToOwnerInput,
    sendTo: Email
  ): Promise<void> {
    await emailClient.notifyApplicationWithdrawnByMemberToOwner(input, sendTo);
  }

  return {
    getEmailTemplate,
    setEmailTemplate,
    deleteEmailTemplate,
    notifyMembershipApplicationSubmitted,
    notifyMembershipApproved,
    notifyMembershipDeclined,
    notifyMembershipDeactivatedByMemberToOwner,
    notifyMembershipDeactivatedByMemberToMember,
    notifyMembershipDeactivatedByOwner,
    notifyApplicationWithdrawnByMemberToOwner
  };
}
