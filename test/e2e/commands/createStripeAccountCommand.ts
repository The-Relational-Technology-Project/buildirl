import { type Command } from "fast-check";
import { type SystemState } from "../systemState";
import { type Maybe } from "~/utils/types";
import { stringify } from "~/utils";
import { Services } from "../system.test";
import { ItemSelector } from "../utils/itemSelector";

export default class CreateStripeAccountCommand
  implements Command<SystemState, Services>
{
  private readonly userIdSelector: ItemSelector<number>;
  private userId: Maybe<number> = null;

  constructor(userIdSelector: ItemSelector<number>) {
    this.userIdSelector = userIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.getUserIdsWithoutStripeAccounts().length > 0;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.userId = this.userIdSelector.select(m.getUserIdsWithoutStripeAccounts());
    await r.payment.createAccount(this.userId);
    m.setStripeAccountCreatedForUser(this.userId);
  }

  toString() {
    return stringify({
      CreateStripeAccountCommand: {
        userId: this.userId
      }
    });
  }
}