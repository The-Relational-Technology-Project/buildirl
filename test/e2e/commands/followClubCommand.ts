import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class FollowClubCommand
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
    return (
      m.hasUsers() &&
      m.hasClubs() &&
      this.userIsNotOwnerAndDoesNotHaveActiveMembershipInClub(m)
    );
  }

  private userIsNotOwnerAndDoesNotHaveActiveMembershipInClub(
    m: Readonly<SystemState>
  ): boolean {
    // check ahead for selection, this should be deterministic between check and run
    const clubId = this.clubIdSelector.select(m.getClubIds());
    const userId = this.userIdSelector.select(m.getUserIds());
    return m.userIsNotOwnerAndDoesNotHaveActiveMembershipInClub(userId, clubId);
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.clubId = this.clubIdSelector.select(m.getClubIds());
    this.userId = this.userIdSelector.select(m.getUserIds());

    await r.following.followClub(this.userId, this.clubId);
    m.followClub(this.userId, this.clubId);

    await verifiers.verifyUserFollowedClubs(this.userId, r, m);
    await verifiers.verifyClubFollowers(this.clubId, r, m);
  }

  toString() {
    return stringify({
      FollowClubCommand: {
        clubId: this.clubId,
        userId: this.userId
      }
    });
  }
}
