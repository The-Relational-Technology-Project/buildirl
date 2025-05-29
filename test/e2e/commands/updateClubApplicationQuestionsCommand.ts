import { UpdateClubApplicationQuestionsInput } from "~/server/club/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class UpdateClubApplicationQuestionsCommand
  implements Command<SystemState, Services>
{
  private readonly input: UpdateClubApplicationQuestionsInput;
  private readonly clubIdSelector: ItemSelector<number>;
  private clubId: Maybe<number> = null;

  constructor(
    input: UpdateClubApplicationQuestionsInput,
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
    await r.club.updateClubApplicationQuestions(this.clubId, this.input);
    m.updateClubApplicationQuestions(this.clubId, this.input);
    await verifiers.verifyClub(this.clubId, r, m);
  }

  toString() {
    return stringify({
      UpdateClubApplicationQuestionsCommand: {
        input: this.input,
        clubId: this.clubId
      }
    });
  }
}
