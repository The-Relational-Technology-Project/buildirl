import { Command } from "fast-check";
import { CreateMembershipCampaignInput } from "~/server/membershipCampaign/types";
import { idAsNumber, Maybe } from "~/utils/types";
import { stringify } from "~/utils";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";

export default class CreateMembershipCampaignCommand
  implements Command<SystemState, Services>
{
  private readonly input: CreateMembershipCampaignInput;
  private readonly clubIdSelector: ItemSelector<number>;
  private clubId: Maybe<number> = null;

  constructor(
    input: CreateMembershipCampaignInput,
    clubIdSelector: ItemSelector<number>
  ) {
    this.input = input;
    this.clubIdSelector = clubIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    const availableClubs = m.getClubIdsWithoutActiveCampaigns();
    return availableClubs.length > 0;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    const availableClubs = m.getClubIdsWithoutActiveCampaigns();

    this.clubId = this.clubIdSelector.select(availableClubs);

    const result = await r.membershipCampaign.createMembershipCampaign(
      this.clubId,
      this.input
    );
    const membershipCampaignId = idAsNumber(result.createdEntityId);
    m.createMembershipCampaign(
      membershipCampaignId,
      this.clubId,
      this.input
    );

    await verifiers.verifyMembershipCampaigns(this.clubId, r, m);
  }

  toString() {
    return stringify({
      CreateMembershipCampaignCommand: {
        input: this.input,
        clubId: this.clubId
      }
    });
  }
}
