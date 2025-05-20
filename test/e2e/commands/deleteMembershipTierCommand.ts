import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class DeleteMembershipTierCommand
  implements Command<SystemState, Services>
{
  private readonly membershipTierIdSelector: ItemSelector<number>;
  private membershipTierId: Maybe<number> = null;

  constructor(membershipTierIdSelector: ItemSelector<number>) {
    this.membershipTierIdSelector = membershipTierIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasPaidMembershipTierWithNoActiveMembersOrPendingApplicationsThatAreNotLastPublished();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.membershipTierId = this.membershipTierIdSelector.select(
      m.getPaidMembershipTierIdsWithNoActiveMembersOrPendingApplicationsThatAreNotLastPublished()
    );
    await r.main.deleteMembershipTier(this.membershipTierId);
    // must get this value before deleting
    const clubId = m.getClubIdForMembershipTier(this.membershipTierId);
    m.deleteMembershipTier(this.membershipTierId);
    // membership tier is attached to club
    await verifiers.verifyClub(clubId, r.main, m);
  }

  toString() {
    return stringify({
      DeleteMembershipTierCommand: {
        membershipTierId: this.membershipTierId
      }
    });
  }
}
