import {
  Email,
  LongTextSchema,
  MutationResult,
  RequiredStringSchema,
  UrlSchema,
  TwitterHandleSchema,
  InstagramHandleSchema,
  FacebookHandleSchema,
  LinkedInHandleSchema
} from "~/server/utils/types";
import { Maybe } from "~/utils/types";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export type UserService = UserQueries & UserMutations;

export type UserQueries = {
  // top-level
  getUser(id: number): Promise<User>;
  // internal
  getUserEmail(userId: number): Promise<Email>;
  getUserEmails(userIds: number[]): Promise<Email[]>;
  getUserEmailInTransaction(
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<Email>;
  getUserEmailsInTransaction(
    userIds: number[],
    tx: Prisma.TransactionClient
  ): Promise<Email[]>;
  getUserSocials(userId: number): Promise<Maybe<UserSocials>>;
  getUserSocialsInTransaction(
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<Maybe<UserSocials>>;
};

export type UserSocials = {
  twitter: Maybe<string>;
  instagram: Maybe<string>;
  facebook: Maybe<string>;
  linkedin: Maybe<string>;
  website: Maybe<string>;
};

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  description: string;
  socials: Maybe<UserSocials>;
  createdAt: Date;
};

export type UserMutations = {
  createUser(
    input: CreateUserInput,
    authUserId: string,
    authEmail: string
  ): Promise<MutationResult>;
  updateUser(id: number, input: UpdateUserInput): Promise<MutationResult>;
  updateUserSocials(
    id: number,
    input: UpdateUserSocialsInput
  ): Promise<MutationResult>;
};

export const CreateUserInputSchema = z.object({
  firstName: RequiredStringSchema,
  lastName: RequiredStringSchema,
  description: LongTextSchema
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserInputSchema = z.object({
  firstName: RequiredStringSchema,
  lastName: RequiredStringSchema,
  description: LongTextSchema
});
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export const UpdateUserSocialsInputSchema = z.object({
  twitter: TwitterHandleSchema.nullable(),
  instagram: InstagramHandleSchema.nullable(),
  facebook: FacebookHandleSchema.nullable(),
  linkedin: LinkedInHandleSchema.nullable(),
  website: UrlSchema.nullable()
});
export type UpdateUserSocialsInput = z.infer<
  typeof UpdateUserSocialsInputSchema
>;
