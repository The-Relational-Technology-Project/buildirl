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
  UpdateClubDisplayImageUrlsInput,
  DeactivateMembershipInput
} from "~/server/service/types";
import {
  FormQuestionsSchema,
  FormResponsesSchema
} from "~/server/service/types/form";
import { parseAsZodType } from "~/utils/zod";
import { stringify } from "~/utils";
import MembershipTierGetPayload = Prisma.MembershipTierGetPayload;
import ClubGetPayload = Prisma.ClubGetPayload;
import MembershipGetPayload = Prisma.MembershipGetPayload;
import {
  isDefaultFreeTier,
  isPrismaResultDefaultFreeTier,
  Maybe
} from "~/utils/types";
import { TemplateThemeSchema } from "~/client/theme/templates";
import { z } from "zod";
import { StripeClient } from "~/server/payments/stripe/types";
import {
  DEFAULT_APPLICATION_QUESTIONS,
  DEFAULT_FREE_MEMBERSHIP_TIER,
  DEFAULT_CLUB_FAQS
} from "~/server/service/defaults";
import { AccountIdResolver } from "~/server/payments/accountIdResolver";
import { EmailClient } from "~/server/service/email/types";
import { FAQsSchema } from "~/server/service/types/index";
const logger = rootLogger.child({ module: "mainService" });

