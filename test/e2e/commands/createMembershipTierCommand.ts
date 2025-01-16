import {CreateMembershipTierInput, MainService} from "~/server/service/types";
import {SystemState} from "../systemState";
import {Command} from "fast-check";
import {idAsNumber, Maybe} from "~/utils/types";
import {ItemSelector} from "../utils/itemSelector";
import {verifiers} from "../verifiers";
import {stringify} from "~/utils";

export default class CreateMembershipTierCommand
  implements Command<SystemState, MainService>
{
  private readonly input: CreateMembershipTierInput;
  private readonly clubIdSelector: ItemSelector<number>;
  private clubId: Maybe<number> = null;
  private membershipTierId: Maybe<number> = null;

  constructor(input: CreateMembershipTierInput, clubIdSelector: ItemSelector<number>) {
    this.input = input;
    this.clubIdSelector = clubIdSelector
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasClubs();
  }

  async run(m: SystemState, r: MainService): Promise<void> {
    this.clubId = this.clubIdSelector.select(m.getClubIds());
    const result = await r.createMembershipTier(this.clubId, this.input);
    this.membershipTierId = idAsNumber(result.createdEntityId);
    m.createMembershipTier(this.membershipTierId, this.clubId, this.input);
    // membership tier is attached to club
    await verifiers.verifyClub(this.clubId, r, m);
  }

  toString() {
    return stringify({
      CreateMembershipTierCommand: {
        input: this.input,
        clubId: this.clubId,
        membershipTierId: this.membershipTierId
      }
    });
  }
}