import {MembershipStatus, Prisma, type PrismaClient} from "@prisma/client";
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
    Membership,
    MembershipTier,
    MutationResult,
    NO_ID_MUTATION_RESULT,
    SubmitMembershipApplicationInput,
    UpdateClubApplicationQuestionsInput,
    UpdateClubInput,
    UpdateMembershipTierInput,
    UpdateUserInput,
    URLSchema,
    User
} from "~/server/service/types";
import {parseAsZodType, parseNullableAsZodType} from "~/utils/zod";
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

    function getUser(id: number): Promise<User> {
        try {
            const user = prisma.user.findUniqueOrThrow({
                select: USER_SELECT,
                where: {
                    id: id
                }
            });
            logger.info(
                `queried user with id ${id} with result ${stringify(user)}`
            );
            return user;
        } catch (e) {
            logger.error(
                `failed to query user with id ${id} with exception ${stringify(e)}`
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
            websiteURL: parseNullableAsZodType(r.websiteURL, URLSchema),
            instagramHandle: parseNullableAsZodType(r.instagramHandle, InstagramHandleSchema),
            eventCalendarURL: parseNullableAsZodType(r.eventCalendarURL, URLSchema),
            applicationQuestions: parseAsZodType(r.applicationQuestions, ApplicationQuestionsSchema),
            membershipTiers: r.membershipTiers.map(t => asMembershipTier(t))
        }
    }

    async function getUserOwnedClubs(userId: number): Promise<Club[]> {
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
            applicationResponses: parseAsZodType(r.applicationResponses, ApplicationResponsesSchema),
            joinedAt: r.createdAt
        }
    }

    async function getUserMemberships(userId: number): Promise<Membership[]> {
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

    async function getClubByPublicId(publicId: string): Promise<Club> {
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

    async function getClub(id: number): Promise<Club> {
        try {
            const result = await prisma.club.findUniqueOrThrow({
                select: CLUB_SELECT,
                where: { id }
            });
            const club = asClub(result);
            logger.info(
                `queried club with id ${id} with result ${stringify(club)}`
            );
            return club;
        } catch (e) {
            logger.error(
                `failed to query club with id ${id} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function getMembershipsForClub(clubId: number): Promise<Membership[]> {
        try {
            const results = await prisma.membership.findMany({
                select: MEMBERSHIP_SELECT,
                where: {
                    membershipTier: {
                        clubId: clubId
                    },
                    status: 'ACTIVE'
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

    async function getMembershipApplicationsForClub(
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

    async function getClubStatistics(clubId: number): Promise<ClubStatistics> {
        try {
            const memberCount = await prisma.membership.count({
                where: {
                    membershipTier: {
                        clubId: clubId
                    },
                    status: 'ACTIVE'
                }
            });
            const pendingMembershipApplications = await prisma.membership.count({
                where: {
                    membershipTier: {
                        clubId: clubId
                    },
                    status: 'PENDING'
                }
            });
            const statistics = {
                // plus the owner
                memberCount: memberCount + 1,
                pendingMembershipApplications
            };
            logger.info(
                `queried club statistics for club with clubId ${clubId} with result ${stringify(statistics)}`
            );
            return statistics;
        } catch (e) {
            logger.error(
                `failed to query club statistics for club with clubId ${clubId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function createUser(input: CreateUserInput): Promise<MutationResult> {
        try {
            const { id } = await prisma.user.create({
                data: input,
                select: {
                    id: true
                }
            });
            logger.info(
                `created user from input ${stringify(input)} with userId ${id}`
            );
            return { createdEntityId: id };
        } catch (e) {
            logger.error(
                `failed to create user from input ${stringify(input)} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function updateUser(id: number, input: UpdateUserInput): Promise<MutationResult> {
        try {
            await prisma.user.update({
                data: input,
                where: {
                    id: id
                }
            });
            logger.info(
                `updated user with id ${id} from input ${stringify(input)}`
            );
            return NO_ID_MUTATION_RESULT;
        } catch (e) {
            logger.error(
                `failed to update user with id ${id} from input ${stringify(input)} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function createClub(input: CreateClubInput, userId: number): Promise<MutationResult> {
        try {
            const { id } = await prisma.club.create({
                data: {
                    ...input,
                    ownerUserId: userId,
                    // default empty
                    applicationQuestions: {}
                },
                select: {
                    id: true
                }
            });
            logger.info(
                `created club from input ${stringify(input)} with clubId ${id}`
            );
            return { createdEntityId: id };
        } catch (e) {
            logger.error(
                `failed to create club from input ${stringify(input)} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function updateClub(id: number, input: UpdateClubInput): Promise<MutationResult> {
        try {
            await prisma.club.update({
                data: input,
                where: {
                    id: id
                }
            });
            logger.info(
                `updated club with id ${id} from input ${stringify(input)}`
            );
            return NO_ID_MUTATION_RESULT;
        } catch (e) {
            logger.error(
                `failed to update club with id ${id} from input ${stringify(input)} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function updateClubApplicationQuestions(
        clubId: number,
        input: UpdateClubApplicationQuestionsInput
    ): Promise<MutationResult> {
        try {
            await prisma.club.update({
                data: input,
                where: {
                    id: clubId
                }
            });
            logger.info(
                `updated club application questions for club with clubId ${clubId} from input ${stringify(input)}`
            );
            return NO_ID_MUTATION_RESULT;
        } catch (e) {
            logger.error(
                `failed to update club application questions for club with clubId ${clubId} from input ${stringify(input)} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function createMembershipTier(
        clubId: number,
        input: CreateMembershipTierInput
    ): Promise<MutationResult> {
        try {
            const { id } = await prisma.membershipTier.create({
                data: {
                    clubId: clubId,
                    ...input
                },
                select: {
                    id: true
                }
            });
            logger.info(
                `created membership tier from input ${stringify(input)} with membershipTierId ${id}`
            );
            return { createdEntityId: id };
        } catch (e) {
            logger.error(
                `failed to create membership tier from input ${stringify(input)} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function updateMembershipTier(
        id: number,
        input: UpdateMembershipTierInput
    ): Promise<MutationResult> {
        try {
            await prisma.membershipTier.update({
                data: input,
                where: {
                    id: id
                }
            });
            logger.info(
                `updated membership tier with id ${id} from input ${stringify(input)}`
            );
            return NO_ID_MUTATION_RESULT;
        } catch (e) {
            logger.error(
                `failed to update membership tier with id ${id} from input ${stringify(input)} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function getOwnerUserId(clubId: number): Promise<number> {
        try {
            const club = await prisma.club.findUniqueOrThrow({
                where: { id: clubId },
                select: { ownerUserId: true }
            });
            logger.info(
                `queried owner userId for club with clubId ${clubId} with result ${club.ownerUserId}`
            );
            return club.ownerUserId;
        } catch (e) {
            logger.error(
                `failed to query owner userId for club with clubId ${clubId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function submitMembershipApplication(
        input: SubmitMembershipApplicationInput,
        userId: number
    ): Promise<MutationResult> {
        const ownerUserId = await getOwnerUserId(input.clubId);
        if (ownerUserId === userId) {
            throw new Error(`Cannot submit membership application for club owner with userId ${userId} of clubId ${input.clubId}`);
        }
        
        try {
            const { id } = await prisma.membership.create({
                data: {
                    id: input.clubId,
                    userId: userId,
                    membershipTierId: input.membershipTierId,
                    applicationResponses: input.applicationResponses,
                    status: 'PENDING'
                },
                select: {
                    id: true
                }
            });
            logger.info(
                `created pending membership from input ${stringify(input)} with membershipId ${id}`
            );
            return { createdEntityId: id };
        } catch (e) {
            logger.error(
                `failed to create pending membership from input ${stringify(input)} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function membershipStatus(membershipId: number): Promise<MembershipStatus> {
        try {
            const membership = await prisma.membership.findUniqueOrThrow({
                where: { id: membershipId }
            });
            logger.info(
                `queried membership status for membership with id ${membershipId} with result ${stringify(membership.status)}`
            );
            return membership.status;
        } catch (e) {
            logger.error(
                `failed to query membership status for membership with id ${membershipId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function checkMembershipStatus(membershipId: number, expectedStatus: MembershipStatus): Promise<void> {
        const status = await membershipStatus(membershipId);
        if (status !== expectedStatus) {
            throw new Error(`Membership with id ${membershipId} was expected to be ${expectedStatus} but was ${status}`);
        }    
    }

    async function approveMembershipApplication(
        input: ApproveMembershipApplicationInput
    ): Promise<MutationResult> {
        try {
            await checkMembershipStatus(input.membershipId, 'PENDING');
            await prisma.membership.update({
                data: { status: 'ACTIVE' },
                where: { id: input.membershipId }
            });
            logger.info(
                `approved membership with id ${input.membershipId}`
            );
            return NO_ID_MUTATION_RESULT;
        } catch (e) {
            logger.error(
                `failed to approve membership with id ${input.membershipId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function declineMembershipApplication(
        input: DeclineMembershipApplicationInput
    ): Promise<MutationResult> {
        try {
            await checkMembershipStatus(input.membershipId, 'PENDING');
            await prisma.membership.update({
                data: { status: 'DECLINED' },
                where: { id: input.membershipId }
            });     
            logger.info(
                `declined membership with id ${input.membershipId}`
            );
            return NO_ID_MUTATION_RESULT;
        } catch (e) {
            logger.error(
                `failed to decline membership with id ${input.membershipId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    async function deactivateMembership(
        input: DeactivateMembershipInput
    ): Promise<MutationResult> {
        try {
            await checkMembershipStatus(input.membershipId, 'ACTIVE');
            await prisma.membership.update({
                data: { status: 'INACTIVE' },
                where: { id: input.membershipId }
            });     
            logger.info(
                `deactivated membership with id ${input.membershipId}`
            );
            return NO_ID_MUTATION_RESULT;
        } catch (e) {
            logger.error(
                `failed to deactivate membership with id ${input.membershipId} with exception ${stringify(e)}`
            );
            throw e;
        }
    }

    return {
        getUser,
        getUserOwnedClubs,
        getUserMemberships,
        getClubByPublicId,
        getClub,
        getMembershipsForClub,
        getMembershipApplicationsForClub,
        getClubStatistics,
        createUser,
        updateUser,
        createClub,
        updateClub,
        updateClubApplicationQuestions,
        createMembershipTier,
        updateMembershipTier,
        submitMembershipApplication,
        approveMembershipApplication,
        declineMembershipApplication,
        deactivateMembership
    };
}