// TODO it is time soon to break this file down by entities
export function createMainService(
  prisma: PrismaClient,
  stripeClient: StripeClient,
  emailClient: EmailClient,
  accountIdResolver: AccountIdResolver
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
    themeHeadingFont: true,
    displayImageUrls: true,
    faqs: true,
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
      themeHeadingFont: r.themeHeadingFont,
      displayImageUrls: parseAsZodType(r.displayImageUrls, z.array(UrlSchema)),
      faqs: parseAsZodType(r.faqs, FAQsSchema),
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
    return prisma.$transaction(async (tx) => {
      return userEmailInTransaction(userId, tx);
    });
  }

  async function userEmailInTransaction(
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<Maybe<Email>> {
    try {
      const userSettings = await tx.userSettings.findUniqueOrThrow({
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
    authEmail: string
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createUserInTransaction(input, authUserId, authEmail, tx);
    });
  }

  async function createUserInTransaction(
    input: CreateUserInput,
    authUserId: string,
    authEmail: string,
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
    authEmail: string,
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
          applicationQuestions: DEFAULT_APPLICATION_QUESTIONS,
          theme: Prisma.DbNull,
          faqs: DEFAULT_CLUB_FAQS
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
        data: {
          ...input,
          theme: input.theme ?? Prisma.DbNull
        },
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
      // TODO do we want to delete connect account?

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

  async function createMembershipTier(
    clubId: number,
    input: CreateMembershipTierInput
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createMembershipTierInTransaction(clubId, input, tx);
    });
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

      await createStripeProductAndPrice(id, input, tx);

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

  async function createStripeProductAndPrice(
    membershipTierId: number,
    input: CreateMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    // free tier does not require Stripe product and prices
    if (isDefaultFreeTier(input)) {
      return;
    }

    const accountId = await accountIdResolver.fromMembershipTierInTransaction(
      membershipTierId,
      tx
    );

    const { productId, priceId } = await stripeClient.createProductAndPrice(
      {
        name: input.name,
        description: input.benefitDescription,
        pricePerMonthInUSD: input.costPerMonthInUSD,
        membershipTierId: membershipTierId
      },
      accountId
    );

    try {
      await tx.membershipTier.update({
        where: { id: membershipTierId },
        data: {
          stripeProductId: productId,
          stripePriceId: priceId
        }
      });
      logger.info(
        `updated membership tier with id ${membershipTierId} with stripeProductId ${productId} and stripePriceId ${priceId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to update membership tier with id ${membershipTierId} with stripeProductId ${productId} and stripePriceId ${priceId}`
      );
      throw e;
    }
  }

  async function createDefaultFreeMembershipTier(
    clubId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    return createMembershipTierInTransaction(
      clubId,
      DEFAULT_FREE_MEMBERSHIP_TIER,
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

  async function isDefaultFreeTierById(membershipTierId: number) {
    try {
      const membershipTier = await prisma.membershipTier.findUniqueOrThrow({
        where: { id: membershipTierId },
        select: { costPerMonthInUSD: true }
      });
      logger.info(
        `checked if membership tier with id ${membershipTierId} is free tier with result ${isPrismaResultDefaultFreeTier(membershipTier)}`
      );
      return isPrismaResultDefaultFreeTier(membershipTier);
    } catch (e) {
      logger.error(
        e,
        `failed to check if membership tier with id ${membershipTierId} is free tier`
      );
      throw e;
    }
  }

  async function checkIsNotDefaultFreeMembershipTier(membershipTierId: number) {
    if (await isDefaultFreeTierById(membershipTierId)) {
      throw new Error("cannot delete default free membership tier");
    }
  }

  async function checkIsNotDefaultFreeMembershipTierAndUpdatingCost(
    membershipTierId: number,
    input: UpdateMembershipTierInput
  ) {
    if (
      (await isDefaultFreeTierById(membershipTierId)) &&
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
      !(await isDefaultFreeTierById(membershipTierId)) &&
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

    return prisma.$transaction(async (tx) => {
      return updateMembershipTierInTransaction(id, input, tx);
    });
  }

  async function updateMembershipTierInTransaction(
    id: number,
    input: UpdateMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membershipTier.update({
        data: input,
        where: {
          id: id
        }
      });

      await updateProductAndPrice(id, input, tx);

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

  async function updateProductAndPrice(
    membershipTierId: number,
    input: UpdateMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    // free tier does not require Stripe product and prices
    if (isDefaultFreeTier(input)) {
      return;
    }

    const membershipTier = await tx.membershipTier.findUniqueOrThrow({
      where: { id: membershipTierId },
      select: {
        stripeProductId: true,
        stripePriceId: true,
        costPerMonthInUSD: true
      }
    });

    if (!membershipTier.stripeProductId) {
      throw new Error(
        `membership tier with id ${membershipTierId} requires stripeProductId to be updated`
      );
    }
    if (!membershipTier.stripePriceId) {
      throw new Error(
        `membership tier with id ${membershipTierId} requires stripePriceId to be updated`
      );
    }

    const accountId = await accountIdResolver.fromMembershipTierInTransaction(
      membershipTierId,
      tx
    );

    const { updatedPriceId } = await stripeClient.updateProductAndPrice(
      {
        productId: membershipTier.stripeProductId,
        priceId: membershipTier.stripePriceId,
        name: input.name,
        description: input.benefitDescription,
        pricePerMonthInUSD: input.costPerMonthInUSD
      },
      accountId
    );

    // only update price id if it has changed
    if (!!updatedPriceId) {
      try {
        await tx.membershipTier.update({
          where: { id: membershipTierId },
          data: { stripePriceId: updatedPriceId }
        });
        logger.info(
          `updated membership tier with id ${membershipTierId} with stripePriceId ${updatedPriceId}`
        );
      } catch (e) {
        logger.error(
          e,
          `failed to update membership tier with id ${membershipTierId} with stripePriceId ${updatedPriceId}`
        );
        throw e;
      }
    }
  }

  async function deleteMembershipTier(id: number): Promise<MutationResult> {
    await checkNoActiveMembersOnMembershipTier(id);
    await checkIsNotDefaultFreeMembershipTier(id);
    if (await isMembershipTierLastPublishedTier(id)) {
      throw new Error("cannot delete last published membership tier");
    }

    return prisma.$transaction(async (tx) => {
      return deleteMembershipTierInTransaction(id, tx);
    });
  }

  async function deleteMembershipTierInTransaction(
    id: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await archiveProductAndPrice(id, tx);

      await tx.membershipTier.delete({
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

  async function archiveProductAndPrice(
    membershipTierId: number,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const membershipTier = await tx.membershipTier.findUniqueOrThrow({
      select: {
        stripeProductId: true,
        stripePriceId: true,
        costPerMonthInUSD: true
      },
      where: { id: membershipTierId }
    });

    // free tier does not need to archive product
    if (isPrismaResultDefaultFreeTier(membershipTier)) {
      return;
    }

    if (!membershipTier.stripeProductId || !membershipTier.stripePriceId) {
      // unexpected and we should look into but since it is non-actionable and doesn't result in bad state,
      // we should not block
      logger.error(
        `membership tier with id ${membershipTierId} requires stripeProductId and stripePriceId to be archived`
      );
      return;
    }

    const accountId = await accountIdResolver.fromMembershipTierInTransaction(
      membershipTierId,
      tx
    );

    await stripeClient.archiveProductAndPrice(
      {
        productId: membershipTier.stripeProductId,
        priceId: membershipTier.stripePriceId
      },
      accountId
    );
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

    return prisma.$transaction(async (tx) => {
      return publishMembershipTierInTransaction(id, tx);
    });
  }

  async function publishMembershipTierInTransaction(
    id: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membershipTier.update({
        data: { status: "PUBLISHED" },
        where: {
          id: id
        }
      });

      await publishProduct(id, tx);

      logger.info(`published membership tier with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to publish membership tier with id ${id}`);
      throw e;
    }
  }

  async function publishProduct(
    membershipTierId: number,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const membershipTier = await tx.membershipTier.findUniqueOrThrow({
      select: {
        stripeProductId: true,
        stripePriceId: true,
        costPerMonthInUSD: true
      },
      where: { id: membershipTierId }
    });

    // free tier does not need to publish product
    if (isPrismaResultDefaultFreeTier(membershipTier)) {
      return;
    }

    if (!membershipTier.stripeProductId || !membershipTier.stripePriceId) {
      throw new Error(
        `membership tier with id ${membershipTierId} requires stripeProductId and stripePriceId to be published`
      );
    }

    const accountId = await accountIdResolver.fromMembershipTierInTransaction(
      membershipTierId,
      tx
    );

    await stripeClient.publishProductAndPrice(
      {
        productId: membershipTier.stripeProductId,
        priceId: membershipTier.stripePriceId
      },
      accountId
    );
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

    return prisma.$transaction(async (tx) => {
      return unpublishMembershipTierInTransaction(id, tx);
    });
  }

  async function unpublishMembershipTierInTransaction(
    id: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membershipTier.update({
        data: { status: "UNPUBLISHED" },
        where: {
          id: id
        }
      });

      await archiveProductAndPrice(id, tx);

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
        select: { ownerUserId: true },
        where: { id: clubId }
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
        select: { clubId: true },
        where: { id: membershipTierId }
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
    const isDefaultFreeTier = await isDefaultFreeTierById(membershipTierId);
    if (null === existingMembership) {
      return await createMembershipApplication(
        membershipTierId,
        input,
        userId,
        isDefaultFreeTier
      );
    }
    // declined or deactivate membership can reapply with overwrite
    return await updateMembershipWithNewApplication(
      membershipTierId,
      input,
      existingMembership.id,
      isDefaultFreeTier
    );
  }

  async function createMembershipApplication(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number,
    isDefaultFreeTier: boolean
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createMembershipApplicationInTransaction(
        membershipTierId,
        input,
        userId,
        isDefaultFreeTier,
        tx
      );
    });
  }

  async function createMembershipApplicationInTransaction(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number,
    isDefaultFreeTier: boolean,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.membership.create({
        data: {
          userId: userId,
          membershipTierId: membershipTierId,
          applicationResponses: input.applicationResponses,
          // if not free tier, still awaiting setup intent
          status: isDefaultFreeTier ? "PENDING" : "PENDING_INCOMPLETE"
        },
        select: {
          id: true
        }
      });

      await createStripeCustomer(id, tx);
      await notifyMembershipApplicationSubmittedInTransaction(id, tx);

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

  async function createStripeCustomer(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    try {
      const membership = await tx.membership.findUniqueOrThrow({
        where: { id: membershipId },
        select: {
          stripeCustomerId: true,
          membershipTier: {
            select: {
              costPerMonthInUSD: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              settings: {
                select: { email: true }
              }
            }
          }
        }
      });

      if (membership.stripeCustomerId !== null) {
        // already have a stripeCustomerId, no need to create a new one
        return;
      }

      if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
        // no Stripe customer needed for default free tier
        return;
      }

      if (!membership.user.settings?.email) {
        throw new Error(
          `user with id ${membership.user.id} has no settings with email to create Stripe customer`
        );
      }

      const accountId = await accountIdResolver.fromMembershipInTransaction(
        membershipId,
        tx
      );

      const response = await stripeClient.createCustomer(
        {
          email: membership.user.settings.email,
          name: `${membership.user.firstName} ${membership.user.lastName}`,
          membershipId: membershipId
        },
        accountId
      );

      await tx.membership.update({
        data: { stripeCustomerId: response.customerId },
        where: { id: membershipId }
      });

      logger.info(
        `updated membership with id ${membershipId} with stripeCustomerId ${response.customerId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to update membership with id ${membershipId} with stripeCustomerId`
      );
      throw e;
    }
  }

  async function updateMembershipWithNewApplication(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    membershipId: bigint,
    isDefaultFreeTier: boolean
  ) {
    return prisma.$transaction(async (tx) => {
      return updateMembershipWithNewApplicationInTransaction(
        membershipTierId,
        input,
        membershipId,
        isDefaultFreeTier,
        tx
      );
    });
  }

  async function updateMembershipWithNewApplicationInTransaction(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    membershipId: bigint,
    isDefaultFreeTier: boolean,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.membership.update({
        data: {
          membershipTierId: membershipTierId,
          applicationResponses: input.applicationResponses,
          // if not free tier, awaiting setup intent
          status: isDefaultFreeTier ? "PENDING" : "PENDING_INCOMPLETE",
          // reset welcome status
          isWelcomed: false
          // we keep the stripeCustomerId to be reused if reactivated
        },
        where: {
          id: membershipId
        }
      });
      logger.info(
        `updated membership to pending membership from input ${stringify(input)} with membershipId ${id}`
      );

      await createStripeCustomer(id, tx);
      await notifyMembershipApplicationSubmitted(id);

      // need to return id as this is considered creation
      return { createdEntityId: id };
    } catch (e) {
      logger.error(
        e,
        `failed to update membership to pending membership from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function notifyMembershipApplicationSubmitted(membershipId: bigint) {
    return prisma.$transaction(async (tx) => {
      return notifyMembershipApplicationSubmittedInTransaction(
        membershipId,
        tx
      );
    });
  }

  async function notifyMembershipApplicationSubmittedInTransaction(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getMembership(membershipId, tx);
    const ownerEmail = await userEmailInTransaction(
      membership.club.owner.id,
      tx
    );

    if (null === ownerEmail) {
      logger.error(
        `failed to notify on membership application submitted for membership with id ${membershipId} because no email was found`
      );
      return;
    }
    await emailClient.notifyMembershipApplicationSubmitted(
      {
        membershipId: membershipId,
        memberFirstName: membership.user.firstName,
        memberLastName: membership.user.lastName,
        clubName: membership.club.name,
        clubId: membership.club.id
      },
      ownerEmail
    );
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

  async function getMembership(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<Membership> {
    try {
      const result = await tx.membership.findUniqueOrThrow({
        select: MEMBERSHIP_SELECT,
        where: {
          id: membershipId
        }
      });
      const memberships = asMembership(result);
      logger.info(
        `queried membership with id ${membershipId} with result ${stringify(memberships)}`
      );
      return memberships;
    } catch (e) {
      logger.error(e, `failed to query membership with id ${membershipId}`);
      throw e;
    }
  }

  async function approveMembershipApplication(
    membershipId: bigint
  ): Promise<MutationResult> {
    await checkMembershipStatus(membershipId, "PENDING");

    return prisma.$transaction(async (tx) => {
      return approveMembershipApplicationInTransaction(membershipId, tx);
    });
  }

  async function approveMembershipApplicationInTransaction(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membership.update({
        data: {
          status: "ACTIVE"
        },
        where: { id: membershipId }
      });

      await createSubscription(membershipId, tx);
      await notifyMembershipApproved(membershipId, tx);

      logger.info(`approved membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to approve membership with id ${membershipId}`);
      throw e;
    }
  }

  async function createSubscription(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const membership = await tx.membership.findUniqueOrThrow({
      select: {
        stripeSetupIntentId: true,
        stripeCustomerId: true,
        membershipTier: {
          select: {
            id: true,
            stripePriceId: true,
            costPerMonthInUSD: true,
            club: {
              select: {
                id: true,
                stripeConnectAccountId: true
              }
            }
          }
        }
      },
      where: { id: membershipId }
    });

    // free tier does not need to create subscription
    if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
      return;
    }

    const customerId = membership.stripeCustomerId;
    const stripeAccountId =
      membership.membershipTier.club.stripeConnectAccountId;
    const setupIntentId = membership.stripeSetupIntentId;
    const priceId = membership.membershipTier.stripePriceId;

    if (!customerId) {
      throw new Error(
        `membership with id ${membershipId} has no stripeCustomerId to create subscription`
      );
    }
    if (!stripeAccountId) {
      throw new Error(
        `club with id ${membership.membershipTier.club.id} has no stripeAccountId create subscription`
      );
    }
    if (!setupIntentId) {
      throw new Error(
        `membership with id ${membershipId} has no stripeSetupIntentId to create subscription`
      );
    }
    if (!priceId) {
      throw new Error(
        `membership tier with id ${membership.membershipTier.id} has no priceId to create subscription`
      );
    }

    const accountId = await accountIdResolver.fromMembershipInTransaction(
      membershipId,
      tx
    );

    const { subscriptionId } = await stripeClient.createSubscription(
      {
        setupIntentId: setupIntentId,
        customerId: customerId,
        priceId: priceId,
        membershipId: membershipId
      },
      accountId
    );

    try {
      await tx.membership.update({
        data: {
          stripeSubscriptionId: subscriptionId
        },
        where: { id: membershipId }
      });
      logger.info(
        `updated membership with id ${membershipId} with subscription id ${subscriptionId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to update membership with id ${membershipId} with subscription id ${subscriptionId}`
      );
      throw e;
    }
  }

  async function notifyMembershipApproved(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getMembership(membershipId, tx);
    const memberEmail = await userEmailInTransaction(membership.user.id, tx);
    if (null === memberEmail) {
      logger.error(
        `failed to notify on membership approved for membership with id ${membershipId} because no email was found`
      );
      return;
    }
    await emailClient.notifyMembershipApproved(
      {
        membershipId: membershipId,
        memberFirstName: membership.user.firstName,
        memberLastName: membership.user.lastName,
        clubName: membership.club.name,
        clubPublicId: membership.club.publicId
      },
      memberEmail
    );
  }

  async function declineMembershipApplication(
    membershipId: bigint
  ): Promise<MutationResult> {
    await checkMembershipStatus(membershipId, "PENDING");

    return prisma.$transaction(async (tx) => {
      return declineMembershipApplicationInTransaction(membershipId, tx);
    });
  }

  async function declineMembershipApplicationInTransaction(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membership.update({
        data: {
          status: "DECLINED"
        },
        where: { id: membershipId }
      });

      await dissociateStripeSetupIntentId(membershipId, tx);
      // keep customer id in case we are accepted in future
      await notifyMembershipDeclined(membershipId, tx);

      logger.info(`declined membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to decline membership with id ${membershipId}`);
      throw e;
    }
  }

  async function dissociateStripeSetupIntentId(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const membership = await tx.membership.findUniqueOrThrow({
      select: {
        stripeSetupIntentId: true,
        membershipTier: {
          select: {
            costPerMonthInUSD: true
          }
        }
      },
      where: { id: membershipId }
    });

    // free tier does not have setup intent
    if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
      return;
    }

    if (!membership.stripeSetupIntentId) {
      // unexpected and we should look into but since it is non-actionable and doesn't result in bad state,
      // we should not block
      logger.error(
        `membership with id ${membershipId} has no stripeSetupIntentId to cancel`
      );
      return;
    }

    // we do not cancel setup intent from Stripe because those created from checkout session cannot be cancelled
    // and are not in a confirmed state not 'requires_payment_method', 'requires_confirmation, or 'requires_action'
    // which are the only states that are allowed to be cancelled: https://docs.stripe.com/api/setup_intents/cancel
    // we also do not expire the checkout session since the checkout session is in a 'completed' state and not
    // in 'open' state for expiration: https://docs.stripe.com/api/checkout/sessions/expire
    // it should be OK to keep both objects in these terminal states even though we will not use them

    try {
      await tx.membership.update({
        data: {
          stripeSetupIntentId: null
        },
        where: { id: membershipId }
      });
      logger.info(
        `updated membership with id ${membershipId} to set stripeSetupIntentId to null`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to update membership with id ${membershipId} to set stripeSetupIntentId to null`
      );
      throw e;
    }
  }

  async function notifyMembershipDeclined(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getMembership(membershipId, tx);
    const memberEmail = await userEmailInTransaction(membership.user.id, tx);
    if (null === memberEmail) {
      logger.error(
        `failed to notify on membership declined for membership with id ${membershipId} because no email was found`
      );
      return;
    }
    await emailClient.notifyMembershipDeclined(
      {
        membershipId: membershipId,
        clubName: membership.club.name
      },
      memberEmail
    );
  }

  async function deactivateMembership(
    membershipId: bigint,
    input: DeactivateMembershipInput
  ): Promise<MutationResult> {
    await checkMembershipStatus(membershipId, "ACTIVE");

    return prisma.$transaction(async (tx) => {
      return deactivateMembershipInTransaction(
        membershipId,
        input.byClubOwner,
        tx
      );
    });
  }

  async function deactivateMembershipInTransaction(
    membershipId: bigint,
    byClubOwner: boolean,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membership.update({
        data: {
          status: "INACTIVE"
        },
        where: { id: membershipId }
      });

      // if subscription was cancelled outside of this system,
      // that is OK because these operations are idempotent
      // https://docs.stripe.com/api/idempotent_requests
      await cancelSubscription(membershipId, tx);
      await dissociateStripeSetupIntentId(membershipId, tx);
      // keep customer id in case we are reactivated

      await notifyMembershipDeactivated(membershipId, byClubOwner, tx);

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

  async function cancelSubscription(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await tx.membership.findUniqueOrThrow({
      select: {
        membershipTier: {
          select: {
            costPerMonthInUSD: true
          }
        },
        stripeSubscriptionId: true
      },
      where: { id: membershipId }
    });

    // free tier does not need to cancel subscription
    if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
      return;
    }

    if (!membership.stripeSubscriptionId) {
      // unexpected and we should look into but since it is non-actionable and doesn't result in bad state,
      // we should not block
      logger.error(
        `membership with id ${membershipId} has no stripeSubscriptionId to cancel`
      );
      return;
    }

    const accountId = await accountIdResolver.fromMembershipInTransaction(
      membershipId,
      tx
    );

    await stripeClient.cancelSubscription(
      membership.stripeSubscriptionId,
      accountId
    );

    try {
      await tx.membership.update({
        data: {
          stripeSubscriptionId: null
        },
        where: { id: membershipId }
      });
      logger.info(
        `updated membership with id ${membershipId} to set subscriptionId to null`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to update membership with id ${membershipId} to set subscriptionId to null`
      );
      throw e;
    }
  }

  async function notifyMembershipDeactivated(
    membershipId: bigint,
    byOwner: boolean,
    tx: Prisma.TransactionClient
  ) {
    if (byOwner) {
      await notifyMembershipDeactivatedByOwner(membershipId, tx);
    } else {
      await notifyMembershipDeactivatedByMemberToOwner(membershipId, tx);
      // sorry to see you go email
      await notifyMembershipDeactivatedByMemberToMember(membershipId, tx);
    }
  }

  async function notifyMembershipDeactivatedByOwner(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getMembership(membershipId, tx);
    const memberEmail = await userEmailInTransaction(membership.user.id, tx);

    if (null === memberEmail) {
      logger.error(
        `failed to notify on membership deactivated by owner for membership with id ${membershipId} because no email was found`
      );
      return;
    }
    await emailClient.notifyMembershipDeactivatedByOwner(
      {
        membershipId: membershipId,
        clubName: membership.club.name
      },
      memberEmail
    );
  }

  async function notifyMembershipDeactivatedByMemberToMember(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getMembership(membershipId, tx);
    const memberEmail = await userEmailInTransaction(membership.user.id, tx);

    if (null === memberEmail) {
      logger.error(
        `failed to notify on membership deactivated by member to member for membership with id ${membershipId} because no email was found`
      );
      return;
    }
    await emailClient.notifyMembershipDeactivatedByMemberToMember(
      {
        membershipId: membershipId,
        memberFirstName: membership.user.firstName,
        memberLastName: membership.user.lastName,
        clubName: membership.club.name
      },
      memberEmail
    );
  }

  async function notifyMembershipDeactivatedByMemberToOwner(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getMembership(membershipId, tx);
    const ownerEmail = await userEmailInTransaction(
      membership.club.owner.id,
      tx
    );

    if (null === ownerEmail) {
      logger.error(
        `failed to notify on membership deactivated by member to owner for membership with id ${membershipId} because no email was found`
      );
      return;
    }
    await emailClient.notifyMembershipDeactivatedByMemberToOwner(
      {
        membershipId: membershipId,
        memberFirstName: membership.user.firstName,
        memberLastName: membership.user.lastName,
        clubName: membership.club.name,
        clubId: membership.club.id
      },
      ownerEmail
    );
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
