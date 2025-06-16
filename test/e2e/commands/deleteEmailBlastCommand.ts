import { Command } from "fast-check";
import { ItemSelector } from "../utils/itemSelector";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";

export default class DeleteEmailBlastCommand
  implements Command<SystemState, Services>
{
  private readonly emailBlastIdSelector: ItemSelector<bigint>;
  private emailBlastId: Maybe<bigint> = null;
  private clubId: Maybe<number> = null;

  constructor(emailBlastIdSelector: ItemSelector<bigint>) {
    this.emailBlastIdSelector = emailBlastIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasEmailBlasts();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.emailBlastId = this.emailBlastIdSelector.select(m.getEmailBlastIds());
    
    this.clubId = m.getEmailBlast(this.emailBlastId).clubId;
    
    await r.email.deleteEmailBlast(this.emailBlastId);
    m.deleteEmailBlast(this.emailBlastId);

    await verifiers.verifyEmailBlasts(this.clubId, r.email, m);
  }

  toString() {
    return stringify({
      DeleteEmailBlastCommand: {
        emailBlastId: this.emailBlastId,
        clubId: this.clubId
      }
    });
  }
} 