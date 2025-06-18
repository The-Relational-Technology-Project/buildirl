import { Command } from "fast-check";
import { ItemSelector } from "../utils/itemSelector";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import { EmailBlastInput } from "~/server/email/types";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";

export default class CreateEmailBlastCommand
  implements Command<SystemState, Services>
{
  private readonly input: EmailBlastInput;
  private readonly clubIdSelector: ItemSelector<number>;
  private emailBlastId: Maybe<bigint> = null;
  private clubId: Maybe<number> = null;

  constructor(
    input: EmailBlastInput,
    clubIdSelector: ItemSelector<number>
  ) {
    this.input = input;
    this.clubIdSelector = clubIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasClubs();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.clubId = this.clubIdSelector.select(m.getClubIds());
    const result = await r.email.createEmailBlast(this.clubId, this.input);
    this.emailBlastId = result.id;
    m.createEmailBlast(this.emailBlastId, this.clubId, this.input);
    await verifiers.verifyEmailBlasts(this.clubId, r.email, m);
  }

  toString() {
    return stringify({
      CreateEmailBlastCommand: {
        emailBlastId: this.emailBlastId,
        clubId: this.clubId,
        input: this.input
      }
    });
  }
} 