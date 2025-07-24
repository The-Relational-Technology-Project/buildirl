import { $Enums, Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { stringify } from "~/utils";
import { EmailService } from "~/server/email/types";
import {
  DeactivateMembershipInput,
  Membership,
  MembershipService,
  MembershipStatus,
  MembershipWithClub,
  SubmitMembershipApplicationInput
} from "~/server/membership/types";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import {
  asMembership,
  asMembershipWithClub,
  MEMBERSHIP_SELECT,
  MEMBERSHIP_WITH_CLUB_SELECT
} from "~/server/membership/utils";
import { isPrismaResultDefaultFreeTier } from "~/server/membershipTier/utils";
import { UserService } from "~/server/user/types";
import { FollowingService } from "~/server/following/types";
import { Maybe } from "~/utils/types";
import { MembershipTierService } from "~/server/membershipTier/types";
import Role = $Enums.Role;
import { RoleService } from "~/server/role/types";
import { PaymentService } from "~/server/payments/types";

const logger = rootLogger.child({ module: "membershipService" });

export function createMembershipService(
  prisma: PrismaClient,
  userService: UserService,
  membershipTierService: MembershipTierService,
  followingService: FollowingService,
  roleService: RoleService,
  emailService: EmailService,
  paymentService: PaymentService
): MembershipService {
  async function getUserMemberships(
    userId: number
  ): Promise<MembershipWithClub[]> {
    try {
      const results = await prisma.membership.findMany({
        select: MEMBERSHIP_WITH_CLUB_SELECT,
        where: {
          userId: userId
        }
      });
      const memberships = await Promise.all(
        results.map((r) => asMembershipWithClub(r))
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
    // if not free tier, still awaiting setup intent
    const status: MembershipStatus = isDefaultFreeTier
      ? "PENDING"
      : "PENDING_INCOMPLETE";
    try {
      const { id } = await tx.membership.create({
        data: {
          userId: userId,
          membershipTierId: membershipTierId,
          applicationResponses: input.applicationResponses,
          status: status,
          role: "MEMBER"
        },
        select: {
          id: true
        }
      });

      await paymentService.createCustomerForMembership(id, tx);
      // only notify once application is fully pending
      if (status === "PENDING") {
        await notifyMembershipApplicationSubmittedInTransaction(id, tx);
      }

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
      // if not free tier, still awaiting setup intent
      const status: MembershipStatus = isDefaultFreeTier
        ? "PENDING"
        : "PENDING_INCOMPLETE";
      const { id } = await tx.membership.update({
        data: {
          membershipTierId: membershipTierId,
          applicationResponses: input.applicationResponses,
          status: status,
          // reset role even if they left as different role
          role: "MEMBER",
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

      await paymentService.createCustomerForMembership(id, tx);
      // only notify once in fully pending
      if (status === "PENDING") {
        await notifyMembershipApplicationSubmitted(id);
      }

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
    const membership = await getMembershipWithClub(membershipId, tx);
    const leadUserIds = await getLeadUserIdsForClub(membership.club.id, tx);
    await emailService.sendEmailForMembershipApplicationSubmitted(
      {
        membershipId: membershipId,
        memberFirstName: membership.user.firstName,
        memberLastName: membership.user.lastName,
        clubName: membership.club.name,
        clubId: membership.club.id,
        clubLeadUserIds: leadUserIds
      },
      tx
    );
  }

  async function membershipStatus(
    membershipId: bigint
  ): Promise<MembershipStatus> {
    try {
      const membership = await prisma.membership.findUniqueOrThrow({
        select: {
          status: true
        },
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

  async function getMembershipWithClub(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<MembershipWithClub> {
    try {
      const result = await tx.membership.findUniqueOrThrow({
        select: MEMBERSHIP_WITH_CLUB_SELECT,
        where: {
          id: membershipId
        }
      });
      const memberships = asMembershipWithClub(result);
      logger.info(
        `queried membership with id ${membershipId} with result ${stringify(memberships)}`
      );
      return memberships;
    } catch (e) {
      logger.error(e, `failed to query membership with id ${membershipId}`);
      throw e;
    }
  }

  async function getLeadUserIdsForClub(
    clubId: number,
    tx: Prisma.TransactionClient
  ): Promise<number[]> {
    try {
      const result = await tx.membership.findMany({
        select: MEMBERSHIP_SELECT,
        where: {
          membershipTier: { clubId: clubId },
          role: Role.LEAD
        }
      });

      if (result.length === 0) {
        throw new Error(`expected at least one lead membership but found none`);
      }

      logger.info(
        `queried lead membership for club with id ${clubId} with result ${stringify(result)}`
      );
      return result.map((r) => r.user.id);
    } catch (e) {
      logger.error(
        e,
        `failed to query lead membership for club with id ${clubId}`
      );
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

      await paymentService.createSubscriptionForMembership(
        {
          membershipId: membershipId
        },
        tx
      );
      await notifyMembershipApproved(membershipId, tx);

      logger.info(`approved membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to approve membership with id ${membershipId}`);
      throw e;
    }
  }

  async function notifyMembershipApproved(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    // noinspection DuplicatedCode
    const membership = await getMembershipWithClub(membershipId, tx);
    const leadUserId = await getLeadUserIdsForClub(membership.club.id, tx);
    await emailService.sendEmailForMembershipApproved(
      {
        membershipId: membershipId,
        memberFirstName: membership.user.firstName,
        memberLastName: membership.user.lastName,
        clubId: membership.club.id,
        clubName: membership.club.name,
        clubPublicId: membership.club.publicId,
        clubLeadUserIds: leadUserId,
        memberUserId: membership.user.id
      },
      tx
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
            costPerBillingInterval: true
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
    const membership = await getMembershipWithClub(membershipId, tx);
    const leadUserIds = await getLeadUserIdsForClub(membership.club.id, tx);
    await emailService.sendEmailForMembershipDeclined(
      {
        membershipId: membershipId,
        memberFirstName: membership.user.firstName,
        clubName: membership.club.name,
        clubId: membership.club.id,
        clubLeadUserIds: leadUserIds,
        memberUserId: membership.user.id
      },
      tx
    );
  }

  async function withdrawMembershipApplication(
    membershipId: bigint
  ): Promise<MutationResult> {
    await checkMembershipStatus(membershipId, "PENDING");

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
      await notifyApplicationWithdrawn(membershipId, tx);

      logger.info(`withdrew membership application with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to withdraw membership application with id ${membershipId}`
      );
      throw e;
    }
  }

  async function checkIsNotLastLeadMembershipForClub(membershipId: bigint) {
    if (await roleService.isMembershipLastLeadForClub(membershipId)) {
      throw new Error(
        // user friendly message
        `Failed to remove membership with id ${membershipId} because it is the last lead for the club. 
          You must first assign another member as club lead.`
      );
    }
  }

  async function deactivateMembership(
    membershipId: bigint,
    input: DeactivateMembershipInput
  ): Promise<MutationResult> {
    await checkMembershipStatus(membershipId, "ACTIVE");
    await checkIsNotLastLeadMembershipForClub(membershipId);

    return prisma.$transaction(async (tx) => {
      return deactivateMembershipInTransaction(
        membershipId,
        input.byClubLead,
        tx
      );
    });
  }

  async function deactivateMembershipInTransaction(
    membershipId: bigint,
    byClubLead: boolean,
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
      await paymentService.cancelSubscription(membershipId, tx);
      await dissociateStripeSetupIntentId(membershipId, tx);
      // keep customer id in case we are reactivated

      await notifyMembershipDeactivated(membershipId, byClubLead, tx);

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

  async function notifyMembershipDeactivated(
    membershipId: bigint,
    byLead: boolean,
    tx: Prisma.TransactionClient
  ) {
    if (byLead) {
      await notifyMembershipDeactivatedByLead(membershipId, tx);
    } else {
      await notifyMembershipDeactivatedByMemberToLead(membershipId, tx);
      // sorry to see you go email
      await notifyMembershipDeactivatedByMemberToMember(membershipId, tx);
    }
  }

  async function notifyMembershipDeactivatedByLead(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getMembershipWithClub(membershipId, tx);
    await emailService.sendEmailForMembershipDeactivatedByLead(
      {
        membershipId: membershipId,
        clubName: membership.club.name,
        memberUserId: membership.user.id
      },
      tx
    );
  }

  async function notifyMembershipDeactivatedByMemberToMember(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    // noinspection DuplicatedCode
    const membership = await getMembershipWithClub(membershipId, tx);
    const leadUserIds = await getLeadUserIdsForClub(membership.club.id, tx);
    await emailService.sendEmailForMembershipDeactivatedByMemberToMember(
      {
        membershipId: membershipId,
        memberFirstName: membership.user.firstName,
        memberLastName: membership.user.lastName,
        clubName: membership.club.name,
        clubId: membership.club.id,
        clubLeadUserIds: leadUserIds,
        memberUserId: membership.user.id
      },
      tx
    );
  }

  async function notifyMembershipDeactivatedByMemberToLead(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getMembershipWithClub(membershipId, tx);
    const leadUserIds = await getLeadUserIdsForClub(membership.club.id, tx);
    await emailService.sendEmailForMembershipDeactivatedByMemberToLead(
      {
        membershipId: membershipId,
        memberFirstName: membership.user.firstName,
        memberLastName: membership.user.lastName,
        clubName: membership.club.name,
        clubId: membership.club.id,
        clubLeadUserIds: leadUserIds
      },
      tx
    );
  }

  async function notifyApplicationWithdrawn(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ) {
    const membership = await getMembershipWithClub(membershipId, tx);
    const leadUserIds = await getLeadUserIdsForClub(membership.club.id, tx);
    await emailService.sendEmailForApplicationWithdrawnByMemberToLead(
      {
        membershipId: membershipId,
        memberFirstName: membership.user.firstName,
        memberLastName: membership.user.lastName,
        clubName: membership.club.name,
        clubId: membership.club.id,
        clubLeadUserIds: leadUserIds
      },
      tx
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

  async function createLeadMembership(
    userId: number,
    membershipTierId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.membership.create({
        data: {
          userId: userId,
          membershipTierId: membershipTierId,
          // empty
          applicationResponses: { responses: [] },
          // no need to welcome the lead
          isWelcomed: true,
          status: "ACTIVE",
          role: "LEAD"
        },
        select: {
          id: true
        }
      });

      logger.info(
        `created lead membership for user ${userId} on membership tier with id ${membershipTierId} with membershipId ${id}`
      );
      return { createdEntityId: id };
    } catch (e) {
      logger.info(
        `failed to create lead membership for user ${userId} on membership tier with id ${membershipTierId}}`
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
    setMembershipAsWelcomed,
    createLeadMembership,
    notifyMembershipApplicationSubmitted,
    membershipStatus
  };
}
