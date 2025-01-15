import {CreateClubInput, MainService} from "~/server/service/types";
import {SystemState} from "../systemState";
import {Command} from "fast-check";
import {idAsNumber, Maybe} from "~/utils/types";
import {ItemSelector} from "../utils/itemSelector";
import {verifiers} from "../verifiers";
import {stringify} from "~/utils";

export default class CreateClubCommand
  implements Command<SystemState, MainService>
{
  private readonly input: CreateClubInput;
  private readonly userIdSelector: ItemSelector<number>;
  private userId: Maybe<number> = null;
  private clubId: Maybe<number> = null;

  constructor(input: CreateClubInput, userIdSelector: ItemSelector<number>) {
    this.input = input;
    this.userIdSelector = userIdSelector
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasUsers();
  }

  async run(m: SystemState, r: MainService): Promise<void> {
    this.userId = this.userIdSelector.select(m.getUserIds());
    const result = await r.createClub(
      this.input,
      this.userId
    );
    this.clubId = idAsNumber(result.createdEntityId);
    m.createClub(this.userId, this.clubId, this.input);
    await verifiers.verifyClub(this.clubId, r, m);
  }

  toString() {
    return stringify({
      CreateClubCommand: {
        input: this.input,
        userId: this.userId,
        clubId: this.clubId
      }
    });
  }
}