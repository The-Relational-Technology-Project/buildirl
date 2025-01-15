import { type Command } from "fast-check";
import { type SystemState } from "../systemState";
import { type CreateUserInput } from "~/server/service/types";
import { idAsNumber, type Maybe } from "~/utils/types";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import {MainService} from "~/server/service/types";

export default class CreateUserCommand
  implements Command<SystemState, MainService>
{
  private readonly input: CreateUserInput;
  private userId: Maybe<number> = null;
  private readonly authUserId: string;

  constructor(input: CreateUserInput, authUserId: string) {
    this.input = input;
    this.authUserId = authUserId;
  }

  check(m: Readonly<SystemState>): boolean {
    return true;
  }

  async run(m: SystemState, r: MainService): Promise<void> {
    const result = await r.createUser(
      this.input,
      this.authUserId
    );
    this.userId = idAsNumber(result.createdEntityId);
    m.createUser(
      this.userId,
      this.input
    );
    await verifiers.verifyUser(this.userId, r, m);
  }

  toString() {
    return stringify({
      CreateUserCommand: {
        input: this.input,
        userId: this.userId,
        authUserId: this.authUserId
      }
    });
  }
}
