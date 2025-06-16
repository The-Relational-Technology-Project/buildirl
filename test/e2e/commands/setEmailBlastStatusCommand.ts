import { Command } from "fast-check";
import { ItemSelector } from "../utils/itemSelector";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import { EmailBlastStatus } from "~/server/email/types";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";

export default class SetEmailBlastStatusCommand
  implements Command<SystemState, Services>
{
  private readonly emailBlastIdSelector: ItemSelector<bigint>;
  private readonly status: EmailBlastStatus;
  private emailBlastId: Maybe<bigint> = null;
  private clubId: Maybe<number> = null;

  constructor(
    emailBlastIdSelector: ItemSelector<bigint>,
    status: EmailBlastStatus
  ) {
    this.emailBlastIdSelector = emailBlastIdSelector;
    this.status = status;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasEmailBlasts();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.emailBlastId = this.emailBlastIdSelector.select(m.getEmailBlastIds());
    
    this.clubId = m.getEmailBlast(this.emailBlastId).clubId;
    
    await r.email.setEmailBlastStatus(this.emailBlastId, this.status);
    m.setEmailBlastStatus(this.emailBlastId, this.status);

    await verifiers.verifyEmailBlast(this.emailBlastId, r.email, m);
    await verifiers.verifyEmailBlasts(this.clubId, r.email, m);
  }

  toString() {
    return stringify({
      SetEmailBlastStatusCommand: {
        emailBlastId: this.emailBlastId,
        status: this.status,
        clubId: this.clubId
      }
    });
  }
} 