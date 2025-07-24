import { Command } from "fast-check";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import { ItemSelector } from "../utils/itemSelector";
import { UpdateUserSocialsInput } from "~/server/user/types";
import { verifiers } from "../verifiers";
import { Maybe } from "~/utils/types";
import { stringify } from "~/utils";

export default class UpdateUserSocialsCommand implements Command<SystemState, Services> {
  private readonly input: UpdateUserSocialsInput;
  private readonly userIdSelector: ItemSelector<number>;
  private userId: Maybe<number> = null;

  constructor(input: UpdateUserSocialsInput, userIdSelector: ItemSelector<number>) {
    this.input = input;
    this.userIdSelector = userIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasUsers();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.userId = this.userIdSelector.select(m.getUserIds());
    
    await r.user.updateUserSocials(this.userId, this.input);
    m.updateUserSocials(this.userId, this.input);
    
    await verifiers.verifyUser(this.userId, r, m);
  }

  toString(): string {
    return stringify({
      UpdateUserSocialsCommand: {
        input: this.input,
        userId: this.userId
      }
    });
  }
}