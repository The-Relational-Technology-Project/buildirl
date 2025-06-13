import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class DeleteClubCommand
  implements Command<SystemState, Services>
{
  private readonly clubIdSelector: ItemSelector<number>;
  private clubId: Maybe<number> = null;

  constructor(clubIdSelector: ItemSelector<number>) {
    this.clubIdSelector = clubIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasClubsWithNoActiveMembershipsOrMembershipApplications();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.clubId = this.clubIdSelector.select(
      m.getClubIdsWithNoActiveMembershipsOrMembershipApplications()
    );
    await r.club.deleteClub(this.clubId);
    // get this for verification before deletion
    const ownerUserId = m.getClub(this.clubId).owner.id;
    m.deleteClub(this.clubId);
    await verifiers.verifyUserMemberships(ownerUserId, r, m);
  }

  toString() {
    return stringify({
      DeleteClubCommand: {
        clubId: this.clubId
      }
    });
  }
}
