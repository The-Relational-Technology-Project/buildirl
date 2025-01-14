import {Prisma, type PrismaClient} from "@prisma/client";
import {rootLogger} from "~/logger";
import {
    ApplicationQuestionsSchema,
    ApplicationResponsesSchema,
    ApproveMembershipApplicationInput,
    Club,
    ClubStatistics,
    CreateClubInput,
    CreateMembershipTierInput,
    CreateUserInput,
    DeactivateMembershipInput,
    DeclineMembershipApplicationInput,
    InstagramHandleSchema,
    MainService,
    Membership, MembershipStatus, MembershipTier,
    MutationResult,
    SubmitMembershipApplicationInput,
    UpdateClubInput,
    UpdateMembershipTierInput,
    UpdateUserInput,
    UpsertApplicationQuestionsForClubInput,
    URLSchema,
    User
} from "~/server/service/types";
import {parseJsonValue, parseNullableString} from "~/utils/zod";
import {stringify} from "~/utils";
import MembershipTierGetPayload = Prisma.MembershipTierGetPayload;
import ClubGetPayload = Prisma.ClubGetPayload;
import MembershipGetPayload = Prisma.MembershipGetPayload;

const logger = rootLogger.child({module: "mainService"});

export function createMainService(prisma: PrismaClient): MainService {
    const USER_SELECT = {
        id: true,
        firstName: true,
        lastName: true,
        description: true
    };

    const MEMBERSHIP_TIER_SELECT = {
        id: true,
        name: true,
        benefitDescription: true,
        contributionDescription: true,
        costPerMonthInUSD: true
    };

    const CLUB_SELECT = {
        id: true,
        publicId: true,
        name: true,
        tagLine: true,
        description: true,
        owner: {
            select: USER_SELECT
        },
        websiteURL: true,
        instagramHandle: true,
        eventCalendarURL: true,
        applicationQuestions: true,
        membershipTiers: {
            select: MEMBERSHIP_TIER_SELECT
        }
    };

    const MEMBERSHIP_SELECT = {
        id: true,
        user: {select: USER_SELECT},
        membershipTier: {
            select: {
                ...MEMBERSHIP_TIER_SELECT,
                // we want to include this in
                // Membership metadata
                club: {
                    select: CLUB_SELECT
                }
            }
        },
        status: true,
        applicationResponses: true,
        createdAt: true
    };

    function user(id: number): Promise<User> {
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

    function asMembershipTier(r: MembershipTierGetPayload<{ select: typeof MEMBERSHIP_TIER_SELECT }>): MembershipTier {
        return {
            id: r.id,
            name: r.name,
            benefitDescription: r.benefitDescription,
            contributionDescription: r.contributionDescription,
            // possible loss of precision here, but it doesn't matter for us
            costPerMonthInUSD: r.costPerMonthInUSD.toNumber()
        }
    }

    function asClub(r: ClubGetPayload<{ select: typeof CLUB_SELECT }>): Club {
        return {
            id: r.id,
            publicId: r.publicId,
            name: r.name,
            tagLine: r.tagLine,
            description: r.description,
            owner: r.owner,
            websiteURL: parseNullableString(r.websiteURL, URLSchema),
            instagramHandle: parseNullableString(r.instagramHandle, InstagramHandleSchema),
            eventCalendarURL: parseNullableString(r.eventCalendarURL, URLSchema),
            applicationQuestions: parseJsonValue(r.applicationQuestions, ApplicationQuestionsSchema),
            membershipTiers: r.membershipTiers.map(t => asMembershipTier(t))
        }
    }

    async function userOwnedClubs(userId: number): Promise<Club[]> {
        try {
            const results = await prisma.club.findMany({
                select: CLUB_SELECT,
                where: {
                    ownerUserId: userId
                }
            });
            const clubs = results.map((r) => asClub(r));
            logger.info(
                `queried owned clubs for user with userId ${userId} with result ${stringify(clubs)}`
            );
            return clubs;
        } catch (e) {
            logger.error(
                `failed to query owned clubs for user with userId ${userId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    function asMembership(r: MembershipGetPayload<{ select: typeof MEMBERSHIP_SELECT }>): Membership {
        return {
            id: r.id,
            user: r.user,
            club: asClub(r.membershipTier.club),
            membershipTier: asMembershipTier(r.membershipTier),
            status: r.status,
            applicationResponses: parseJsonValue(r.applicationResponses, ApplicationResponsesSchema),
            joinedAt: r.createdAt
        }
    }

    async function userMemberships(userId: number): Promise<Membership[]> {
        try {
            const results = await prisma.membership.findMany({
                select: MEMBERSHIP_SELECT,
                where: {
                    userId: userId
                }
            });
            const memberships = results.map(r => asMembership(r));
            logger.info(
                `queried memberships for user with userId ${userId} with result ${stringify(memberships)}`
            );
            return memberships;
        } catch (e) {
            logger.error(
                `failed to query memberships for user with userId ${userId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function club(publicId: string): Promise<Club> {
        try {
            const result = await prisma.club.findUniqueOrThrow({
                select: CLUB_SELECT,
                where: {
                    publicId: publicId
                }
            });
            const club = asClub(result);
            logger.info(
                `queried club with publicId ${publicId} with result ${stringify(club)}`
            );
            return club;
        } catch (e) {
            logger.error(
                `failed to query club with publicId ${publicId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function membershipsForClub(clubId: number): Promise<Membership[]> {
        try {
            const results = await prisma.membership.findMany({
                select: MEMBERSHIP_SELECT,
                where: {
                    membershipTier: {
                        clubId: clubId
                    }
                }
            })
            const memberships = results.map(r => asMembership(r));
            logger.info(
                `queried memberships for club with clubId ${clubId} with result ${stringify(memberships)}`
            );
            return memberships;
        } catch (e) {
            logger.error(
                `failed to query memberships for club with clubId ${clubId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function membershipApplicationsForClub(
        clubId: number
    ): Promise<Membership[]> {
        try {
            const results = await prisma.membership.findMany({
                select: MEMBERSHIP_SELECT,
                where: {
                    membershipTier: {
                        clubId: clubId
                    },
                    status: 'PENDING'
                }
            });
            const memberships = results.map(r => asMembership(r));
            logger.info(
                `queried pending memberships for club with clubId ${clubId} with result ${stringify(memberships)}`
            );
            return memberships;
        } catch (e) {
            logger.error(
                `failed to query pending memberships for club with clubId ${clubId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function clubStatistics(clubId: number): Promise<ClubStatistics> {
        throw new Error("Not implemented");
    }

    async function createUser(input: CreateUserInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function updateUser(input: UpdateUserInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function createClub(input: CreateClubInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function updateClub(input: UpdateClubInput): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function upsertApplicationQuestionsForClub(
        input: UpsertApplicationQuestionsForClubInput
    ): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function createMembershipTier(
        input: CreateMembershipTierInput
    ): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function updateMembershipTier(
        input: UpdateMembershipTierInput
    ): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function submitMembershipApplication(
        input: SubmitMembershipApplicationInput
    ): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function approveMembershipApplication(
        input: ApproveMembershipApplicationInput
    ): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function declineMembershipApplication(
        input: DeclineMembershipApplicationInput
    ): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

    async function deactivateMembership(
        input: DeactivateMembershipInput
    ): Promise<MutationResult> {
        throw new Error("Not implemented");
    }

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
    };
}
