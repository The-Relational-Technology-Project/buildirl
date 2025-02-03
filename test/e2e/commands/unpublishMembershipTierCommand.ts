import { MainService } from "~/server/service/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";

export default class UnpublishMembershipTierCommand
  implements Command<SystemState, MainService>
{
  private readonly membershipTierIdSelector: ItemSelector<number>;
  private membershipTierId: Maybe<number> = null;

  constructor(membershipTierIdSelector: ItemSelector<number>) {
    this.membershipTierIdSelector = membershipTierIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasPublishedButNotLastPublishedMembershipTiers();
  }

  async run(m: SystemState, r: MainService): Promise<void> {
    this.membershipTierId = this.membershipTierIdSelector.select(
      m.getPublishedButNotLastPublishedMembershipTierIds()
    );
    await r.unpublishMembershipTier(this.membershipTierId);
    m.unpublishMembershipTier(this.membershipTierId);
    const clubId = m.getClubIdForMembershipTier(this.membershipTierId);
    // membership tier is attached to club
    await verifiers.verifyClub(clubId, r, m);
  }

  toString() {
    return stringify({
      UnpublishMembershipTierCommand: {
        membershipTierId: this.membershipTierId
      }
    });
  }
}
