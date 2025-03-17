import { CreateClubInput } from "~/server/service/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { idAsNumber, isDefaultFreeTier, Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";

export default class CreateClubCommand
  implements Command<SystemState, Services>
{
  private readonly input: CreateClubInput;
  private readonly userIdSelector: ItemSelector<number>;
  private userId: Maybe<number> = null;
  private clubId: Maybe<number> = null;

  constructor(input: CreateClubInput, userIdSelector: ItemSelector<number>) {
    this.input = input;
    this.userIdSelector = userIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.hasUsers() && m.isNotClubPublicIdUsed(this.input.publicId);
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.userId = this.userIdSelector.select(m.getUserIds());
    const result = await r.main.createClub(this.input, this.userId);
    this.clubId = idAsNumber(result.createdEntityId);

    const freeMembershipTierId = await this.freeMembershipTierId(
      this.clubId,
      r
    );
    m.createClub(this.userId, this.clubId, this.input, freeMembershipTierId);

    await verifiers.verifyClub(this.clubId, r.main, m);
    await verifiers.verifyUserOwnedClub(this.userId, r.main, m);
  }

  async freeMembershipTierId(clubId: number, r: Services): Promise<number> {
    const club = await r.main.getClub(clubId);
    const freeMembershipTier = club.membershipTiers.find((mt) =>
      isDefaultFreeTier(mt)
    );
    if (!freeMembershipTier) {
      throw new Error("No free membership tier found");
    }
    return freeMembershipTier.id;
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
