import { Command } from "fast-check";
import { ItemSelector } from "../utils/itemSelector";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import {
  EmailTemplateId,
  EmailTemplateType,
  SetEmailTemplateInput
} from "~/server/email/types";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";

export default class SetEmailTemplateCommand
  implements Command<SystemState, Services>
{
  private readonly input: SetEmailTemplateInput;
  private readonly clubIdSelector: ItemSelector<number>;
  private readonly templateType: EmailTemplateType;
  private id: Maybe<EmailTemplateId> = null;

  constructor(
    clubIdSelector: ItemSelector<number>,
    templateType: EmailTemplateType,
    input: SetEmailTemplateInput
  ) {
    this.input = input;
    this.clubIdSelector = clubIdSelector;
    this.templateType = templateType;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasClubs();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    const clubId = this.clubIdSelector.select(m.getClubIds());

    this.id = { clubId: clubId, type: this.templateType };
    await r.email.setEmailTemplate(this.id, this.input);

    m.setEmailTemplate(this.id, this.input);

    await verifiers.verifyEmailTemplate(this.id, r.email, m);
  }

  toString() {
    return stringify({
      SetEmailTemplateCommand: {
        emailTemplateId: this.id,
        input: this.input
      }
    });
  }
}
