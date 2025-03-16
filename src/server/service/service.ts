import { Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import {
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
  UrlSchema,
  User,
  MembershipStatus,
  Email,
  UpdateClubDisplayImageUrlsInput
} from "~/server/service/types";
import {
  FormQuestionsSchema,
  FormResponsesSchema,
  FormQuestionType
} from "~/server/service/types/form";
import { parseAsZodType } from "~/utils/zod";
import { stringify } from "~/utils";
import MembershipTierGetPayload = Prisma.MembershipTierGetPayload;
import ClubGetPayload = Prisma.ClubGetPayload;
import MembershipGetPayload = Prisma.MembershipGetPayload;
import { Maybe } from "~/utils/types";
import { TemplateThemeSchema } from "~/client/theme/templates";
import { z } from "zod";
import { StripeClient } from "~/server/payments/stripe/types";

const logger = rootLogger.child({ module: "mainService" });

export function createMainService(
  prisma: PrismaClient,
  stripeClient: StripeClient
): MainService {
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
    websiteUrl: true,
    instagramHandle: true,
    eventCalendarUrl: true,
    applicationQuestions: true,
    theme: true,
    displayImageUrls: true,
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
    isWelcomed: true,
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
      logger.error(e, `failed to query user with id ${id}`);
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
      websiteUrl: parseAsZodType(r.websiteUrl, UrlSchema.nullable()),
      instagramHandle: parseAsZodType(
        r.instagramHandle,
        InstagramHandleSchema.nullable()
      ),
      eventCalendarUrl: parseAsZodType(
        r.eventCalendarUrl,
        UrlSchema.nullable()
      ),
      applicationQuestions: parseAsZodType(
        r.applicationQuestions,
        FormQuestionsSchema
      ),
      theme: parseAsZodType(r.theme, TemplateThemeSchema.nullable()),
      displayImageUrls: parseAsZodType(r.displayImageUrls, z.array(UrlSchema)),
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
        e,
        `failed to query owned clubs for user with userId ${userId}`
      );
      throw e;
    }
  }

  async function asMembership(
    r: MembershipGetPayload<{ select: typeof MEMBERSHIP_SELECT }>,
    includeEmail: boolean = false
  ): Promise<Membership> {
    return {
      id: r.id,
      user: r.user,
      club: asClub(r.membershipTier.club),
      membershipTier: asMembershipTier(r.membershipTier),
      status: r.status,
      applicationResponses: parseAsZodType(
        r.applicationResponses,
        FormResponsesSchema
      ),
      email: includeEmail ? await userEmail(r.user.id) : null,
      isWelcomed: r.isWelcomed,
      createdAt: r.createdAt
    };
  }

  async function userEmail(userId: number): Promise<Maybe<Email>> {
    try {
      const userSettings = await prisma.userSettings.findUniqueOrThrow({
        where: {
          userId: userId
        }
      });
      logger.info(`queried user email for user with id ${userId}`);
      return userSettings.email;
    } catch (e) {
      logger.error(e, `failed to query user email for user with id ${userId}`);
      throw e;
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
      const memberships = await Promise.all(
        results.map((r) => asMembership(r))
      );
      logger.info(
        `queried memberships for user with userId ${userId} with result ${stringify(memberships)}`
      );
      return memberships;
    } catch (e) {
      logger.error(
        e,
        `failed to query memberships for user with userId ${userId}`
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
      logger.error(e, `failed to query club with publicId ${publicId}`);
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
      logger.error(e, `failed to query club with id ${id}`);
      throw e;
    }
  }

  async function getActiveMembershipsForClub(
    clubId: number,
    includeEmail: boolean
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
      const memberships = await Promise.all(
        results.map((r) => asMembership(r, includeEmail))
      );
      logger.info(
        `queried memberships for club with clubId ${clubId} with result ${stringify(memberships)}`
      );
      return memberships;
    } catch (e) {
      logger.error(
        e,
        `failed to query memberships for club with clubId ${clubId}`
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
      const memberships = await Promise.all(
        results.map((r) => asMembership(r, true))
      );
      logger.info(
        `queried pending memberships for club with clubId ${clubId} with result ${stringify(memberships)}`
      );
      return memberships;
    } catch (e) {
      logger.error(
        e,
        `failed to query pending memberships for club with clubId ${clubId}`
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
      const statistics = {
        // plus the owner
        memberCount: memberCount + 1
      };
      logger.info(
        `queried club statistics for club with clubId ${clubId} with result ${stringify(statistics)}`
      );
      return statistics;
    } catch (e) {
      logger.error(
        e,
        `failed to query club statistics for club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function createUser(
    input: CreateUserInput,
    authUserId: string,
    authEmail: Maybe<string>
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createUserInTransaction(input, authUserId, authEmail, tx);
    });
  }

  async function createUserInTransaction(
    input: CreateUserInput,
    authUserId: string,
    authEmail: Maybe<string>,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.user.create({
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

      await createUserSettingInTransaction(id, authEmail, tx);

      return { createdEntityId: id };
    } catch (e) {
      logger.error(e, `failed to create user from input ${stringify(input)}`);
      throw e;
    }
  }

  async function createUserSettingInTransaction(
    userId: number,
    authEmail: Maybe<string>,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    try {
      await tx.userSettings.create({
        data: { userId, email: authEmail }
      });
      logger.info(`created user setting for user with id ${userId}`);
    } catch (e) {
      logger.error(
        e,
        `failed to create user setting for user with id ${userId}`
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
        e,
        `failed to update user with id ${id} from input ${stringify(input)}`
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
          // default questions
          applicationQuestions: {
            questions: [
              {
                question: "What is drawing you most to joining our club? 🤔✨",
                type: FormQuestionType.LONG_TEXT
              },
              {
                question:
                  "If you were hosting an event for the club, what would you dream up? 🎉💭",
                type: FormQuestionType.LONG_TEXT
              },
              {
                question:
                  "Get personal – we'd love to get to know you. What's something sweet, unexpected, delightful, or lovely about you that you'd like to share with us? 💖🌟",
                type: FormQuestionType.LONG_TEXT
              },
              {
                question:
                  "What's your go-to snack when you're in the middle of a Netflix binge?",
                type: FormQuestionType.SINGLE_SELECT,
                metadata: {
                  choices: [
                    "Popcorn all the way! 🍿",
                    "Chips and salsa for life 🌶️",
                    "Chocolate, duh 🍫",
                    "Fruit and yogurt, keeping it fresh 🍓"
                  ]
                }
              }
            ]
          },
          theme: Prisma.DbNull
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
      logger.error(e, `failed to create club from input ${stringify(input)}`);
      throw e;
    }
  }

  async function updateClub(
    id: number,
    input: UpdateClubInput
  ): Promise<MutationResult> {
    try {
      await prisma.club.update({
        data: { ...input, theme: input.theme ?? Prisma.DbNull },
        where: {
          id: id
        }
      });
      logger.info(`updated club with id ${id} from input ${stringify(input)}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update club with id ${id} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function updateClubDisplayImageUrls(
    clubId: number,
    input: UpdateClubDisplayImageUrlsInput
  ): Promise<MutationResult> {
    try {
      await prisma.club.update({
        data: { displayImageUrls: input.displayImageUrls },
        where: { id: clubId }
      });
      logger.info(
        `updated club display image urls for club with clubId ${clubId} from input ${stringify(input)}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update club display image urls for club with clubId ${clubId} from input ${stringify(input)}`
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
        e,
        `failed to query all membership count for club with clubId ${clubId}`
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
      logger.error(e, `failed to delete club with id ${id}`);
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
        e,
        `failed to update club application questions for club with clubId ${clubId} from input ${stringify(input)}`
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
        e,
        `failed to create membership tier from input ${stringify(input)}`
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
      // default tier description
      {
        name: "The Club Crew",
        benefitDescription:
          "Weekly meetups and events, members-only WhatsApp / Slack group, awesome local deals, and a whole lot of " +
          "opportunities to create with fellow members!",
        contributionDescription:
          "We're member-first and member-led. Help us keep the good vibes going by co-hosting, volunteering, or just chipping " +
          "in where you can. Your dues go towards venues, snacks, and more. Your support is what makes this stay alive!",
        costPerMonthInUSD: 0
      },
      tx
    );
  }

  async function hasActiveMembersOnMembershipTier(membershipTierId: number) {
    try {
      const count = await prisma.membership.count({
        where: { membershipTierId: membershipTierId, status: "ACTIVE" }
      });
      logger.info(
        `queried membership count ${count} for membership tier with id ${membershipTierId}`
      );
      return count > 0;
    } catch (e) {
      logger.error(
        e,
        `failed to query membership count for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function checkNoActiveMembersOnMembershipTier(
    membershipTierId: number
  ): Promise<void> {
    if (await hasActiveMembersOnMembershipTier(membershipTierId)) {
      throw new Error(
        "cannot update membership tier if there are existing members subscribed to it"
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
        e,
        `failed to check if membership tier with id ${membershipTierId} is free tier`
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
    await checkNoActiveMembersOnMembershipTier(id);
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
        e,
        `failed to update membership tier with id ${id} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function deleteMembershipTier(id: number): Promise<MutationResult> {
    await checkNoActiveMembersOnMembershipTier(id);
    await checkIsNotDefaultFreeMembershipTier(id);
    if (await isMembershipTierLastPublishedTier(id)) {
      throw new Error("cannot delete last published membership tier");
    }
    try {
      await prisma.membershipTier.delete({
        where: {
          id: id
        }
      });
      logger.info(`deleted membership tier with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to delete membership tier with id ${id}`);
      throw e;
    }
  }

  async function isMembershipTierPublished(membershipTierId: number) {
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
        e,
        `failed to query status for membership tier with id ${membershipTierId}`
      );
      throw e;
    }
  }

  async function publishMembershipTier(id: number): Promise<MutationResult> {
    if (await isMembershipTierPublished(id)) {
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
      logger.error(e, `failed to publish membership tier with id ${id}`);
      throw e;
    }
  }

  async function isMembershipTierLastPublishedTier(membershipTierId: number) {
    try {
      const allPublishedMembershipTiers = await prisma.membershipTier.findMany({
        where: { status: "PUBLISHED" }
      });
      logger.info(
        `queried all published membership tiers with result ${stringify(allPublishedMembershipTiers)}`
      );
      return (
        allPublishedMembershipTiers.length === 1 &&
        allPublishedMembershipTiers[0]!.id === membershipTierId
      );
    } catch (e) {
      logger.error(e, `failed to query all published membership tiers`);
      throw e;
    }
  }

  async function unpublishMembershipTier(id: number): Promise<MutationResult> {
    if (!(await isMembershipTierPublished(id))) {
      throw new Error(
        "cannot unpublish an already unpublished membership tier"
      );
    }
    if (await isMembershipTierLastPublishedTier(id)) {
      throw new Error("cannot unpublish last published membership tier");
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
      logger.error(e, `failed to unpublish membership tier with id ${id}`);
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
        e,
        `failed to query owner userId for club with clubId ${clubId}`
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
        e,
        `failed to query clubId for membership tier with membershipTierId ${membershipTierId}`
      );
      throw e;
    }
  }

  async function checkMembershipTierIsPublished(membershipTierId: number) {
    if (!(await isMembershipTierPublished(membershipTierId))) {
      throw new Error(
        `cannot submit membership application for unpublished membership tier with membershipTierId ${membershipTierId}`
      );
    }
  }

  async function checkUserIsNotClubOwner(userId: number, clubId: number) {
    const ownerUserId = await getOwnerUserId(clubId);
    if (ownerUserId === userId) {
      throw new Error(
        `cannot submit membership application for club owner with userId ${userId} of clubId ${clubId}`
      );
    }
  }

  async function checkUserDoesNotHaveActiveMembershipForClub(
    userId: number,
    clubId: number
  ): Promise<void> {
    const membership = await userMembershipForClub(userId, clubId);
    if (membership !== null && membership.status === "ACTIVE") {
      throw new Error(
        `cannot submit membership application for user with id ${userId} for club with id ${clubId} 
        with an existing active membership ${stringify(membership)}`
      );
    }
  }

  async function userMembershipForClub(
    userId: number,
    clubId: number
  ): Promise<Maybe<Membership>> {
    const memberships = await getUserMemberships(userId);
    const membershipsForClub = memberships.filter((m) => m.club.id === clubId);
    if (membershipsForClub.length === 0) {
      return null;
    }
    if (membershipsForClub.length === 1) {
      return membershipsForClub[0]!;
    }
    throw new Error(
      `did not expect more than 1 membership for user with id ${userId} for club with id ${clubId} 
      but found ${stringify(membershipsForClub)}`
    );
  }

  async function submitMembershipApplication(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number
  ): Promise<MutationResult> {
    if (!input.shareEmail) {
      throw new Error(
        "email sharing required in order to submit membership application"
      );
    }
    await checkMembershipTierIsPublished(membershipTierId);
    const clubId = await getClubIdFromMembershipTierId(membershipTierId);
    await checkUserIsNotClubOwner(userId, clubId);
    await checkUserDoesNotHaveActiveMembershipForClub(userId, clubId);
    const existingMembership = await userMembershipForClub(userId, clubId);
    if (null === existingMembership) {
      return await createMembershipApplication(membershipTierId, input, userId);
    }
    // declined or deactivate membership can reapply with overwrite
    return await updateMembershipWithNewApplication(
      membershipTierId,
      input,
      existingMembership.id
    );
  }

  async function createMembershipApplication(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number
  ): Promise<MutationResult> {
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
        e,
        `failed to create pending membership from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function updateMembershipWithNewApplication(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    membershipId: bigint
  ): Promise<MutationResult> {
    try {
      const { id } = await prisma.membership.update({
        data: {
          membershipTierId: membershipTierId,
          applicationResponses: input.applicationResponses,
          status: "PENDING",
          // reset welcome status
          isWelcomed: false
        },
        where: {
          id: membershipId
        }
      });
      logger.info(
        `updated membership to pending membership from input ${stringify(input)} with membershipId ${id}`
      );
      return { createdEntityId: id };
    } catch (e) {
      logger.error(
        e,
        `failed to update membership to pending membership from input ${stringify(input)}`
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
        e,
        `failed to query membership status for membership with id ${membershipId}`
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
    await checkMembershipStatus(membershipId, "PENDING");
    try {
      await prisma.membership.update({
        data: { status: "ACTIVE" },
        where: { id: membershipId }
      });
      logger.info(`approved membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to approve membership with id ${membershipId}`);
      throw e;
    }
  }

  async function declineMembershipApplication(
    membershipId: bigint
  ): Promise<MutationResult> {
    await checkMembershipStatus(membershipId, "PENDING");
    try {
      await prisma.membership.update({
        data: { status: "DECLINED" },
        where: { id: membershipId }
      });
      logger.info(`declined membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to decline membership with id ${membershipId}`);
      throw e;
    }
  }

  async function deactivateMembership(
    membershipId: bigint
  ): Promise<MutationResult> {
    await checkMembershipStatus(membershipId, "ACTIVE");
    try {
      await prisma.membership.update({
        data: { status: "INACTIVE" },
        where: { id: membershipId }
      });
      logger.info(`deactivated membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to deactivate membership with id ${membershipId}`
      );
      throw e;
    }
  }

  async function setMembershipAsWelcomed(
    membershipId: bigint
  ): Promise<MutationResult> {
    await checkMembershipStatus(membershipId, "ACTIVE");
    try {
      await prisma.membership.update({
        data: { isWelcomed: true },
        where: { id: membershipId }
      });
      logger.info(`set membership as welcomed with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to set membership as welcomed with id ${membershipId}`
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
    updateClubDisplayImageUrls,
    createMembershipTier,
    updateMembershipTier,
    deleteMembershipTier,
    publishMembershipTier,
    unpublishMembershipTier,
    submitMembershipApplication,
    approveMembershipApplication,
    declineMembershipApplication,
    deactivateMembership,
    setMembershipAsWelcomed
  };
}
