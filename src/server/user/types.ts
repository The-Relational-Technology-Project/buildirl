import {
  LongTextSchema,
  MutationResult,
  RequiredStringSchema
} from "~/server/utils/types";
import { z } from "zod";

export type UserService = UserQueries & UserMutations;

export type UserQueries = {
  // top-level
  getUser(id: number): Promise<User>;
};

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  description: string;
  createdAt: Date;
};

export type UserMutations = {
  createUser(
    input: CreateUserInput,
    authUserId: string,
    authEmail: string
  ): Promise<MutationResult>;
  updateUser(id: number, input: UpdateUserInput): Promise<MutationResult>;
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
