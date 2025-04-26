import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class ApproveMembershipApplicationCommand
  implements Command<SystemState, Services>
{
  private readonly membershipIdSelector: ItemSelector<bigint>;
  private membershipId: Maybe<bigint> = null;

  constructor(membershipIdSelector: ItemSelector<bigint>) {
    this.membershipIdSelector = membershipIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.getPendingMembershipIds().length > 0;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.membershipId = this.membershipIdSelector.select(
      m.getPendingMembershipIds()
    );
    await r.main.approveMembershipApplication(this.membershipId);
    m.approveMembershipApplication(this.membershipId);
    const clubId = m.getClubIdForMembership(this.membershipId);
    await verifiers.verifyClubMemberships(clubId, r.main, m);
    await verifiers.verifyClubFollowers(clubId, r.main, m);

    const userId = m.getUserIdForMembership(this.membershipId);
    await verifiers.verifyUserMemberships(userId, r.main, m);
    await verifiers.verifyUserFollowedClubs(userId, r.main, m);
  }

  toString() {
    return stringify({
      ApproveMembershipApplicationCommand: {
        membershipId: this.membershipId
      }
    });
  }
}
