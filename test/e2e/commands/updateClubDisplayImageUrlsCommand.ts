import { UpdateClubDisplayImageUrlsInput } from "~/server/club/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class UpdateClubDisplayImageUrlsCommand
  implements Command<SystemState, Services>
{
  private readonly input: UpdateClubDisplayImageUrlsInput;
  private readonly clubIdSelector: ItemSelector<number>;
  private clubId: Maybe<number> = null;

  constructor(
    input: UpdateClubDisplayImageUrlsInput,
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
    await r.main.updateClubDisplayImageUrls(this.clubId, this.input);
    m.updateClubDisplayImageUrls(this.clubId, this.input);
    await verifiers.verifyClub(this.clubId, r.main, m);
  }

  toString() {
    return stringify({
      UpdateClubDisplayImageUrlsCommand: {
        input: this.input,
        clubId: this.clubId
      }
    });
  }
}
