import { Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { stringify } from "~/utils";
import { StripeClient } from "~/server/payments/stripe/types";
import { AccountIdResolver } from "~/server/payments/accountIdResolver";
import { EmailClient } from "~/server/email/client/types";
import {
  DeactivateMembershipInput,
  Membership,
  MembershipService,
  MembershipStatus,
  SubmitMembershipApplicationInput
} from "~/server/membership/types";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import { asMembership, MEMBERSHIP_SELECT } from "~/server/membership/utils";
import { isPrismaResultDefaultFreeTier } from "~/server/membershipTier/utils";
import { UserService } from "~/server/user/types";
import { FollowingService } from "~/server/following/types";
import { Maybe } from "~/utils/types";
import { MembershipTierService } from "~/server/membershipTier/types";
import { ClubService } from "~/server/club/types";

const logger = rootLogger.child({ module: "membershipService" });

export function createMembershipService(
  prisma: PrismaClient,
  userService: UserService,
  clubService: ClubService,
  membershipTierService: MembershipTierService,
  followingService: FollowingService,
  stripeClient: StripeClient,
  emailClient: EmailClient,
  accountIdResolver: AccountIdResolver
): MembershipService {
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
          asMembership(
            r,
            includeEmail ? await userService.getUserEmail(r.user.id) : null
          )
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
        results.map(async (r) =>
          asMembership(r, await userService.getUserEmail(r.user.id))
        )
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

  async function checkMembershipTierIsPublished(membershipTierId: number) {
    if (
      !(await membershipTierService.isMembershipTierPublished(membershipTierId))
    ) {
      throw new Error(
        `cannot submit membership application for unpublished membership tier with membershipTierId ${membershipTierId}`
      );
    }
  }

  async function checkUserIsNotClubOwner(userId: number, clubId: number) {
    const ownerUserId = await clubService.getClubOwnerUserId(clubId);
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
    const clubId =
      await membershipTierService.getClubIdFromMembershipTierId(
        membershipTierId
      );
    await checkUserIsNotClubOwner(userId, clubId);
    await checkUserDoesNotHaveActiveMembershipForClub(userId, clubId);
    const existingMembership = await userMembershipForClub(userId, clubId);
    const isDefaultFreeTier =
      await membershipTierService.isDefaultFreeTierById(membershipTierId);
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
    const ownerEmail = await userService.getUserEmailInTransaction(
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

      // accepted members no longer need to be following
      // external communications
      await followingService.unfollowClubForMembership(membershipId, tx);

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

    // free tier does not need to create subscription
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
    // noinspection DuplicatedCode
    const membership = await getMembership(membershipId, tx);
    const memberEmail = await userService.getUserEmailInTransaction(
      membership.user.id,
      tx
    );
    if (null === memberEmail) {
      logger.error(
        `failed to notify on membership approved for membership with id ${membershipId} because no member email was found`
      );
      return;
    }
    const ownerEmail = await userService.getUserEmailInTransaction(
      membership.club.owner.id,
      tx
    );
    if (null === ownerEmail) {
      logger.error(
        `failed to notify on membership approved for membership with id ${membershipId} because no owner email was found`
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
      memberEmail,
      ownerEmail
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
    // noinspection DuplicatedCode
    const membership = await getMembership(membershipId, tx);
    const memberEmail = await userService.getUserEmailInTransaction(
      membership.user.id,
      tx
    );
    if (null === memberEmail) {
      logger.error(
        `failed to notify on membership declined for membership with id ${membershipId} because no member email was found`
      );
      return;
    }
    const ownerEmail = await userService.getUserEmailInTransaction(
      membership.club.owner.id,
      tx
    );
    if (null === ownerEmail) {
      logger.error(
        `failed to notify on membership declined for membership with id ${membershipId} because no owner email was found`
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
      memberEmail,
      ownerEmail
    );
  }

  async function withdrawMembershipApplication(
    membershipId: bigint
  ): Promise<MutationResult> {
    const status = await membershipStatus(membershipId);
    if (status !== "PENDING" && status !== "PENDING_INCOMPLETE") {
      throw new Error(
        `Cannot withdraw membership application with status ${status}. Only PENDING or PENDING_INCOMPLETE applications can be withdrawn.`
      );
    }

    return prisma.$transaction(async (tx) => {
      return withdrawMembershipApplicationInTransaction(membershipId, tx);
    });
  }

  async function withdrawMembershipApplicationInTransaction(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      await tx.membership.update({
        data: {
          status: "WITHDRAWN"
        },
        where: { id: membershipId }
      });

      await dissociateStripeSetupIntentId(membershipId, tx);
      // keep customer id in case they reapply in future
      // TODO: email notifications for member-initiated withdrawal.

      logger.info(`withdrew membership application with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to withdraw membership application with id ${membershipId}`);
      throw e;
    }
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
    const memberEmail = await userService.getUserEmailInTransaction(
      membership.user.id,
      tx
    );
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
    // noinspection DuplicatedCode
    const membership = await getMembership(membershipId, tx);
    const memberEmail = await userService.getUserEmailInTransaction(
      membership.user.id,
      tx
    );
    if (null === memberEmail) {
      logger.error(
        `failed to notify on membership deactivated by member to member for membership with id ${membershipId} because no member email was found`
      );
      return;
    }
    const ownerEmail = await userService.getUserEmailInTransaction(
      membership.club.owner.id,
      tx
    );
    if (null === ownerEmail) {
      logger.error(
        `failed to notify on membership deactivated by member to member for membership with id ${membershipId} because no owner email was found`
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
      memberEmail,
      ownerEmail
    );
  }

  async function notifyMembershipDeactivatedByMemberToOwner(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getMembership(membershipId, tx);
    const ownerEmail = await userService.getUserEmailInTransaction(
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
    getUserMemberships,
    getActiveMembershipsForClub,
    getMembershipApplicationsForClub,
    submitMembershipApplication,
    approveMembershipApplication,
    declineMembershipApplication,
    withdrawMembershipApplication,
    deactivateMembership,
    setMembershipAsWelcomed
  };
}
