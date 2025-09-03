import { Command } from "fast-check";
import { UpdateMembershipCampaignInput } from "~/server/membershipCampaign/types";
import { Maybe } from "~/utils/types";
import { stringify } from "~/utils";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";

export default class UpdateMembershipCampaignCommand
  implements Command<SystemState, Services>
{
  private readonly input: UpdateMembershipCampaignInput;
  private readonly membershipCampaignIdSelector: ItemSelector<number>;
  private membershipCampaignId: Maybe<number> = null;

  constructor(
    input: UpdateMembershipCampaignInput,
    membershipCampaignIdSelector: ItemSelector<number>
  ) {
    this.input = input;
    this.membershipCampaignIdSelector = membershipCampaignIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.getActiveMembershipCampaignIds().length > 0;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.membershipCampaignId = this.membershipCampaignIdSelector.select(
      m.getActiveMembershipCampaignIds()
    );

    const campaign = m.getMembershipCampaign(this.membershipCampaignId);
    await r.membershipCampaign.updateMembershipCampaign(
      this.membershipCampaignId,
      this.input
    );
    m.updateMembershipCampaign(this.membershipCampaignId, this.input);

    const clubId = m.getClubIdForMembershipTier(campaign.membershipTier.id);
    await verifiers.verifyMembershipCampaigns(clubId, r, m);
  }

  toString() {
    return stringify({
      UpdateMembershipCampaignCommand: {
        input: this.input,
        membershipCampaignId: this.membershipCampaignId
      }
    });
  }
}
