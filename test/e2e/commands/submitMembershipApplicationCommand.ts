import { SubmitMembershipApplicationInput } from "~/server/service/types";
import { SystemState } from "../systemState";
import { Command } from "fast-check";
import { idAsBigInt, Maybe } from "~/utils/types";
import { ItemSelector } from "../utils/itemSelector";
import { verifiers } from "../verifiers";
import { stringify } from "~/utils";
import { Services } from "../system.test";
import { setupCheckoutSession, uniqueSetupIntentId } from "../utils/mockData";

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
      this.userIsNotOwnerAndDoesNotHaveActiveMembershipInClub(m)
    );
  }

  private userIsNotOwnerAndDoesNotHaveActiveMembershipInClub(
    m: Readonly<SystemState>
  ): boolean {
    // check ahead for selection, this should be deterministic between check and run
    const membershipTierId = this.membershipTierIdSelector.select(
      m.getPublishedMembershipTierIds()
    );
    const userId = this.userIdSelector.select(m.getUserIds());
    const clubId = m.getClubIdForMembershipTier(membershipTierId);
    return m.userIsNotOwnerAndDoesNotHaveActiveMembershipInClub(userId, clubId);
  }

  async run(m: SystemState, r: Services): Promise<void> {
    this.membershipTierId = this.membershipTierIdSelector.select(
      m.getPublishedMembershipTierIds()
    );
    this.userId = this.userIdSelector.select(m.getUserIds());
    const result = await r.main.submitMembershipApplication(
      this.membershipTierId,
      this.input,
      this.userId
    );

    const membershipId = idAsBigInt(result.createdEntityId);

    // we also process a mock checkout session to test that code path
    // as well as maintain data consistency that memberships have associated
    // setup intents
    await r.paymentEvents.onCheckoutSessionCompleted(
      // we don't care what the setup intent id is just that it is unique
      // since we aren't verifying or driving any logic of its exact value
      setupCheckoutSession(uniqueSetupIntentId(), membershipId.toString())
    );

    m.submitMembershipApplication(
      membershipId,
      this.membershipTierId,
      this.input,
      this.userId
    );

    await verifiers.verifyUserMemberships(this.userId, r.main, m);
    const clubId = m.getClubIdForMembershipTier(this.membershipTierId);
    await verifiers.verifyClubMemberships(clubId, r.main, m);
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
