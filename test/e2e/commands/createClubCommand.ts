import { CreateClubInput } from "~/server/club/types";
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
    const result = await r.club.createClub(this.input, this.userId);
    this.clubId = idAsNumber(result.createdEntityId);

    const freeMembershipTierId = await this.freeMembershipTierId(
      this.clubId,
      r
    );
    const leadMembershipId = await this.leadMembershipId(this.clubId, r);
    m.createClub(
      this.userId,
      this.clubId,
      this.input,
      freeMembershipTierId,
      leadMembershipId
    );

    await verifiers.verifyClub(this.clubId, r, m);
    await verifiers.verifyUserMemberships(this.userId, r, m);
  }

  async freeMembershipTierId(clubId: number, r: Services): Promise<number> {
    const club = await r.club.getClub(clubId);
    const freeMembershipTier = club.membershipTiers.find((mt) =>
      isDefaultFreeTier(mt)
    );
    if (!freeMembershipTier) {
      throw new Error("No free membership tier found");
    }
    return freeMembershipTier.id;
  }

  async leadMembershipId(clubId: number, r: Services): Promise<bigint> {
    const memberships = await r.membership.getActiveMembershipsForClub(
      clubId,
      false
    );
    if (memberships.length !== 1) {
      throw new Error(
        `expected only one membership after club creation but found ${stringify(memberships)}`
      );
    }
    return memberships[0]!.id;
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
