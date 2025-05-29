import { Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";
import { StripeClient } from "~/server/payments/stripe/types";
import { AccountIdResolver } from "~/server/payments/accountIdResolver";
import { EmailClient } from "~/server/email/client/types";
import {
  ClubFollower,
  DeactivateMembershipInput,
  Membership,
  MembershipService,
  MembershipStatus,
  SubmitMembershipApplicationInput
} from "~/server/membership/types";
import UserGetPayload = Prisma.UserGetPayload;
import {
  Email,
  MutationResult,
  NO_ID_MUTATION_RESULT
} from "~/server/utils/types";
import { USER_SELECT } from "~/server/user/service";
import { asMembership, MEMBERSHIP_SELECT } from "~/server/membership/utils";
import { isPrismaResultDefaultFreeTier } from "~/server/membershipTier/utils";

const logger = rootLogger.child({ module: "membershipService" });

export function createMembershipService(
  prisma: PrismaClient,
  stripeClient: StripeClient,
  emailClient: EmailClient,
  accountIdResolver: AccountIdResolver
): MembershipService {
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
        results.map(async (r) =>
          asMembership(r, includeEmail ? await userEmail(r.user.id) : null)
        )
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
        results.map(async (r) => asMembership(r, await userEmail(r.user.id)))
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

  async function asClubFollower(
    r: UserGetPayload<{ select: typeof USER_SELECT }>,
    createdAt: Date
  ): Promise<ClubFollower> {
    const email = await userEmail(r.id);
    if (!email) {
      throw new Error(`expected to find email for user ${r.id} but found none`);
    }
    return {
      user: r,
      email: email,
      createdAt: createdAt
    };
  }

  async function getClubFollowers(clubId: number): Promise<ClubFollower[]> {
    try {
      const results = await prisma.clubFollowing.findMany({
        where: {
          clubId: clubId
        },
        select: {
          user: {
            select: USER_SELECT
          },
          createdAt: true
        }
      });

      const followers = await Promise.all(
        results.map((r) => asClubFollower(r.user, r.createdAt))
      );
      logger.info(
        `queried followers for club with clubId ${clubId} with result ${stringify(followers)}`
      );
      return followers;
    } catch (e) {
      logger.error(
        e,
        `failed to query followers for club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function checkUserIsNotClubOwner(userId: number, clubId: number) {
    const clubOwnerUserId = await prisma.club
      .findUniqueOrThrow({
        where: { id: clubId },
        select: { ownerUserId: true }
      })
      .then((r) => r.ownerUserId);

    if (clubOwnerUserId === userId) {
      throw new Error("user is owner of club");
    }
  }

  async function checkUserDoesNotHaveActiveMembershipForClub(
    userId: number,
    clubId: number
  ) {
    const activeMembershipCount = await prisma.membership.count({
      where: {
        userId: userId,
        membershipTier: {
          clubId: clubId
        },
        status: "ACTIVE"
      }
    });

    if (activeMembershipCount > 0) {
      throw new Error("user already has active membership in club");
    }
  }

  async function submitMembershipApplication(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number
  ): Promise<MutationResult> {
    const membershipTier = await prisma.membershipTier.findUniqueOrThrow({
      where: { id: membershipTierId },
      select: {
        id: true,
        clubId: true,
        costPerMonthInUSD: true,
        status: true
      }
    });

    if (membershipTier.status !== "PUBLISHED") {
      throw new Error("membership tier is not published");
    }

    const clubId = membershipTier.clubId;

    await checkUserIsNotClubOwner(userId, clubId);
    await checkUserDoesNotHaveActiveMembershipForClub(userId, clubId);

    const isDefaultFreeTier = isPrismaResultDefaultFreeTier(membershipTier);

    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        membershipTier: {
          clubId: clubId
        },
        status: { in: ["INACTIVE", "DECLINED"] }
      }
    });

    if (existingMembership) {
      return updateMembershipWithNewApplication(
        membershipTierId,
        input,
        existingMembership.id,
        isDefaultFreeTier
      );
    }

    return createNewMembershipApplication(
      membershipTierId,
      input,
      userId,
      isDefaultFreeTier
    );
  }

  async function createNewMembershipApplication(
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number,
    isDefaultFreeTier: boolean
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createNewMembershipApplicationInTransaction(
        membershipTierId,
        input,
        userId,
        isDefaultFreeTier,
        tx
      );
    });
  }

  async function createNewMembershipApplicationInTransaction(
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
          status: isDefaultFreeTier ? "PENDING" : "PENDING_INCOMPLETE",
          isWelcomed: false
        }
      });

      await createStripeCustomer(id, tx);
      await notifyMembershipApplicationSubmitted(id);

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
  ): Promise<void> {
    try {
      const membership = await tx.membership.findUniqueOrThrow({
        select: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              settings: {
                select: {
                  email: true
                }
              }
            }
          }
        },
        where: { id: membershipId }
      });

      if (!membership.user.settings?.email) {
        throw new Error(
          `user with id ${membership.user.id} has no settings with email to create Stripe customer`
        );
      }

      const accountId = await accountIdResolver.fromMembershipInTransaction(
        membershipId,
        tx
      );

      const response = await stripeClient.createCustomerForMembership(
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
          status: isDefaultFreeTier ? "PENDING" : "PENDING_INCOMPLETE",
          isWelcomed: false
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

      await unfollowClubForMembership(membershipId, tx);

      await createSubscription(membershipId, tx);
      await notifyMembershipApproved(membershipId, tx);

      logger.info(`approved membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to approve membership with id ${membershipId}`);
      throw e;
    }
  }

  async function unfollowClubForMembership(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getClubIdAndUserIdForMembership(membershipId, tx);
    await unfollowClubInTransaction(membership.userId, membership.clubId, tx);
  }

  async function getClubIdAndUserIdForMembership(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<{ userId: number; clubId: number }> {
    try {
      const result = await tx.membership.findUniqueOrThrow({
        select: {
          userId: true,
          membershipTier: { select: { clubId: true } }
        },
        where: { id: membershipId }
      });

      logger.info(`queried userId and clubId for ${membershipId}`);
      return { userId: result.userId, clubId: result.membershipTier.clubId };
    } catch (e) {
      logger.error(e, `failed to query userId and clubId for ${membershipId}`);
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
            initiationFeeStripePriceId: true,
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

    if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
      return;
    }

    const customerId = membership.stripeCustomerId;
    const stripeAccountId =
      membership.membershipTier.club.stripeConnectAccountId;
    const setupIntentId = membership.stripeSetupIntentId;
    const priceId = membership.membershipTier.stripePriceId;
    const initiationFeeStripePriceId =
      membership.membershipTier.initiationFeeStripePriceId;

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

    const { subscriptionId } =
      await stripeClient.createSubscriptionForMembership(
        {
          setupIntentId: setupIntentId,
          customerId: customerId,
          priceId: priceId,
          membershipId: membershipId,
          initiationFeePriceId: initiationFeeStripePriceId
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
        clubId: membership.club.id,
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

    if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
      return;
    }

    if (!membership.stripeSetupIntentId) {
      logger.error(
        `membership with id ${membershipId} has no stripeSetupIntentId to cancel`
      );
      return;
    }

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
        memberFirstName: membership.user.firstName,
        clubName: membership.club.name,
        clubId: membership.club.id
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

      await cancelSubscription(membershipId, tx);
      await dissociateStripeSetupIntentId(membershipId, tx);

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

    if (isPrismaResultDefaultFreeTier(membership.membershipTier)) {
      return;
    }

    if (!membership.stripeSubscriptionId) {
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
        clubName: membership.club.name,
        clubId: membership.club.id
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

  async function isUserFollowingClub(
    userId: number,
    clubId: number
  ): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      return isUserFollowingClubInTransaction(userId, clubId, tx);
    });
  }

  async function isUserFollowingClubInTransaction(
    userId: number,
    clubId: number,
    tx: Prisma.TransactionClient
  ) {
    try {
      const count = await tx.clubFollowing.count({
        where: {
          userId: userId,
          clubId: clubId
        }
      });

      return count > 0;
    } catch (e) {
      logger.error(
        e,
        `failed to query if user with userId ${userId} is following club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function followClub(
    userId: number,
    clubId: number
  ): Promise<MutationResult> {
    await checkUserIsNotClubOwner(userId, clubId);
    await checkUserDoesNotHaveActiveMembershipForClub(userId, clubId);

    if (await isUserFollowingClub(userId, clubId)) {
      logger.info(
        `user with userId ${userId} already follows club with clubId ${clubId}`
      );
      return NO_ID_MUTATION_RESULT;
    }

    try {
      await prisma.clubFollowing.create({
        data: {
          userId: userId,
          clubId: clubId
        }
      });

      logger.info(
        `created club following between user with userId ${userId} and club with clubId ${clubId}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to create club following between user with userId ${userId} and club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function unfollowClub(userId: number, clubId: number) {
    return prisma.$transaction(async (tx) => {
      return unfollowClubInTransaction(userId, clubId, tx);
    });
  }

  async function unfollowClubInTransaction(
    userId: number,
    clubId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    if (!(await isUserFollowingClubInTransaction(userId, clubId, tx))) {
      logger.info(
        `user with userId ${userId} does not follow club with clubId ${clubId}`
      );
      return NO_ID_MUTATION_RESULT;
    }

    try {
      await tx.clubFollowing.delete({
        where: {
          userId_clubId: {
            userId,
            clubId
          }
        }
      });

      logger.info(
        `deleted club following between user with userId ${userId} and club with clubId ${clubId}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to delete club following between user with userId ${userId} and club with clubId ${clubId}`
      );
      throw e;
    }
  }

  return {
    getUserMemberships,
    getActiveMembershipsForClub,
    getMembershipApplicationsForClub,
    getClubFollowers,
    submitMembershipApplication,
    approveMembershipApplication,
    declineMembershipApplication,
    deactivateMembership,
    setMembershipAsWelcomed,
    followClub,
    unfollowClub
  };
}
