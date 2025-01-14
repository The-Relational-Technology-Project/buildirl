import {z} from "zod";
import {Id, Maybe} from "~/utils/types";

export type MainService = MainQueries & MainMutations;

export type MainQueries = {
    // top-level
    user(): Promise<User>;
    userOwnedClubs(): Promise<Club[]>;
    userMemberships(): Promise<Membership[]>;
    club(publicId: string): Promise<Club>;
    membershipsForClub(clubId: number): Promise<Membership[]>;
    membershipApplicationsForClub(clubId: number): Promise<Membership[]>;
    clubStatistics(clubId: number): Promise<ClubStatistics>;
};

export type User = {
    id: number;
    firstName: string;
    lastName: string;
    description: string;
}

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
    applicationQuestions: Maybe<ApplicationQuestions>;
    membershipTiers: MembershipTier[];
}

// TODO define the shape of this, one of the text questions need to
//  be marked as primary display
export const ApplicationQuestionsSchema = z.object({});
export type ApplicationQuestions = z.infer<typeof ApplicationQuestionsSchema>;

export enum MembershipStatus {
    ACTIVE,
    PENDING,
    DECLINED,
    INACTIVE
}

export type Membership = {
    id: number;
    user: User;
    club: Club;
    membershipTier: MembershipTier;
    status: MembershipStatus;
    applicationResponse: ApplicationResponses;
    joinedAt: Date
}

export type MembershipTier = {
    id: number;
    name: string;
    benefitDescription: string;
    contributionDescription: string;
    costPerMonthInUSD: USDAmount;
}

export const USDAmountSchema = z.number().multipleOf(0.01);
export type USDAmount = z.infer<typeof USDAmountSchema>;

// TODO define the shape of this relative to ApplicationQuestionsSchema
export const ApplicationResponsesSchema = z.object({});
export type ApplicationResponses = z.infer<typeof ApplicationQuestionsSchema>;

export type ClubStatistics = {
    memberCount: number;
    pendingMembershipApplications: number;
}

// TODO define
export type MainMutations = {
    createUser(input: CreateUserInput): Promise<MutationResult>;
    updateUser(input: UpdateUserInput): Promise<MutationResult>;
    createClub(input: CreateClubInput): Promise<MutationResult>;
    updateClub(input: UpdateClubInput): Promise<MutationResult>;
    upsertApplicationQuestionsForClub(input: UpsertApplicationQuestionsForClubInput): Promise<MutationResult>;
    createMembershipTier(input: CreateMembershipTierInput): Promise<MutationResult>;
    updateMembershipTier(input: UpdateMembershipTierInput): Promise<MutationResult>;
    submitMembershipApplication(input: SubmitMembershipApplicationInput): Promise<MutationResult>;
    approveMembershipApplication(input: ApproveMembershipApplicationInput): Promise<MutationResult>;
    declineMembershipApplication(input: DeclineMembershipApplicationInput): Promise<MutationResult>;
    deactivateMembership(input: DeactivateMembershipInput): Promise<MutationResult>;
}

export const FIRST_NAME_REGEX = /^[a-zA-Z]+$/;
export const LAST_NAME_REGEX = /^[a-zA-Z-']+$/;
export const CLUB_PUBLIC_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

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
    authUserId: z.string(),
    firstName: FirstNameSchema,
    lastName: LastNameSchema,
    description: z.string()
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserInputSchema = z.object({
    description: z.string()
})
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export const ClubPublicIdSchema = z
    .string()
    .min(1, "Required")
    .min(3, "Length must be >= 3")
    .regex(CLUB_PUBLIC_ID_REGEX, "Invalid characters");

export const URLSchema = z.string().url("Not a valid url");
export type URL = z.infer<typeof URLSchema>;

export const InstagramHandleSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._]{0,29}$/).url("Not a valid Instagram handle");
export type InstagramHandle = z.infer<typeof InstagramHandleSchema>;

export const CreateClubInputSchema = z.object({
    name: z.string(),
    publicId: ClubPublicIdSchema,
    tagLine: z.string(),
    description: z.string(),
    websiteURL: URLSchema.optional(),
    instagramHandle: InstagramHandleSchema.optional(),
    eventCalendarURL: URLSchema.optional()
});
export type CreateClubInput = z.infer<typeof CreateClubInputSchema>; 

export const UpdateClubInputSchema = z.object({
    id: z.number(),
    name: z.string(),
    publicId: ClubPublicIdSchema,
    tagLine: z.string(),
    description: z.string(),
    websiteURL: URLSchema.optional(),
    instagramHandle: InstagramHandleSchema.optional(),
    eventCalendarURL: URLSchema.optional()
});
export type UpdateClubInput = z.infer<typeof UpdateClubInputSchema>;

export const UpsertApplicationQuestionsForClubInputSchema = z.object({
    clubId: z.number(),
    applicationQuestions: ApplicationQuestionsSchema
});
export type UpsertApplicationQuestionsForClubInput = z.infer<typeof UpsertApplicationQuestionsForClubInputSchema>;

export const CreateMembershipTierInputSchema = z.object({
    clubId: z.number(),
    name: z.string(),
    benefitDescription: z.string(),
    contributionDescription: z.string(),
    costPerMonthInUSD: USDAmountSchema
});
export type CreateMembershipTierInput = z.infer<typeof CreateMembershipTierInputSchema>;

export const UpdateMembershipTierInputSchema = z.object({
    id: z.number(),
    name: z.string(),
    benefitDescription: z.string(),
    contributionDescription: z.string(),
    costPerMonthInUSD: USDAmountSchema
});
export type UpdateMembershipTierInput = z.infer<typeof UpdateMembershipTierInputSchema>;

export const SubmitMembershipApplicationInputSchema = z.object({
    clubId: z.number(),
    membershipTierId: z.number(),
    applicationResponses: ApplicationResponsesSchema
});
export type SubmitMembershipApplicationInput = z.infer<typeof SubmitMembershipApplicationInputSchema>;

export const ApproveMembershipApplicationInputSchema = z.object({
    membershipId: z.number()
});
export type ApproveMembershipApplicationInput = z.infer<typeof ApproveMembershipApplicationInputSchema>;

export const DeclineMembershipApplicationInputSchema = z.object({
    membershipId: z.number()
});
export type DeclineMembershipApplicationInput = z.infer<typeof DeclineMembershipApplicationInputSchema>;

export const DeactivateMembershipInputSchema = z.object({
    membershipId: z.number()
});
export type DeactivateMembershipInput = z.infer<typeof DeactivateMembershipInputSchema>;

export type MutationResult = {
    createdEntityId: Maybe<Id>;
};

export const NO_ID_MUTATION_RESULT = {
    createdEntityId: null
};