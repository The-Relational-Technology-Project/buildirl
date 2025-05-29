import { CreateMembershipTierInput } from "~/server/membershipTier/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { idAsNumber, Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class CreateMembershipTierCommand
  implements Command<SystemState, Services>
{
  private readonly input: CreateMembershipTierInput;
  private readonly clubIdSelector: ItemSelector<number>;
  private clubId: Maybe<number> = null;
  private membershipTierId: Maybe<number> = null;

  constructor(
    input: CreateMembershipTierInput,
    clubIdSelector: ItemSelector<number>
  ) {
    this.input = input;
    this.clubIdSelector = clubIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.getClubIdsWithStripeAccounts().length > 0;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.clubId = this.clubIdSelector.select(m.getClubIdsWithStripeAccounts());
    const result = await r.membershipTier.createMembershipTier(
      this.clubId,
      this.input
    );
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
