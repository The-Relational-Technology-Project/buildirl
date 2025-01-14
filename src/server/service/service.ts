import { type PrismaClient } from "@prisma/client";
import {rootLogger} from "~/logger";
import {
    ApproveMembershipApplicationInput,
    Club,
    ClubStatistics,
    CreateClubInput,
    CreateMembershipTierInput,
    CreateUserInput, DeactivateMembershipInput, DeclineMembershipApplicationInput,
    MainService,
    Membership,
    MutationResult,
    SubmitMembershipApplicationInput,
    UpdateClubInput,
    UpdateMembershipTierInput,
    UpdateUserInput,
    UpsertApplicationQuestionsForClubInput,
    User
} from "~/server/service/types";
import {stringify} from "~/utils";

const logger = rootLogger.child({ module: "mainService" });

export function createMainService(
  prisma: PrismaClient
): MainService {
    const USER_SELECT = {
        id: true,
        firstName: true,
        lastName: true,
        description: true
    };

    async function user(id: number): Promise<User> {
        try {
            const user = prisma.user.findUniqueOrThrow({
                select: USER_SELECT,
                where: {
                    id: id
                }
            });
            logger.info(
                `queried user with userId ${id} with result ${stringify(user)}`
            );
            return user;
        } catch (e) {
            logger.error(
                `failed to query user with userId ${id} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function userOwnedClubs(userId: number): Promise<Club[]> {
        throw new Error("Not implemented");
    }

    async function userMemberships(userId: number): Promise<Membership[]> {
        throw new Error("Not implemented");
    };

    async function club(publicId: string): Promise<Club> {
        throw new Error("Not implemented");
    };

    async function membershipsForClub(clubId: number): Promise<Membership[]> {
        throw new Error("Not implemented");
    };

    async function membershipApplicationsForClub(clubId: number): Promise<Membership[]> {
        throw new Error("Not implemented");
    };

    async function clubStatistics(clubId: number): Promise<ClubStatistics> {
        throw new Error("Not implemented");
    };

    async function createUser(input: CreateUserInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function updateUser(input: UpdateUserInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    };

    async function createClub(input: CreateClubInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    };

    async function updateClub(input: UpdateClubInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    };

    async function upsertApplicationQuestionsForClub(input: UpsertApplicationQuestionsForClubInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    };

    async function createMembershipTier(input: CreateMembershipTierInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    };

    async function updateMembershipTier(input: UpdateMembershipTierInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    };

    async function submitMembershipApplication(input: SubmitMembershipApplicationInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    };

    async function approveMembershipApplication(input: ApproveMembershipApplicationInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    };

    async function declineMembershipApplication(input: DeclineMembershipApplicationInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    };

    async function deactivateMembership(input: DeactivateMembershipInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    };

    return {
        user,
        userOwnedClubs,
        userMemberships,
        club,
        membershipsForClub,
        membershipApplicationsForClub,
        clubStatistics,
        createUser,
        updateUser,
        createClub,
        updateClub,
        upsertApplicationQuestionsForClub,
        createMembershipTier,
        updateMembershipTier,
        submitMembershipApplication,
        approveMembershipApplication,
        declineMembershipApplication,
        deactivateMembership
    }
}
