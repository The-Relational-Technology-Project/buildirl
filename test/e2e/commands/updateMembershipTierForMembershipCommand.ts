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
    return m.hasActiveMembershipIdsToClubWithMultipleMembershipTiers();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    const activeMembershipIds =
      m.getActiveMembershipIdsToClubWithMultipleMembershipTiers();
    this.membershipId = this.membershipIdSelector.select(activeMembershipIds);

    const membership = m.getMembershipState(this.membershipId);
    const clubId = m.getClubIdForMembershipTier(membership.membershipTierId);
    const publishedTierIds = m.getPublishedMembershipTierIdsForClub(clubId);
    const availableTierIds = publishedTierIds.filter(
      (tierId) => tierId !== membership.membershipTierId
    );
    this.newMembershipTierId =
      this.newMembershipTierIdSelector.select(availableTierIds);

    await r.membership.updateMembershipTierForMembership(
      this.membershipId,
      this.newMembershipTierId
    );

    m.updateMembershipTierForMembership(
      this.membershipId,
      this.newMembershipTierId
    );

    await verifiers.verifyUserMemberships(membership.userId, r, m);
    await verifiers.verifyClubMemberships(membership.clubId, r, m);
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
