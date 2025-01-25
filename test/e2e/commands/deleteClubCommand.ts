import { MainService, UpdateClubInput } from "~/server/service/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";

export default class DeleteClubCommand
  implements Command<SystemState, MainService>
{
  private readonly clubIdSelector: ItemSelector<number>;
  private clubId: Maybe<number> = null;

  constructor(clubIdSelector: ItemSelector<number>) {
    this.clubIdSelector = clubIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasClubsWithNoMemberships();
  }

  async run(m: SystemState, r: MainService): Promise<void> {
    this.clubId = this.clubIdSelector.select(m.getClubIdsWithNoMemberships());
    await r.deleteClub(this.clubId);
    // get this for verification before deletion
    const ownerUserId = m.getClub(this.clubId).owner.id;
    m.deleteClub(this.clubId);
    await verifiers.verifyUserOwnedClub(ownerUserId, r, m);
  }

  toString() {
    return stringify({
      DeleteClubCommand: {
        clubId: this.clubId
      }
    });
  }
}
