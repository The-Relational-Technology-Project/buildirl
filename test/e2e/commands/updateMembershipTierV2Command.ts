import { UpdateMembershipTierInputV2 } from "~/server/membershipTier/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class UpdateMembershipTierV2Command
  implements Command<SystemState, Services>
{
  private input: UpdateMembershipTierInputV2;
  private readonly membershipTierIdSelector: ItemSelector<number>;
  private membershipTierId: Maybe<number> = null;

  constructor(
    input: UpdateMembershipTierInputV2,
    membershipTierIdSelector: ItemSelector<number>
  ) {
    this.input = input;
    this.membershipTierIdSelector = membershipTierIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    if (m.getMembershipTierIds().length === 0) {
      return false;
    }
    // look-ahead, this is deterministic with what will be chosen at runtime
    const membershipTierId = this.membershipTierIdSelector.select(
      m.getMembershipTierIds()
    );
    return (
      this.isNotUpdatingCostOnTierWithActiveOrPendingMembers(
        m,
        membershipTierId
      ) &&
      this.isNotUpdatingInitiationFeeCostOnTierWithPendingMembers(
        m,
        membershipTierId
      )
    );
  }

  isNotUpdatingCostOnTierWithActiveOrPendingMembers(
    m: Readonly<SystemState>,
    membershipTierId: number
  ) {
    // For V2, check against the effective cost (fallback logic)
    const currentTier = m.getMembershipTier(membershipTierId);
    const currentCost = currentTier.costPerBillingInterval ?? currentTier.costPerMonthInUSD;
    const isUpdatingCost = currentCost !== this.input.costPerBillingInterval;
    const hasActiveMembersOrPendingApplications =
      m.hasActiveMembersOrPendingApplications(membershipTierId);
    // cannot update cost on tier with active members or pending applications
    return !(isUpdatingCost && hasActiveMembersOrPendingApplications);
  }

  isNotUpdatingInitiationFeeCostOnTierWithPendingMembers(
    m: Readonly<SystemState>,
    membershipTierId: number
  ) {
    const isUpdatingInitiationFeeCost =
      m.getMembershipTier(membershipTierId).initiationFeeCostInUSD !==
      this.input.initiationFeeCostInUSD;
    const hasPendingApplications = m.hasPendingApplications(membershipTierId);
    // cannot update cost on tier with active members or pending applications
    return !(isUpdatingInitiationFeeCost && hasPendingApplications);
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.membershipTierId = this.membershipTierIdSelector.select(
      m.getMembershipTierIds()
    );

    if (m.isDefaultFreeTier(this.membershipTierId)) {
        // a bit hacky but this keeps with constraint that
       // we cannot update the cost of the free membership tier
      this.input = { ...this.input, costPerBillingInterval: 0 };
    }

    await r.membershipTier.updateMembershipTierV2(
      this.membershipTierId,
      this.input
    );
    
    m.updateMembershipTierV2(this.membershipTierId, this.input);
    
    const clubId = m.getClubIdForMembershipTier(this.membershipTierId);
    // membership tier is attached to club
    await verifiers.verifyClub(clubId, r, m);
  }

  toString() {
    return stringify({
      UpdateMembershipTierV2Command: {
        input: this.input,
        membershipTierId: this.membershipTierId
      }
    });
  }
} 