import {
  EmailService,
  EmailTemplate,
  EmailTemplateId,
  EmailTemplateType,
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
import { EmailVariables, DEFAULT_EMAIL_TEMPLATES } from "~/utils/email";

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

  async function getEmailVariableValues(
    membershipId: bigint,
    emailType: EmailTemplateType,
    tx: Prisma.TransactionClient
  ): Promise<EmailVariables> {
    const membership = await tx.membership.findUniqueOrThrow({
      where: { id: membershipId },
      select: {
        user: {
          select: { firstName: true, lastName: true }
        },
        membershipTier: {
          select: {
            club: {
              select: { name: true, publicId: true }
            }
          }
        }
      }
    });

    const variables: EmailVariables = {
      clubName: membership.membershipTier.club.name,
      memberFirstName: membership.user.firstName,
      memberLastName: membership.user.lastName
    };

    if (emailType === "ACCEPTANCE") {
      variables.joinPageUrl = `${process.env.NEXT_PUBLIC_APPLICATION_URL}/join/${membership.membershipTier.club.publicId}`;
    }

    return variables;
  }

  async function sendEmailForMembershipApplicationSubmitted(
    input: SendEmailForMembershipApplicationSubmittedInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const member = await tx.user.findUniqueOrThrow({
      where: { id: input.memberUserId },
      select: {
        firstName: true,
        lastName: true
      }
    });

    const club = await tx.club.findUniqueOrThrow({
      where: { id: input.clubId },
      select: { name: true }
    });

    const leadEmails = await userService.getUserEmailsInTransaction(
      input.clubLeadUserIds,
      tx
    );

    await emailClient.sendEmailForMembershipApplicationSubmitted(
      {
        ...input,
        memberFirstName: member.firstName,
        memberLastName: member.lastName,
        clubName: club.name
      },
      leadEmails
    );
  }

  async function sendEmailForMembershipApproved(
    input: SendEmailForMembershipApprovedInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const membership = await tx.membership.findUniqueOrThrow({
      where: { id: input.membershipId },
      select: {
        userId: true,
        membershipTier: { select: { clubId: true } }
      }
    });

    const leadMemberships = await tx.membership.findMany({
      where: {
        membershipTier: { clubId: membership.membershipTier.clubId },
        status: "ACTIVE",
        role: "LEAD"
      },
      select: { userId: true }
    });

    const variables = await getEmailVariableValues(input.membershipId, "ACCEPTANCE", tx);

    const template = await getEmailTemplate({ clubId: membership.membershipTier.clubId, type: "ACCEPTANCE" });
    const memberEmail = await userService.getUserEmailInTransaction(membership.userId, tx);
    const leadEmails = await userService.getUserEmailsInTransaction(leadMemberships.map(m => m.userId), tx);

    if (!memberEmail) {
      throw new Error(`No email found for member with userId ${membership.userId}`);
    }

    await emailClient.sendInterpolatedEmail(
      template || DEFAULT_EMAIL_TEMPLATES.ACCEPTANCE,
      variables,
      memberEmail,
      leadEmails
    );
  }

  async function sendEmailForMembershipDeclined(
    input: SendEmailForMembershipDeclinedInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const membership = await tx.membership.findUniqueOrThrow({
      where: { id: input.membershipId },
      select: {
        userId: true,
        membershipTier: { select: { clubId: true } }
      }
    });

    const leadMemberships = await tx.membership.findMany({
      where: {
        membershipTier: { clubId: membership.membershipTier.clubId },
        status: "ACTIVE",
        role: "LEAD"
      },
      select: { userId: true }
    });

    const variables = await getEmailVariableValues(input.membershipId, "REJECTION", tx);

    const template = await getEmailTemplate({ clubId: membership.membershipTier.clubId, type: "REJECTION" });
    const memberEmail = await userService.getUserEmailInTransaction(membership.userId, tx);
    const leadEmails = await userService.getUserEmailsInTransaction(leadMemberships.map(m => m.userId), tx);

    if (!memberEmail) {
      throw new Error(`No email found for member with userId ${membership.userId}`);
    }

    await emailClient.sendInterpolatedEmail(
      template || DEFAULT_EMAIL_TEMPLATES.REJECTION,
      variables,
      memberEmail,
      leadEmails
    );
  }

  async function sendEmailForMembershipDeactivatedByMemberToLead(
    input: SendEmailForMembershipDeactivatedByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {

    const member = await tx.user.findUniqueOrThrow({
      where: { id: input.memberUserId },
      select: { firstName: true, lastName: true }
    });
    const club = await tx.club.findUniqueOrThrow({
      where: { id: input.clubId },
      select: { name: true }
    });
    const leadEmails = await userService.getUserEmailsInTransaction(input.clubLeadUserIds, tx);

    await emailClient.sendEmailForMembershipDeactivatedByMemberToLead(
      {
        ...input,
        memberFirstName: member.firstName,
        memberLastName: member.lastName,
        clubName: club.name
      },
      leadEmails
    );
  }

  async function sendEmailForMembershipDeactivatedByMemberToMember(
    input: SendEmailForMembershipDeactivatedByMemberToMemberInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const membership = await tx.membership.findUniqueOrThrow({
      where: { id: input.membershipId },
      select: {
        userId: true,
        membershipTier: { select: { clubId: true } }
      }
    });

    const leadMemberships = await tx.membership.findMany({
      where: {
        membershipTier: { clubId: membership.membershipTier.clubId },
        status: "ACTIVE",
        role: "LEAD"
      },
      select: { userId: true }
    });

    const variables = await getEmailVariableValues(input.membershipId, "DEPARTURE", tx);

    const template = await getEmailTemplate({ clubId: membership.membershipTier.clubId, type: "DEPARTURE" });
    const memberEmail = await userService.getUserEmailInTransaction(membership.userId, tx);
    const leadEmails = await userService.getUserEmailsInTransaction(leadMemberships.map(m => m.userId), tx);

    if (!memberEmail) {
      throw new Error(`No email found for member with userId ${membership.userId}`);
    }

    await emailClient.sendInterpolatedEmail(
      template || DEFAULT_EMAIL_TEMPLATES.DEPARTURE,
      variables,
      memberEmail,
      leadEmails
    );
  }

  async function sendEmailForMembershipDeactivatedByLead(
    input: SendEmailForMembershipDeactivatedByLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const club = await tx.club.findUniqueOrThrow({
      where: { id: input.clubId },
      select: { name: true }
    });
    const memberEmail = await userService.getUserEmailInTransaction(input.memberUserId, tx);

    await emailClient.sendEmailForMembershipDeactivatedByLead(
      {
        ...input,
        clubName: club.name
      },
      memberEmail
    );
  }

  async function sendEmailForApplicationWithdrawnByMemberToLead(
    input: SendEmailForApplicationWithdrawnByMemberToLeadInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const member = await tx.user.findUniqueOrThrow({
      where: { id: input.memberUserId },
      select: { firstName: true, lastName: true }
    });
    const club = await tx.club.findUniqueOrThrow({
      where: { id: input.clubId },
      select: { name: true }
    });
    const leadEmails = await userService.getUserEmailsInTransaction(input.clubLeadUserIds, tx);

    await emailClient.sendEmailForApplicationWithdrawnByMemberToLead(
      {
        ...input,
        memberFirstName: member.firstName,
        memberLastName: member.lastName,
        clubName: club.name
      },
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
  ): Promise<MutationResult> {
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
      return { createdEntityId: newBlast.id };
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
  ): Promise<MutationResult> {
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
      return NO_ID_MUTATION_RESULT;
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
    return prisma.$transaction(async (tx) => {
      try {
        const emailBlast = await tx.emailBlast.findUniqueOrThrow({
          where: { id }
        });

        if (emailBlast.status === "SENT") {
          throw new Error("Email blast has already been sent");
        }

        const leadMemberships = await tx.membership.findMany({
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

        const leadEmails = await userService.getUserEmailsInTransaction(leadUserIds, tx);
        if (leadEmails.length === 0) {
          throw new Error(`No lead emails found for club ${emailBlast.clubId}`);
        }

        const club = await tx.club.findUniqueOrThrow({
          where: { id: emailBlast.clubId },
          select: { name: true }
        });

        const memberships = await tx.membership.findMany({
          where: {
            membershipTier: { clubId: emailBlast.clubId },
            status: "ACTIVE"
          },
          select: {
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        });

        const template = {
          subject: emailBlast.subject,
          htmlContent: emailBlast.htmlContent,
          textContent: emailBlast.textContent
        };

        for (const membership of memberships) {
          const memberEmail = await userService.getUserEmailInTransaction(membership.userId, tx);
          
          const variables: EmailVariables = {
            clubName: club.name,
            memberFirstName: membership.user.firstName,
            memberLastName: membership.user.lastName
          };
          
          await emailClient.sendInterpolatedEmail(template, variables, memberEmail, leadEmails);
        }

        await setEmailBlastStatus(id, "SENT");

        logger.info(
          `sent email blast with id ${id} to ${memberships.length} members with interpolation`
        );
      } catch (e) {
        logger.error(e, `failed to send email blast with id ${id}`);
        throw e;
      }
    });
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
