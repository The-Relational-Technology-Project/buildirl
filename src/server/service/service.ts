import { MembershipStatus, Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import {
  ApplicationQuestionsSchema,
  ApplicationResponsesSchema,
  Club,
  ClubStatistics,
  CreateClubInput,
  CreateMembershipTierInput,
  CreateUserInput,
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
import { parseAsZodType, parseNullableAsZodType } from "~/utils/zod";
import { stringify } from "~/utils";
import MembershipTierGetPayload = Prisma.MembershipTierGetPayload;
import ClubGetPayload = Prisma.ClubGetPayload;
import MembershipGetPayload = Prisma.MembershipGetPayload;

const logger = rootLogger.child({ module: "mainService" });

export function createMainService(prisma: PrismaClient): MainService {
  const USER_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    description: true,
    createdAt: true
  };

  const MEMBERSHIP_TIER_SELECT = {
    id: true,
    name: true,
    status: true,
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
    user: { select: USER_SELECT },
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
      logger.error(
        `failed to query user with id ${id} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  function asMembershipTier(
    r: MembershipTierGetPayload<{ select: typeof MEMBERSHIP_TIER_SELECT }>
  ): MembershipTier {
    return {
      id: r.id,
      name: r.name,
      status: r.status,
      benefitDescription: r.benefitDescription,
      contributionDescription: r.contributionDescription,
      // possible loss of precision here, but it doesn't matter for us
      costPerMonthInUSD: r.costPerMonthInUSD.toNumber()
    };
  }

  function orderedByCost(membershipTiers: MembershipTier[]): MembershipTier[] {
    return (
      membershipTiers
        // if equal cost, sort by id
        .sort((a, b) => a.id - b.id)
        .sort((a, b) => a.costPerMonthInUSD - b.costPerMonthInUSD)
    );
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
      instagramHandle: parseNullableAsZodType(
        r.instagramHandle,
        InstagramHandleSchema
      ),
      eventCalendarURL: parseNullableAsZodType(r.eventCalendarURL, URLSchema),
      applicationQuestions: parseAsZodType(
        r.applicationQuestions,
        ApplicationQuestionsSchema
      ),
      membershipTiers: orderedByCost(
        r.membershipTiers.map((t) => asMembershipTier(t))
      )
    };
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

  function asMembership(
    r: MembershipGetPayload<{ select: typeof MEMBERSHIP_SELECT }>
  ): Membership {
    return {
      id: r.id,
      user: r.user,
      club: asClub(r.membershipTier.club),
      membershipTier: asMembershipTier(r.membershipTier),
      status: r.status,
      applicationResponses: parseAsZodType(
        r.applicationResponses,
        ApplicationResponsesSchema
      ),
      createdAt: r.createdAt
    };
  }

  async function getUserMemberships(userId: number): Promise<Membership[]> {
    try {
      const results = await prisma.membership.findMany({
        select: MEMBERSHIP_SELECT,
        where: {
          userId: userId
        }
      });
      const memberships = results.map((r) => asMembership(r));
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
      logger.info(`queried club with id ${id} with result ${stringify(club)}`);
      return club;
    } catch (e) {
      logger.error(
        `failed to query club with id ${id} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function getActiveMembershipsForClub(
    clubId: number
  ): Promise<Membership[]> {
    try {
      const results = await prisma.membership.findMany({
        select: MEMBERSHIP_SELECT,
        where: {
          membershipTier: {
            clubId: clubId
          },
          status: "ACTIVE"
        }
      });
      const memberships = results.map((r) => asMembership(r));
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
          status: "PENDING"
        }
      });
      const memberships = results.map((r) => asMembership(r));
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
          status: "ACTIVE"
        }
      });
      const pendingMembershipApplications = await prisma.membership.count({
        where: {
          membershipTier: {
            clubId: clubId
          },
          status: "PENDING"
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

  async function createUser(
    input: CreateUserInput,
    authUserId: string
  ): Promise<MutationResult> {
    try {
      const { id } = await prisma.user.create({
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
      return { createdEntityId: id };
    } catch (e) {
      logger.error(
        `failed to create user from input ${stringify(input)} with exception ${stringify(e)}`
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
        `failed to update user with id ${id} from input ${stringify(input)} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function createClub(
    input: CreateClubInput,
    userId: number
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createClubInTransaction(input, userId, tx);
    });
  }

  async function createClubInTransaction(
    input: CreateClubInput,
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.club.create({
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

      // create the default free tier on each club
      await createDefaultFreeMembershipTier(id, tx);

      return { createdEntityId: id };
    } catch (e) {
      logger.error(
        `failed to create club from input ${stringify(input)} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function updateClub(
    id: number,
    input: UpdateClubInput
  ): Promise<MutationResult> {
    try {
      await prisma.club.update({
        data: input,
        where: {
          id: id
        }
      });
      logger.info(`updated club with id ${id} from input ${stringify(input)}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        `failed to update club with id ${id} from input ${stringify(input)} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function hasAnyMemberships(clubId: number) {
    try {
      const memberCount = await prisma.membership.count({
        where: {
          membershipTier: {
            clubId: clubId
          }
        }
      });
      logger.info(
        `queried all membership count for club with clubId ${clubId} with result ${memberCount}`
      );
      return memberCount > 0;
    } catch (e) {
      logger.error(
        `failed to query all membership count for club with clubId ${clubId} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function deleteClub(id: number): Promise<MutationResult> {
    if (await hasAnyMemberships(id)) {
      throw new Error("cannot delete club if it has any memberships");
    }

    try {
      await prisma.club.delete({
        where: { id }
      });
      logger.info(`deleted club with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        `failed to delete club with id ${id} with exception ${stringify(e)}`
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

  async function createMembershipTierInTransaction(
    clubId: number,
    input: CreateMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.membershipTier.create({
        data: {
          clubId: clubId,
          // default
          status: "PUBLISHED",
          ...input
        },
        select: {
          id: true
        }
      });
      logger.info(
        `created membership tier from input ${stringify(input)} with id ${id}`
      );
      return { createdEntityId: id };
    } catch (e) {
      logger.error(
        `failed to create membership tier from input ${stringify(input)} with exception ${stringify(e)}`
      );
      throw e;
    }
  }
  async function createMembershipTier(
    clubId: number,
    input: CreateMembershipTierInput
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createMembershipTierInTransaction(clubId, input, tx);
    });
  }

  async function createDefaultFreeMembershipTier(
    clubId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    return createMembershipTierInTransaction(
      clubId,
      {
        name: "Free",
        benefitDescription: "",
        contributionDescription: "",
        costPerMonthInUSD: 0
      },
      tx
    );
  }

  async function hasMembersOnMembershipTier(membershipTierId: number) {
    try {
      const count = await prisma.membership.count({
        where: { membershipTierId: membershipTierId }
      });
      logger.info(
        `queried membership count ${count} for membership tier with id ${membershipTierId}`
      );
      return count > 0;
    } catch (e) {
      logger.error(
        `failed to query membership count for membership tier with id ${membershipTierId} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function checkNoMembersOnMembershipTier(
    membershipTierId: number
  ): Promise<void> {
    if (await hasMembersOnMembershipTier(membershipTierId)) {
      throw new Error(
        "cannot update membership tier if there are existing members subscribed  to it"
      );
    }
  }

  async function isDefaultFreeMembershipTier(membershipTierId: number) {
    try {
      const result = await prisma.membershipTier.findUniqueOrThrow({
        where: { id: membershipTierId },
        select: { costPerMonthInUSD: true }
      });
      logger.info(
        `checked if membership tier with id ${membershipTierId} is free tier with result ${result.costPerMonthInUSD.toNumber() === 0}`
      );
      // this is definition of free tier, manually created tiers cannot be 0 cost
      return result.costPerMonthInUSD.toNumber() === 0;
    } catch (e) {
      logger.error(
        `failed to check if membership tier with id ${membershipTierId} is free tier with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function checkIsNotDefaultFreeMembershipTier(membershipTierId: number) {
    if (await isDefaultFreeMembershipTier(membershipTierId)) {
      throw new Error("cannot delete default free membership tier");
    }
  }

  async function checkIsNotDefaultFreeMembershipTierAndUpdatingCost(
    membershipTierId: number,
    input: UpdateMembershipTierInput
  ) {
    if (
      (await isDefaultFreeMembershipTier(membershipTierId)) &&
      input.costPerMonthInUSD !== 0
    ) {
      throw new Error(
        "cannot update cost of default free membership tier to non-zero value"
      );
    }
  }

  async function checkIsNotUpdatingMembershipTierToZeroCost(
    membershipTierId: number,
    input: UpdateMembershipTierInput
  ) {
    if (
      !(await isDefaultFreeMembershipTier(membershipTierId)) &&
      input.costPerMonthInUSD === 0
    ) {
      throw new Error("cannot update cost of membership tier to zero value");
    }
  }

  async function updateMembershipTier(
    id: number,
    input: UpdateMembershipTierInput
  ): Promise<MutationResult> {
    await checkNoMembersOnMembershipTier(id);
    await checkIsNotDefaultFreeMembershipTierAndUpdatingCost(id, input);
    await checkIsNotUpdatingMembershipTierToZeroCost(id, input);
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

  async function deleteMembershipTier(id: number): Promise<MutationResult> {
    await checkNoMembersOnMembershipTier(id);
    await checkIsNotDefaultFreeMembershipTier(id);
    try {
      await prisma.membershipTier.delete({
        where: {
          id: id
        }
      });
      logger.info(`deleted membership tier with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        `failed to delete membership tier with id ${id} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function isPublished(membershipTierId: number) {
    try {
      const r = await prisma.membershipTier.findUniqueOrThrow({
        select: {
          status: true
        },
        where: {
          id: membershipTierId
        }
      });
      logger.info(
        `queried status ${r.status} for membership tier with id ${membershipTierId}`
      );
      return r.status === "PUBLISHED";
    } catch (e) {
      logger.error(
        `failed to query status for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function publishMembershipTier(id: number): Promise<MutationResult> {
    if (await isPublished(id)) {
      throw new Error("Cannot publish an already published membership tier.");
    }
    try {
      await prisma.membershipTier.update({
        data: { status: "PUBLISHED" },
        where: {
          id: id
        }
      });
      logger.info(`published membership tier with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        `failed to publish membership tier with id ${id} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function unpublishMembershipTier(id: number): Promise<MutationResult> {
    if (!(await isPublished(id))) {
      throw new Error(
        "cannot unpublish an already unpublished membership tier"
      );
    }
    try {
      await prisma.membershipTier.update({
        data: { status: "UNPUBLISHED" },
        where: {
          id: id
        }
      });
      logger.info(`unpublished membership tier with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        `failed to unpublish membership tier with id ${id} with exception ${stringify(e)}`
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

  async function getClubIdFromMembershipTierId(
    membershipTierId: number
  ): Promise<number> {
    try {
      const membershipTier = await prisma.membershipTier.findUniqueOrThrow({
        where: { id: membershipTierId },
        select: { clubId: true }
      });
      logger.info(
        `queried clubId for membership tier with membershipTierId ${membershipTierId} with result ${membershipTier.clubId}`
      );
      return membershipTier.clubId;
    } catch (e) {
      logger.error(
        `failed to query clubId for membership tier with membershipTierId ${membershipTierId} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function checkUserIsNotClubOwner(userId: number, clubId: number) {
    const ownerUserId = await getOwnerUserId(clubId);
    if (ownerUserId === userId) {
      throw new Error(
        `Cannot submit membership application for club owner with userId ${userId} of clubId ${clubId}`
      );
    }
  }

  async function checkUserDoesNotHaveMembershipForClub(
    userId: number,
    clubId: number
  ) {
    const memberships = await getUserMemberships(userId);
    const membershipsForClub = memberships.filter((m) => m.club.id === clubId);
    if (membershipsForClub.length > 0) {
      throw new Error(
        `User with userId ${userId} already has a membership for club with clubId ${clubId}, ${membershipsForClub[0]!}`
      );
    }
  }

  async function submitMembershipApplication(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number
  ): Promise<MutationResult> {
    const clubId = await getClubIdFromMembershipTierId(membershipTierId);
    await checkUserIsNotClubOwner(userId, clubId);
    await checkUserDoesNotHaveMembershipForClub(userId, clubId);
    try {
      const { id } = await prisma.membership.create({
        data: {
          userId: userId,
          membershipTierId: membershipTierId,
          applicationResponses: input.applicationResponses,
          status: "PENDING"
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

  async function membershipStatus(
    membershipId: bigint
  ): Promise<MembershipStatus> {
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

  async function checkMembershipStatus(
    membershipId: bigint,
    expectedStatus: MembershipStatus
  ): Promise<void> {
    const status = await membershipStatus(membershipId);
    if (status !== expectedStatus) {
      throw new Error(
        `Membership with id ${membershipId} was expected to be ${expectedStatus} but was ${status}`
      );
    }
  }

  async function approveMembershipApplication(
    membershipId: bigint
  ): Promise<MutationResult> {
    try {
      await checkMembershipStatus(membershipId, "PENDING");
      await prisma.membership.update({
        data: { status: "ACTIVE" },
        where: { id: membershipId }
      });
      logger.info(`approved membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        `failed to approve membership with id ${membershipId} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function declineMembershipApplication(
    membershipId: bigint
  ): Promise<MutationResult> {
    try {
      await checkMembershipStatus(membershipId, "PENDING");
      await prisma.membership.update({
        data: { status: "DECLINED" },
        where: { id: membershipId }
      });
      logger.info(`declined membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        `failed to decline membership with id ${membershipId} with exception ${stringify(e)}`
      );
      throw e;
    }
  }

  async function deactivateMembership(
    membershipId: bigint
  ): Promise<MutationResult> {
    try {
      await checkMembershipStatus(membershipId, "ACTIVE");
      await prisma.membership.update({
        data: { status: "INACTIVE" },
        where: { id: membershipId }
      });
      logger.info(`deactivated membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        `failed to deactivate membership with id ${membershipId} with exception ${stringify(e)}`
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
    getActiveMembershipsForClub,
    getMembershipApplicationsForClub,
    getClubStatistics,
    createUser,
    updateUser,
    createClub,
    updateClub,
    deleteClub,
    updateClubApplicationQuestions,
    createMembershipTier,
    updateMembershipTier,
    deleteMembershipTier,
    publishMembershipTier,
    unpublishMembershipTier,
    submitMembershipApplication,
    approveMembershipApplication,
    declineMembershipApplication,
    deactivateMembership
  };
}
