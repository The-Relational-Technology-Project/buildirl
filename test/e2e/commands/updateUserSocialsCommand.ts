import { Command } from "fast-check";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import { ItemSelector } from "../utils/itemSelector";
import { UpdateUserSocialsInput } from "~/server/user/types";

export default class UpdateUserSocialsCommand implements Command<SystemState, Services> {
  constructor(
    private input: UpdateUserSocialsInput,
    private userIdSelector: ItemSelector<number>
  ) {}

  check(state: SystemState): boolean {
    return state.hasUsers();
  }

  async run(state: SystemState, services: Services): Promise<void> {
    const userId = this.userIdSelector.select(state.getUserIds());
    
    state.updateUserSocials(userId, this.input);
    
    await services.user.updateUserSocials(userId, this.input);
  }

  toString(): string {
    return `UpdateUserSocialsCommand(${JSON.stringify(this.input)})`;
  }
}