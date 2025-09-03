import { Command } from "fast-check";
import { Maybe } from "~/utils/types";
import { stringify } from "~/utils";
import { SystemState } from "../systemState";
import { Services } from "../system.test";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";

export default class DeleteMembershipCampaignCommand
  implements Command<SystemState, Services>
{
  private readonly membershipCampaignIdSelector: ItemSelector<number>;
  private membershipCampaignId: Maybe<number> = null;

  constructor(campaignIdSelector: ItemSelector<number>) {
    this.membershipCampaignIdSelector = campaignIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return m.getActiveMembershipCampaignIds().length > 0;
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.membershipCampaignId = this.membershipCampaignIdSelector.select(
      m.getActiveMembershipCampaignIds()
    );

    const campaign = m.getMembershipCampaign(this.membershipCampaignId);
    await r.membershipCampaign.deleteMembershipCampaign(
      this.membershipCampaignId
    );
    m.deleteMembershipCampaign(this.membershipCampaignId);

    const clubId = m.getClubIdForMembershipTier(campaign.membershipTier.id);
    await verifiers.verifyMembershipCampaigns(clubId, r, m);
  }

  toString() {
    return stringify({
      DeleteMembershipCampaignCommand: {
        membershipCampaignId: this.membershipCampaignId
      }
    });
  }
}
