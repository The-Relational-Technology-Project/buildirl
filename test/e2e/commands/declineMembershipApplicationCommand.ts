import {MainService} from "~/server/service/types";
import {SystemState} from "../systemState";
import {Command} from "fast-check";
import {Maybe} from "~/utils/types";
import {ItemSelector} from "../utils/itemSelector";
import {verifiers} from "../verifiers";
import {stringify} from "~/utils";

export default class DeclineMembershipApplicationCommand
    implements Command<SystemState, MainService>
{
    private readonly membershipIdSelector: ItemSelector<bigint>;
    private membershipId: Maybe<bigint> = null;

    constructor(membershipIdSelector: ItemSelector<bigint>) {
        this.membershipIdSelector = membershipIdSelector
    }

    check(m: Readonly<SystemState>): boolean {
        return m.getPendingMembershipIds().length > 0;
    }

    async run(m: SystemState, r: MainService): Promise<void> {
        this.membershipId = this.membershipIdSelector.select(m.getPendingMembershipIds());
        await r.declineMembershipApplication(this.membershipId);
        m.declineMembershipApplication(this.membershipId);
        const clubId = m.getClubIdForMembership(this.membershipId);
        await verifiers.verifyClubMemberships(clubId, r, m);
        const userId = m.getUserIdForMembership(this.membershipId);
        await verifiers.verifyUserMemberships(userId, r, m);
    }

    toString() {
        return stringify({
            DeclineMembershipApplicationCommand: {
                membershipId: this.membershipId
            }
        });
    }
}