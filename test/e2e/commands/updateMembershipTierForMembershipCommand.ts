import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class UpdateMembershipTierForMembershipCommand
  implements Command<SystemState, Services>
{
  private readonly membershipIdSelector: ItemSelector<bigint>;
  private readonly newMembershipTierIdSelector: ItemSelector<number>;
  private membershipId: Maybe<bigint> = null;
  private newMembershipTierId: Maybe<number> = null;

  constructor(
    membershipIdSelector: ItemSelector<bigint>,
    newMembershipTierIdSelector: ItemSelector<number>
  ) {
    this.membershipIdSelector = membershipIdSelector;
    this.newMembershipTierIdSelector = newMembershipTierIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    const activeMembershipIds = m.getActiveMembershipIds();
    if (activeMembershipIds.length === 0) {
      return false;
    }

    // look-ahead to determine which membership will be selected
    const membershipId = this.membershipIdSelector.select(activeMembershipIds);
    const membership = m.getMembership(membershipId);
    
    // Get published tiers for the same club
    const clubId = m.getClubIdForMembershipTier(membership.membershipTierId);
    const publishedTierIds = m.getPublishedMembershipTierIdsForClub(clubId);
    
    // Filter out the current tier
    const availableTierIds = publishedTierIds.filter(
      (tierId) => tierId !== membership.membershipTierId
    );
    
    // Must have at least one other published tier to switch to
    if (availableTierIds.length === 0) {
      return false;
    }

    // Check if the club has a Stripe account (required for paid tiers)
    const newTierId = this.newMembershipTierIdSelector.select(availableTierIds);
    const newTier = m.getMembershipTier(newTierId);
    const hasStripeAccount = m.clubHasStripeAccount(clubId);
    
    // Cannot switch to paid tier without Stripe account
    if (newTier.costPerBillingInterval > 0 && !hasStripeAccount) {
      return false;
    }

    return true;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    const activeMembershipIds = m.getActiveMembershipIds();
    this.membershipId = this.membershipIdSelector.select(activeMembershipIds);
    
    const membership = m.getMembership(this.membershipId);
    const clubId = m.getClubIdForMembershipTier(membership.membershipTierId);
    const publishedTierIds = m.getPublishedMembershipTierIdsForClub(clubId);
    
    const availableTierIds = publishedTierIds.filter(
      (tierId) => tierId !== membership.membershipTierId
    );
    
    this.newMembershipTierId = this.newMembershipTierIdSelector.select(
      availableTierIds
    );

    await r.membership.updateMembershipTierForMembership(
      this.membershipId,
      this.newMembershipTierId
    );
    
    m.updateMembershipTierForMembership(this.membershipId, this.newMembershipTierId);
    
    // Verify the memberships for the user and club after the update
    const updatedMembership = m.getMembership(this.membershipId);
    await verifiers.verifyUserMemberships(updatedMembership.userId, r, m);
    await verifiers.verifyClubMemberships(updatedMembership.clubId, r, m);
  }

  toString() {
    return stringify({
      UpdateMembershipTierForMembershipCommand: {
        membershipId: this.membershipId,
        newMembershipTierId: this.newMembershipTierId
      }
    });
  }
}