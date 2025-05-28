import { type Command } from "fast-check";
import { type SystemState } from "../systemState";
import { UpdateUserInput } from "~/server/user/types";
import { type Maybe } from "~/utils/types";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { ItemSelector } from "../utils/itemSelector";
import { Services } from "../system.test";

export default class UpdateUserCommand
  implements Command<SystemState, Services>
{
  private readonly input: UpdateUserInput;
  private readonly userIdSelector: ItemSelector<number>;
  private userId: Maybe<number> = null;

  constructor(input: UpdateUserInput, userIdSelector: ItemSelector<number>) {
    this.input = input;
    this.userIdSelector = userIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasUsers();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.userId = this.userIdSelector.select(m.getUserIds());
    await r.main.updateUser(this.userId, this.input);
    m.updateUser(this.userId, this.input);
    await verifiers.verifyUser(this.userId, r.main, m);
  }

  toString() {
    return stringify({
      UpdateUserCommand: {
        input: this.input,
        userId: this.userId
      }
    });
  }
}
