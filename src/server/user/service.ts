import { Prisma, type PrismaClient } from "@prisma/client";
import UserGetPayload = Prisma.UserGetPayload;
import { rootLogger } from "~/logger";
import { stringify } from "~/utils";
import {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserSocialsInput,
  User,
  UserService,
  UserSocials
} from "~/server/user/types";
import {
  Email,
  MutationResult,
  NO_ID_MUTATION_RESULT
} from "~/server/utils/types";
import { Maybe } from "~/utils/types";

const logger = rootLogger.child({ module: "userService" });

export const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  description: true,
  socials: true,
  createdAt: true
};

export function asUser(
  r: UserGetPayload<{ select: typeof USER_SELECT }>
): User {
  const socials: Maybe<UserSocials> = r.socials ? {
    twitter: r.socials.twitter,
    instagram: r.socials.instagram,
    facebook: r.socials.facebook,
    linkedin: r.socials.linkedin,
    website: r.socials.website
  } : null;

  return {
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    description: r.description,
    createdAt: r.createdAt,
    socials
  };
}

export function createUserService(prisma: PrismaClient): UserService {
  async function getUser(id: number): Promise<User> {
    try {
      const user = await prisma.user.findUniqueOrThrow({
        select: USER_SELECT,
        where: {
          id: id
        }
      });
      
      const result = asUser(user);
      logger.info(`queried user with id ${id} with result ${stringify(result)}`);
      return result;
    } catch (e) {
      logger.error(e, `failed to query user with id ${id}`);
      throw e;
    }
  }

  async function getUserEmail(userId: number): Promise<Email> {
    return prisma.$transaction(async (tx) => {
      return getUserEmailInTransaction(userId, tx);
    });
  }

  async function getUserEmails(userIds: number[]): Promise<Email[]> {
    return prisma.$transaction(async (tx) => {
      return getUserEmailsInTransaction(userIds, tx);
    });
  }

  async function getUserEmailInTransaction(
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<Email> {
    try {
      const userSettings = await tx.userSettings.findUniqueOrThrow({
        where: {
          userId: userId
        }
      });
      logger.info(`queried user email for user with id ${userId}`);

      if (!userSettings.email) {
        const errorMessage = `failed to find required email for user with id ${userId}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      return userSettings.email;
    } catch (e) {
      logger.error(e, `failed to query user email for user with id ${userId}`);
      throw e;
    }
  }

  async function getUserEmailsInTransaction(
    userIds: number[],
    tx: Prisma.TransactionClient
  ): Promise<Email[]> {
    return Promise.all(
      userIds.map((userId) => getUserEmailInTransaction(userId, tx))
    );
  }

  async function getUserSocials(userId: number): Promise<Maybe<UserSocials>> {
    return prisma.$transaction(async (tx) => {
      return getUserSocialsInTransaction(userId, tx);
    });
  }

  async function getUserSocialsInTransaction(
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<Maybe<UserSocials>> {
    try {
      const userSocials = await tx.userSocials.findUnique({
        where: {
          userId: userId
        }
      });
      
      if (!userSocials) {
        logger.info(`no socials found for user with id ${userId}`);
        return null;
      }

      const result: UserSocials = {
        twitter: userSocials.twitter,
        instagram: userSocials.instagram,
        facebook: userSocials.facebook,
        linkedin: userSocials.linkedin,
        website: userSocials.website
      };

      logger.info(`queried user socials for user with id ${userId}`);
      return result;
    } catch (e) {
      logger.error(e, `failed to query user socials for user with id ${userId}`);
      throw e;
    }
  }

  async function createUser(
    input: CreateUserInput,
    authUserId: string,
    authEmail: string
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createUserInTransaction(input, authUserId, authEmail, tx);
    });
  }

  async function createUserInTransaction(
    input: CreateUserInput,
    authUserId: string,
    authEmail: string,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.user.create({
        data: {
          ...input,
          authUserId
        },
        select: {
          id: true
        }
      });

      logger.info(
        `created user from input ${stringify(input)} with userId ${id}`
      );

      await createUserSettingInTransaction(id, authEmail, tx);

      return { createdEntityId: id };
    } catch (e) {
      logger.error(e, `failed to create user from input ${stringify(input)}`);
      throw e;
    }
  }

  async function createUserSettingInTransaction(
    userId: number,
    authEmail: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      await tx.userSettings.create({
        data: { userId, email: authEmail }
      });
      logger.info(`created user setting for user with id ${userId}`);
    } catch (e) {
      logger.error(
        e,
        `failed to create user setting for user with id ${userId}`
      );
      throw e;
    }
  }

  async function updateUser(
    id: number,
    input: UpdateUserInput
  ): Promise<MutationResult> {
    try {
      await prisma.user.update({
        data: input,
        where: {
          id: id
        }
      });
      logger.info(`updated user with id ${id} from input ${stringify(input)}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update user with id ${id} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function updateUserSocials(
    id: number,
    input: UpdateUserSocialsInput
  ): Promise<MutationResult> {
    try {
      await prisma.userSocials.upsert({
        where: { userId: id },
        create: {
          userId: id,
          ...input
        },
        update: input
      });

      logger.info(`updated user socials for user with id ${id} from input ${stringify(input)}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update user socials for user with id ${id} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  return {
    getUser,
    getUserEmail,
    getUserEmails,
    getUserEmailInTransaction,
    getUserEmailsInTransaction,
    getUserSocials,
    getUserSocialsInTransaction,
    createUser,
    updateUser,
    updateUserSocials
  };
}
