import { SubmitMembershipApplicationInput } from "~/server/membership/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { CheckoutFlowType, idAsBigInt, Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";
import { setupIntent, uniqueSetupIntentId } from "../utils/mockData";

export default class SubmitMembershipApplicationCommand
  implements Command<SystemState, Services>
{
  private readonly input: SubmitMembershipApplicationInput;
  private readonly membershipTierIdSelector: ItemSelector<number>;
  private readonly userIdSelector: ItemSelector<number>;
  private membershipTierId: Maybe<number> = null;
  private userId: Maybe<number> = null;

  constructor(
    input: SubmitMembershipApplicationInput,
    membershipTierIdSelector: ItemSelector<number>,
    userIdSelector: ItemSelector<number>
  ) {
    this.input = input;
    this.membershipTierIdSelector = membershipTierIdSelector;
    this.userIdSelector = userIdSelector;
  }

  check(m: Readonly<SystemState>): boolean {
    return (
      m.hasUsers() &&
      m.hasPublishedMembershipTiers() &&
      this.userIsNotLeadAndDoesNotHaveActiveMembershipInClub(m)
    );
  }

  private userIsNotLeadAndDoesNotHaveActiveMembershipInClub(
    m: Readonly<SystemState>
  ): boolean {
    // check ahead for selection, this should be deterministic between check and run
    const membershipTierId = this.membershipTierIdSelector.select(
      m.getPublishedMembershipTierIds()
    );
    const userId = this.userIdSelector.select(m.getUserIds());
    const clubId = m.getClubIdForMembershipTier(membershipTierId);
    return m.userDoesNotHaveActiveMembershipInClub(userId, clubId);
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.membershipTierId = this.membershipTierIdSelector.select(
      m.getPublishedMembershipTierIds()
    );
    this.userId = this.userIdSelector.select(m.getUserIds());
    const result = await r.membership.submitMembershipApplication(
      this.membershipTierId,
      this.input,
      this.userId
    );

    const membershipId = idAsBigInt(result.createdEntityId);

    // we also process a mock checkout session to test that code path
    // as well as maintain data consistency that memberships have associated
    // setup intents
    if (!m.isDefaultFreeTier(this.membershipTierId)) {
      await r.paymentEvents.onSetupIntentSuccess(
        // we don't care what the setup intent id is just that it is unique
        // since we aren't verifying or driving any logic of its exact value
        setupIntent(
          uniqueSetupIntentId(),
          membershipId.toString(),
          CheckoutFlowType.APPLICATION
        )
      );
    }

    m.submitMembershipApplication(
      membershipId,
      this.membershipTierId,
      this.input,
      this.userId
    );

    await verifiers.verifyUserMemberships(this.userId, r, m);
    const clubId = m.getClubIdForMembershipTier(this.membershipTierId);
    await verifiers.verifyClubMemberships(clubId, r, m);

    if (m.hasActiveMembershipCampaign(clubId)) {
      const launchDate = m.getActiveMembershipCampaign(clubId)!.launchDate;
      await verifiers.verifyMembershipCampaignProgress(
        clubId,
        launchDate,
        r,
        m
      );
    }
  }

  toString() {
    return stringify({
      SubmitMembershipApplicationCommand: {
        input: this.input,
        membershipTierId: this.membershipTierId,
        userId: this.userId
      }
    });
  }
}
