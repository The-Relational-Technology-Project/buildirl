import {z} from "zod";
import {Id, Maybe} from "~/utils/types";

export type MainService = MainQueries & MainMutations;

export type MainQueries = {
    // top-level
    user(id: number): Promise<User>;
    userOwnedClubs(userId: number): Promise<Club[]>;
    userMemberships(userId: number): Promise<Membership[]>;
    clubByPublicId(publicId: string): Promise<Club>;
    membershipsForClub(clubId: number): Promise<Membership[]>;
    membershipApplicationsForClub(clubId: number): Promise<Membership[]>;
    clubStatistics(clubId: number): Promise<ClubStatistics>;
    // entities
    club(id: number): Promise<Club>;
};

export type User = {
    id: number;
    firstName: string;
    lastName: string;
    description: string;
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

export type MembershipStatus = 'ACTIVE' | 'PENDING' | 'DECLINED' | 'INACTIVE';

export type Membership = {
    id: bigint;
    user: User;
    club: Club;
    membershipTier: MembershipTier;
    status: MembershipStatus;
    applicationResponses: ApplicationResponses;
    joinedAt: Date;
};

export type MembershipTier = {
    id: number;
    name: string;
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
    createUser(input: CreateUserInput, authUserId: string): Promise<MutationResult>;
    updateUser(id: number, input: UpdateUserInput): Promise<MutationResult>;
    createClub(input: CreateClubInput, userId: number): Promise<MutationResult>;
    updateClub(id: number, input: UpdateClubInput): Promise<MutationResult>;
    updateClubApplicationQuestions(
        clubId: number,
        input: UpdateClubApplicationQuestionsInput
    ): Promise<MutationResult>;
    createMembershipTier(
        input: CreateMembershipTierInput
    ): Promise<MutationResult>;
    updateMembershipTier(
        id: number,
        input: UpdateMembershipTierInput
    ): Promise<MutationResult>;
    submitMembershipApplication(
        input: SubmitMembershipApplicationInput,
        userId: number
    ): Promise<MutationResult>;
    approveMembershipApplication(
        input: ApproveMembershipApplicationInput
    ): Promise<MutationResult>;
    declineMembershipApplication(
        input: DeclineMembershipApplicationInput
    ): Promise<MutationResult>;
    deactivateMembership(
        input: DeactivateMembershipInput
    ): Promise<MutationResult>;
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

export const CreateUserInputSchema = z.object({
    firstName: FirstNameSchema,
    lastName: LastNameSchema,
    description: z.string()
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserInputSchema = z.object({
    description: z.string()
});
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export const ClubPublicIdSchema = z
    .string()
    .min(3, "Length must be >= 3")
    .regex(CLUB_PUBLIC_ID_REGEX, "Invalid characters");

export const URLSchema = z.string().url("Not a valid url");
export type URL = z.infer<typeof URLSchema>;

export const InstagramHandleSchema = z
    .string()
    .regex(INSTAGRAM_HANDLE_REGEX, "Not a valid Instagram handle");
export type InstagramHandle = z.infer<typeof InstagramHandleSchema>;

export const ClubNameSchema = z.string().min(3);

export const CreateClubInputSchema = z.object({
    name: ClubNameSchema,
    publicId: ClubPublicIdSchema,
    tagLine: z.string(),
    description: z.string(),
    websiteURL: URLSchema.nullable(),
    instagramHandle: InstagramHandleSchema.nullable(),
    eventCalendarURL: URLSchema.nullable()
});
export type CreateClubInput = z.infer<typeof CreateClubInputSchema>;

export const UpdateClubInputSchema = z.object({
    name: ClubNameSchema,
    publicId: ClubPublicIdSchema,
    tagLine: z.string(),
    description: z.string(),
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

export const CreateMembershipTierInputSchema = z.object({
    clubId: z.number(),
    name: z.string(),
    benefitDescription: z.string(),
    contributionDescription: z.string(),
    costPerMonthInUSD: z.number()
});
export type CreateMembershipTierInput = z.infer<
    typeof CreateMembershipTierInputSchema
>;

export const UpdateMembershipTierInputSchema = z.object({
    id: z.number(),
    name: z.string(),
    benefitDescription: z.string(),
    contributionDescription: z.string(),
    costPerMonthInUSD: z.number()
});
export type UpdateMembershipTierInput = z.infer<
    typeof UpdateMembershipTierInputSchema
>;

export const SubmitMembershipApplicationInputSchema = z.object({
    clubId: z.number(),
    membershipTierId: z.number(),
    applicationResponses: ApplicationResponsesSchema
});
export type SubmitMembershipApplicationInput = z.infer<
    typeof SubmitMembershipApplicationInputSchema
>;

export const ApproveMembershipApplicationInputSchema = z.object({
    membershipId: z.number()
});
export type ApproveMembershipApplicationInput = z.infer<
    typeof ApproveMembershipApplicationInputSchema
>;

export const DeclineMembershipApplicationInputSchema = z.object({
    membershipId: z.number()
});
export type DeclineMembershipApplicationInput = z.infer<
    typeof DeclineMembershipApplicationInputSchema
>;

export const DeactivateMembershipInputSchema = z.object({
    membershipId: z.number()
});
export type DeactivateMembershipInput = z.infer<
    typeof DeactivateMembershipInputSchema
>;

export type MutationResult = {
    createdEntityId: Maybe<Id>;
};

export const NO_ID_MUTATION_RESULT = {
    createdEntityId: null
};
