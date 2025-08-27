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
  private readonly membershipTierIdSelector: ItemSelector<number>;
  private membershipTierId: Maybe<number> = null;

  constructor(
    input: CreateMembershipCampaignInput,
    membershipTierIdSelector: ItemSelector<number>
  ) {
    this.input = input;
    this.membershipTierIdSelector = membershipTierIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    const availablePaidTiers =
      m.getPaidMembershipTierIdsFromClubsWithoutActiveCampaigns();
    return availablePaidTiers.length > 0;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    const availablePaidTiers =
      m.getPaidMembershipTierIdsFromClubsWithoutActiveCampaigns();

    this.membershipTierId =
      this.membershipTierIdSelector.select(availablePaidTiers);

    const result = await r.membershipCampaign.createMembershipCampaign(
      this.membershipTierId,
      this.input
    );
    const membershipCampaignId = idAsNumber(result.createdEntityId);
    m.createMembershipCampaign(
      membershipCampaignId,
      this.membershipTierId,
      this.input
    );

    const clubId = m.getClubIdForMembershipTier(this.membershipTierId);
    await verifiers.verifyMembershipCampaigns(clubId, r, m);
  }

  toString() {
    return stringify({
      CreateMembershipCampaignCommand: {
        input: this.input,
        membershipTierId: this.membershipTierId
      }
    });
  }
}
