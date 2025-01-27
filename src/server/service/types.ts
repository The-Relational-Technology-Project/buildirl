import { z } from "zod";
import { Id, Maybe } from "~/utils/types";

export type MainService = MainQueries & MainMutations;

export type MainQueries = {
  // top-level
  getUser(id: number): Promise<User>;
  getUserOwnedClubs(userId: number): Promise<Club[]>;
  // all memberships, regardless of status
  getUserMemberships(userId: number): Promise<Membership[]>;
  getClubByPublicId(publicId: string): Promise<Club>;
  getActiveMembershipsForClub(clubId: number): Promise<Membership[]>;
  getMembershipApplicationsForClub(clubId: number): Promise<Membership[]>;
  getClubStatistics(clubId: number): Promise<ClubStatistics>;
  // entities
  getClub(id: number): Promise<Club>;
};

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  description: string;
  createdAt: Date;
};

export type Club = {
  id: number;
  publicId: string;
  name: string;
  tagLine: string;
  description: string;
  owner: User;
  websiteURL: Maybe<URL>;
  instagramHandle: Maybe<InstagramHandle>;
  eventCalendarURL: Maybe<URL>;
  applicationQuestions: ApplicationQuestions;
  membershipTiers: MembershipTier[];
};

// TODO define the shape of this, one of the text questions need to
//  be marked as primary display
export const ApplicationQuestionsSchema = z.object({});
export type ApplicationQuestions = z.infer<typeof ApplicationQuestionsSchema>;

export type MembershipStatus = "ACTIVE" | "PENDING" | "DECLINED" | "INACTIVE";
export type MembershipTierStatus = "PUBLISHED" | "UNPUBLISHED";

export type Membership = {
  id: bigint;
  user: User;
  club: Club;
  membershipTier: MembershipTier;
  status: MembershipStatus;
  applicationResponses: ApplicationResponses;
  createdAt: Date;
};

export type MembershipTier = {
  id: number;
  name: string;
  status: MembershipTierStatus;
  benefitDescription: string;
  contributionDescription: string;
  costPerMonthInUSD: number;
};

// TODO define the shape of this relative to ApplicationQuestionsSchema
export const ApplicationResponsesSchema = z.object({});
export type ApplicationResponses = z.infer<typeof ApplicationQuestionsSchema>;

export type ClubStatistics = {
  memberCount: number;
  pendingMembershipApplications: number;
};

// TODO define
export type MainMutations = {
  createUser(
    input: CreateUserInput,
    authUserId: string
  ): Promise<MutationResult>;
  updateUser(id: number, input: UpdateUserInput): Promise<MutationResult>;
  createClub(input: CreateClubInput, userId: number): Promise<MutationResult>;
  updateClub(id: number, input: UpdateClubInput): Promise<MutationResult>;
  deleteClub(id: number): Promise<MutationResult>;
  updateClubApplicationQuestions(
    clubId: number,
    input: UpdateClubApplicationQuestionsInput
  ): Promise<MutationResult>;
  createMembershipTier(
    clubId: number,
    input: CreateMembershipTierInput
  ): Promise<MutationResult>;
  updateMembershipTier(
    id: number,
    input: UpdateMembershipTierInput
  ): Promise<MutationResult>;
  deleteMembershipTier(id: number): Promise<MutationResult>;
  publishMembershipTier(id: number): Promise<MutationResult>;
  unpublishMembershipTier(id: number): Promise<MutationResult>;
  submitMembershipApplication(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number
  ): Promise<MutationResult>;
  approveMembershipApplication(membershipId: bigint): Promise<MutationResult>;
  declineMembershipApplication(membershipId: bigint): Promise<MutationResult>;
  deactivateMembership(membershipId: bigint): Promise<MutationResult>;
};

const FIRST_NAME_REGEX = /^[a-zA-Z]+$/;
const LAST_NAME_REGEX = /^[a-zA-Z-']+$/;
const CLUB_PUBLIC_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const INSTAGRAM_HANDLE_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._]{0,29}$/;

export const FirstNameSchema = z
  .string()
  .min(1, "Required")
  .min(2, "Length must be >= 2")
  .regex(FIRST_NAME_REGEX, "Invalid characters");

