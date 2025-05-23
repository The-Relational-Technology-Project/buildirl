import { Command } from "fast-check";
import { ItemSelector } from "../utils/itemSelector";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import { EmailTemplateId, EmailTemplateType } from "~/server/email/types";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Maybe } from "~/utils/types";

export default class DeleteEmailTemplateCommand
  implements Command<SystemState, Services>
{
  private readonly clubIdSelector: ItemSelector<number>;
  private readonly templateTypeSelector: ItemSelector<EmailTemplateType>;
  private emailTemplateId: Maybe<EmailTemplateId> = null;

  constructor(
    clubIdSelector: ItemSelector<number>,
    templateTypeSelector: ItemSelector<EmailTemplateType>
  ) {
    this.clubIdSelector = clubIdSelector;
    this.templateTypeSelector = templateTypeSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasEmailTemplates();
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.emailTemplateId = m.selectEmailTemplate(
      this.clubIdSelector,
      this.templateTypeSelector
    );
    await r.email.deleteEmailTemplate(this.emailTemplateId);

    m.deleteEmailTemplate(this.emailTemplateId);

    await verifiers.verifyEmailTemplate(this.emailTemplateId, r.email, m);
  }

  toString() {
    return stringify({
      DeleteEmailTemplateCommand: {
        emailTemplateId: stringify(this.emailTemplateId)
      }
    });
  }
}
