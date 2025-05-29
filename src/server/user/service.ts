import { Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { stringify } from "~/utils";
import {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserService
} from "~/server/user/types";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";

const logger = rootLogger.child({ module: "userService" });

export const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  description: true,
  createdAt: true
};

export function createUserService(prisma: PrismaClient): UserService {
  async function getUser(id: number): Promise<User> {
    try {
      const user = await prisma.user.findUniqueOrThrow({
        select: USER_SELECT,
        where: {
          id: id
        }
      });
      logger.info(`queried user with id ${id} with result ${stringify(user)}`);
      return user;
    } catch (e) {
      logger.error(e, `failed to query user with id ${id}`);
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

  return {
    getUser,
    createUser,
    updateUser
  };
}
