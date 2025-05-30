import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";
import { DeactivateMembershipInput } from "~/server/membership/types";

export default class DeactivateMembershipCommand
  implements Command<SystemState, Services>
{
  private readonly membershipIdSelector: ItemSelector<bigint>;
  private readonly input: DeactivateMembershipInput;
  private membershipId: Maybe<bigint> = null;

  constructor(
    membershipIdSelector: ItemSelector<bigint>,
    input: DeactivateMembershipInput
  ) {
    this.membershipIdSelector = membershipIdSelector;
    this.input = input;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.getActiveMembershipIds().length > 0;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.membershipId = this.membershipIdSelector.select(
      m.getActiveMembershipIds()
    );
    await r.membership.deactivateMembership(this.membershipId, {
      byClubOwner: this.input.byClubOwner
    });
    m.deactivateMembership(this.membershipId);
    const clubId = m.getClubIdForMembership(this.membershipId);
    await verifiers.verifyClubMemberships(clubId, r, m);
    const userId = m.getUserIdForMembership(this.membershipId);
    await verifiers.verifyUserMemberships(userId, r, m);
  }

  toString() {
    return stringify({
      DeactivateMembershipCommand: {
        membershipId: this.membershipId,
        input: this.input
      }
    });
  }
}
