import { Command } from "fast-check";
import { ItemSelector } from "../utils/itemSelector";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";

export default class SendEmailBlastCommand
  implements Command<SystemState, Services>
{
  private readonly emailBlastIdSelector: ItemSelector<bigint>;
  private emailBlastId: Maybe<bigint> = null;
  private clubId: Maybe<number> = null;

  constructor(emailBlastIdSelector: ItemSelector<bigint>) {
    this.emailBlastIdSelector = emailBlastIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasEmailBlastsWithStatus("DRAFT");
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.emailBlastId = this.emailBlastIdSelector.select(m.getDraftEmailBlastIds());
    
    this.clubId = m.getEmailBlast(this.emailBlastId).clubId;
    
    await r.email.sendEmailBlast(this.emailBlastId);
    m.sendEmailBlast(this.emailBlastId);

    await verifiers.verifyEmailBlast(this.emailBlastId, r.email, m);
    await verifiers.verifyEmailBlasts(this.clubId, r.email, m);
  }

  toString() {
    return stringify({
      SendEmailBlastCommand: {
        emailBlastId: this.emailBlastId,
        clubId: this.clubId
      }
    });
  }
} 