import { type Command } from "fast-check";
import { type SystemState } from "../systemState";
import { type Maybe } from "~/utils/types";
import { stringify } from "~/utils";
import { Services } from "../system.test";
import { ItemSelector } from "../utils/itemSelector";

export default class CreateStripeAccountCommand
  implements Command<SystemState, Services>
{
  private readonly clubIdSelector: ItemSelector<number>;
  private clubId: Maybe<number> = null;

  constructor(clubIdSelector: ItemSelector<number>) {
    this.clubIdSelector = clubIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.getClubIdsWithoutStripeAccounts().length > 0;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.clubId = this.clubIdSelector.select(m.getClubIdsWithStripeAccounts());
    await r.payment.createAccount({ clubId: this.clubId });
    m.setStripeAccountCreatedForClub(this.clubId);
  }

  toString() {
    return stringify({
      CreateStripeAccountCommand: {
        clubId: this.clubId
      }
    });
  }
}
