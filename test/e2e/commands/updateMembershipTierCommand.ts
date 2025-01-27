import { UpdateMembershipTierInput, MainService } from "~/server/service/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { isDefaultFreeTier, Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";

export default class UpdateMembershipTierCommand
  implements Command<SystemState, MainService>
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
    return m.hasEmptyMembershipTier();
  }

  private isDefaultFreeMembershipTier(
    membershipTierId: number,
    m: SystemState
  ): boolean {
    const membershipTier = m.getMembershipTier(membershipTierId);
    return isDefaultFreeTier(membershipTier);
  }

  async run(m: SystemState, r: MainService): Promise<void> {
    this.membershipTierId = this.membershipTierIdSelector.select(
      m.getEmptyMembershipTiersIds()
    );

    if (this.isDefaultFreeMembershipTier(this.membershipTierId, m)) {
      // a bit hacky but we cannot update the cost of the free membership tier
      this.input = { ...this.input, costPerMonthInUSD: 0 };
    }

    await r.updateMembershipTier(this.membershipTierId, this.input);
    m.updateMembershipTier(this.membershipTierId, this.input);
    const clubId = m.getClubIdForMembershipTier(this.membershipTierId);
    // membership tier is attached to club
    await verifiers.verifyClub(clubId, r, m);
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
