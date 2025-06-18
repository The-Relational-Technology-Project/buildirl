import { Command } from "fast-check";
import { ItemSelector } from "../utils/itemSelector";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import {
  SetEmailBlastInput
} from "~/server/email/types";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";

export default class SetEmailBlastCommand
  implements Command<SystemState, Services>
{
  private readonly input: SetEmailBlastInput;
  private readonly clubIdSelector: ItemSelector<number>;
  private readonly emailBlastIdSelector: ItemSelector<bigint>;
  private readonly isUpdate: boolean;
  private id: Maybe<bigint> = null;
  private clubId: Maybe<number> = null;

  constructor(
    clubIdSelector: ItemSelector<number>,
    emailBlastIdSelector: ItemSelector<bigint>,
    input: SetEmailBlastInput,
    isUpdate: boolean
  ) {
    this.input = input;
    this.clubIdSelector = clubIdSelector;
    this.emailBlastIdSelector = emailBlastIdSelector;
    this.isUpdate = isUpdate;
  }

  check(m: Readonly<SystemState>): boolean {
    if (!m.hasClubs()) {
      return false;
    }
    if (this.isUpdate) {
      return m.hasEmailBlasts();
    }
    return true;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.clubId = this.clubIdSelector.select(m.getClubIds());

    if (this.isUpdate && m.hasEmailBlasts()) {
      this.id = this.emailBlastIdSelector.select(m.getEmailBlastIds());
      const result = await r.email.setEmailBlast(this.id, this.clubId, this.input);
      this.id = result.id;
      m.updateEmailBlast(this.id, this.input);
    } else {
      const result = await r.email.setEmailBlast(undefined, this.clubId, this.input);
      this.id = result.id;
      m.createEmailBlast(this.id, this.clubId, this.input);
    }

    await verifiers.verifyEmailBlasts(this.clubId, r.email, m);
  }

  toString() {
    return stringify({
      SetEmailBlastCommand: {
        id: this.id,
        clubId: this.clubId,
        input: this.input,
        isUpdate: this.isUpdate
      }
    });
  }
} 