import {
  Email,
  LongTextSchema,
  MutationResult,
  RequiredStringSchema,
  UrlSchema
} from "~/server/utils/types";
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
  getUserSocials(userId: number): Promise<UserSocials | null>;
  getUserSocialsInTransaction(
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<UserSocials | null>;
};

export type UserSocials = {
  twitter?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
};

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  description: string;
  socials?: UserSocials;
  createdAt: Date;
};

export type UserMutations = {
  createUser(
    input: CreateUserInput,
    authUserId: string,
    authEmail: string
  ): Promise<MutationResult>;
  updateUser(id: number, input: UpdateUserInput): Promise<MutationResult>;
  updateUserSocials(id: number, input: UpdateUserSocialsInput): Promise<MutationResult>;
};

export const CreateUserInputSchema = z.object({
  firstName: RequiredStringSchema,
  lastName: RequiredStringSchema,
  description: LongTextSchema
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserInputSchema = z.object({
  description: LongTextSchema
});
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export const UpdateUserSocialsInputSchema = z.object({
  twitter: UrlSchema.nullable().or(z.literal("")),
  instagram: UrlSchema.nullable().or(z.literal("")),
  facebook: UrlSchema.nullable().or(z.literal("")),
  linkedin: UrlSchema.nullable().or(z.literal("")),
  website: UrlSchema.nullable().or(z.literal(""))
});
export type UpdateUserSocialsInput = z.infer<typeof UpdateUserSocialsInputSchema>;
