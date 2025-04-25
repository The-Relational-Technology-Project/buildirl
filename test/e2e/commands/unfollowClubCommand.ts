import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class UnfollowClubCommand
  implements Command<SystemState, Services>
{
  private readonly clubIdSelector: ItemSelector<number>;
  private readonly userIdSelector: ItemSelector<number>;
  private clubId: Maybe<number> = null;
  private userId: Maybe<number> = null;

  constructor(
    clubIdSelector: ItemSelector<number>,
    userIdSelector: ItemSelector<number>
  ) {
    this.clubIdSelector = clubIdSelector;
    this.userIdSelector = userIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasClubFollowings();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    // we do not select for the idempotent case of unfollowing
    // an already non-existent club following
    // it is too much and not testing much

    this.clubId = this.clubIdSelector.select(m.getFollowedClubIds());
    this.userId = this.userIdSelector.select(
      m.getFollowingUserIdsForClub(this.clubId)
    );

    await r.main.unfollowClub(this.userId, this.clubId);

    m.unfollowClub(this.userId, this.clubId);

    await verifiers.verifyUserFollowedClubs(this.userId, r.main, m);
    await verifiers.verifyClubFollowers(this.clubId, r.main, m);
  }

  toString() {
    return stringify({
      UnfollowClubCommand: {
        clubId: this.clubId,
        userId: this.userId
      }
    });
  }
}
