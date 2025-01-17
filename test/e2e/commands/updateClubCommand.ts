import { MainService, UpdateClubInput } from "~/server/service/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";

export default class UpdateClubCommand
  implements Command<SystemState, MainService>
{
  private readonly input: UpdateClubInput;
  private readonly clubIdSelector: ItemSelector<number>;
  private clubId: Maybe<number> = null;

  constructor(input: UpdateClubInput, clubIdSelector: ItemSelector<number>) {
    this.input = input;
    this.clubIdSelector = clubIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasClubs() && m.isNotClubPublicIdUsed(this.input.publicId);
  }

  async run(m: SystemState, r: MainService): Promise<void> {
    this.clubId = this.clubIdSelector.select(m.getClubIds());
    await r.updateClub(this.clubId, this.input);
    m.updateClub(this.clubId, this.input);
    await verifiers.verifyClub(this.clubId, r, m);
  }

  toString() {
    return stringify({
      UpdateClubCommand: {
        input: this.input,
        clubId: this.clubId
      }
    });
  }
}