export const LastNameSchema = z
  .string()
  .min(1, "Required")
  .min(2, "Length must be >= 2")
  .regex(LAST_NAME_REGEX, "Invalid characters");

export const LongTextSchema = z
  .string()
  .max(1000, "Cannot be more than 1000 characters");

export const CreateUserInputSchema = z.object({
  firstName: FirstNameSchema,
  lastName: LastNameSchema,
  description: LongTextSchema
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserInputSchema = z.object({
  description: LongTextSchema
});
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export const ClubPublicIdSchema = z
  .string()
  .min(3, "Length must be >= 3 characters")
  .regex(CLUB_PUBLIC_ID_REGEX, "Invalid characters");

export const URLSchema = z.string().url("Not a valid url");
export type URL = z.infer<typeof URLSchema>;

export const InstagramHandleSchema = z
  .string()
  .regex(INSTAGRAM_HANDLE_REGEX, "Not a valid Instagram handle");
export type InstagramHandle = z.infer<typeof InstagramHandleSchema>;

export const ClubNameSchema = z
  .string()
  .min(3, "Length must be >= 3 characters");

export const ClubTagLineSchema = z
  .string()
  .max(80, "Length must be <= 80 characters");

export const CreateClubInputSchema = z.object({
  name: ClubNameSchema,
  publicId: ClubPublicIdSchema,
  tagLine: ClubTagLineSchema,
  description: LongTextSchema,
  websiteURL: URLSchema.nullable(),
  instagramHandle: InstagramHandleSchema.nullable(),
  eventCalendarURL: URLSchema.nullable()
});
export type CreateClubInput = z.infer<typeof CreateClubInputSchema>;

export const UpdateClubInputSchema = z.object({
  name: ClubNameSchema,
  publicId: ClubPublicIdSchema,
  tagLine: ClubTagLineSchema,
  description: LongTextSchema,
  websiteURL: URLSchema.nullable(),
  instagramHandle: InstagramHandleSchema.nullable(),
  eventCalendarURL: URLSchema.nullable()
});
export type UpdateClubInput = z.infer<typeof UpdateClubInputSchema>;

export const UpdateClubApplicationQuestionsInputSchema = z.object({
  applicationQuestions: ApplicationQuestionsSchema
});
export type UpdateClubApplicationQuestionsInput = z.infer<
  typeof UpdateClubApplicationQuestionsInputSchema
>;

// restrict to reasonable monetary range ($0.01 to $1000.00) with 2 decimal places
export const MonetaryValueSchema = z
  .number()
  .min(0.01, "Must be a positive value greater than $0.01")
  .max(1000.0, "Cannot be greater than $1000.00")
  // 2 decimal places
  .transform((val) => Number(val.toFixed(2)));

export const MembershipTierNameSchema = z
  .string()
  .min(3, "Length must be >= 3 characters");

export const CreateMembershipTierInputSchema = z.object({
  name: MembershipTierNameSchema,
  benefitDescription: LongTextSchema,
  contributionDescription: LongTextSchema,
  costPerMonthInUSD: MonetaryValueSchema
});
export type CreateMembershipTierInput = z.infer<
  typeof CreateMembershipTierInputSchema
>;

export const UpdateMembershipTierInputSchema = z.object({
  name: MembershipTierNameSchema,
  benefitDescription: LongTextSchema,
  contributionDescription: LongTextSchema,
  // allow 0 no-op update only on the default free membership tier
  // there is no good way to express this as a check on zod though; it
  // will be checked in service layer
  costPerMonthInUSD: MonetaryValueSchema.or(z.literal(0))
});
export type UpdateMembershipTierInput = z.infer<
  typeof UpdateMembershipTierInputSchema
>;

export const SubmitMembershipApplicationInputSchema = z.object({
  applicationResponses: ApplicationResponsesSchema
});
export type SubmitMembershipApplicationInput = z.infer<
  typeof SubmitMembershipApplicationInputSchema
>;

export type MutationResult = {
  createdEntityId: Maybe<Id>;
};

export const NO_ID_MUTATION_RESULT = {
  createdEntityId: null
};
