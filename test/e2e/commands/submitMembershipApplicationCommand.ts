import {
  MainService,
  SubmitMembershipApplicationInput
} from "~/server/service/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { idAsBigInt, Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";

export default class SubmitMembershipApplicationCommand
  implements Command<SystemState, MainService>
{
  private readonly input: SubmitMembershipApplicationInput;
  private readonly membershipTierIdSelector: ItemSelector<number>;
  private readonly userIdSelector: ItemSelector<number>;
  private membershipTierId: Maybe<number> = null;
  private userId: Maybe<number> = null;

  constructor(
    input: SubmitMembershipApplicationInput,
    membershipTierIdSelector: ItemSelector<number>,
    userIdSelector: ItemSelector<number>
  ) {
    this.input = input;
    this.membershipTierIdSelector = membershipTierIdSelector;
    this.userIdSelector = userIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return (
      m.hasUsers() &&
      m.hasMembershipTiers() &&
      this.userIsNotOwnerAndDoesNotHaveMembershipInClub(m)
    );
  }

  private userIsNotOwnerAndDoesNotHaveMembershipInClub(
    m: Readonly<SystemState>
  ): boolean {
    // check ahead for selection, this should be deterministic between check and run
    const membershipTierId = this.membershipTierIdSelector.select(
      m.getMembershipTierIds()
    );
    const userId = this.userIdSelector.select(m.getUserIds());
    const clubId = m.getClubIdForMembershipTier(membershipTierId);
    return m.userIsNotOwnerAndDoesNotHaveMembershipInClub(userId, clubId);
  }

  async run(m: SystemState, r: MainService): Promise<void> {
    this.membershipTierId = this.membershipTierIdSelector.select(
      m.getMembershipTierIds()
    );
    this.userId = this.userIdSelector.select(m.getUserIds());
    const result = await r.submitMembershipApplication(
      this.membershipTierId,
      this.input,
      this.userId
    );
    const membershipId = idAsBigInt(result.createdEntityId);
    m.submitMembershipApplication(
      membershipId,
      this.membershipTierId,
      this.input,
      this.userId
    );

    await verifiers.verifyUserMemberships(this.userId, r, m);
    const clubId = m.getClubIdForMembershipTier(this.membershipTierId);
    await verifiers.verifyClubMemberships(clubId, r, m);
  }

  toString() {
    return stringify({
      SubmitMembershipApplicationCommand: {
        input: this.input,
        membershipTierId: this.membershipTierId,
        userId: this.userId
      }
    });
  }
}
