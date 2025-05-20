import { UpdateMembershipTierInput } from "~/server/service/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class UpdateMembershipTierCommand
  implements Command<SystemState, Services>
{
  private input: UpdateMembershipTierInput;
  private readonly membershipTierIdSelector: ItemSelector<number>;
  private membershipTierId: Maybe<number> = null;

  constructor(
    input: UpdateMembershipTierInput,
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
    const isUpdatingCost =
      m.getMembershipTier(membershipTierId).costPerMonthInUSD !==
      this.input.costPerMonthInUSD;
    const hasActiveMembersOrPendingApplications =
      m.hasActiveMembersOrPendingApplications(membershipTierId);
    // cannot update cost on tier with active members or pending applications
    return !(isUpdatingCost && hasActiveMembersOrPendingApplications);
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.membershipTierId = this.membershipTierIdSelector.select(
      m.getMembershipTierIds()
    );

    if (m.isDefaultFreeTier(this.membershipTierId)) {
      // a bit hacky but this keeps with constraint that
      // we cannot update the cost of the free membership tier
      this.input = { ...this.input, costPerMonthInUSD: 0 };
    }

    await r.main.updateMembershipTier(this.membershipTierId, this.input);
    m.updateMembershipTier(this.membershipTierId, this.input);
    const clubId = m.getClubIdForMembershipTier(this.membershipTierId);
    // membership tier is attached to club
    await verifiers.verifyClub(clubId, r.main, m);
  }

  toString() {
    return stringify({
      UpdateMembershipTierCommand: {
        input: this.input,
        membershipTierId: this.membershipTierId
      }
    });
  }
}
