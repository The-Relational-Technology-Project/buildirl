import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class DeactivateMembershipCommand
  implements Command<SystemState, Services>
{
  private readonly membershipIdSelector: ItemSelector<bigint>;
  private membershipId: Maybe<bigint> = null;

  constructor(membershipIdSelector: ItemSelector<bigint>) {
    this.membershipIdSelector = membershipIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.getActiveMembershipIds().length > 0;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.membershipId = this.membershipIdSelector.select(
      m.getActiveMembershipIds()
    );
    await r.main.deactivateMembership(this.membershipId);
    m.deactivateMembership(this.membershipId);
    const clubId = m.getClubIdForMembership(this.membershipId);
    await verifiers.verifyClubMemberships(clubId, r.main, m);
    const userId = m.getUserIdForMembership(this.membershipId);
    await verifiers.verifyUserMemberships(userId, r.main, m);
  }

  toString() {
    return stringify({
      DeactivateMembershipCommand: {
        membershipId: this.membershipId
      }
    });
  }
}
