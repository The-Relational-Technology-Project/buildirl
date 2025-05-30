import { type Command } from "fast-check";
import { type SystemState } from "../systemState";
import { type CreateUserInput } from "~/server/user/types";
import { idAsNumber, type Maybe } from "~/utils/types";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class CreateUserCommand
  implements Command<SystemState, Services>
{
  private readonly input: CreateUserInput;
  private userId: Maybe<number> = null;
  private readonly authUserId: string;
  private readonly authEmail: string;

  constructor(input: CreateUserInput, authUserId: string, authEmail: string) {
    this.input = input;
    this.authUserId = authUserId;
    this.authEmail = authEmail;
  }

  check(_: Readonly<SystemState>): boolean {
    return true;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    const result = await r.user.createUser(
      this.input,
      this.authUserId,
      this.authEmail
    );
    this.userId = idAsNumber(result.createdEntityId);
    m.createUser(this.userId, this.input, this.authEmail);
    await verifiers.verifyUser(this.userId, r, m);
  }

  toString() {
    return stringify({
      CreateUserCommand: {
        input: this.input,
        userId: this.userId,
        authUserId: this.authUserId,
        authEmail: this.authEmail
      }
    });
  }
}
