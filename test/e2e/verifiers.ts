import {type MainService} from "~/server/service/types";
import {type SystemState} from "./systemState";
import {orderByBigIntId, orderByNumberId} from "./utils";

function createVerifiers() {
    async function verifyUser(
        userId: number,
        r: MainService,
        m: SystemState
    ) {
        const user = await r.getUser(userId);
        expect(user).toEqual(m.getUser(userId));
    }

    async function verifyClub(
        clubId: number,
        r: MainService,
        m: SystemState
    ) {
        const expected = m.getClub(clubId);
        // main entity query
        const club = await r.getClub(clubId);
        expect(club).toEqual(expected);
        // also verify query by public id
        const clubByPublicId = await r.getClubByPublicId(expected.publicId);
        expect(clubByPublicId).toEqual(expected);
    }

    async function verifyUserOwnedClub(
        userId: number,
        r: MainService,
        m: SystemState
    ) {
        const userOwnedClubs = await r.getUserOwnedClubs(userId);
        expect(orderByNumberId(userOwnedClubs)).toEqual(orderByNumberId(m.getUserOwnedClubs(userId)));
    }

    async function verifyClubMemberships(clubId: number,
                                         r: MainService,
                                         m: SystemState) {
        const memberships = await r.getActiveMembershipsForClub(clubId);
        expect(orderByBigIntId(memberships.map(m => {
            // filter out joinedAt
            return {
                id: m.id,
                user: m.user,
                club: m.club,
                membershipTier: m.membershipTier,
                status: m.status,
                applicationResponses: m.applicationResponses
            }
        }))).toEqual(orderByBigIntId(m.getActiveMembershipsForClub(clubId)));
        await verifyClubStatistics(clubId, r, m);
    }

    async function verifyClubStatistics(clubId: number,
                                        r: MainService,
                                        m: SystemState) {
        const clubStatistics = await r.getClubStatistics(clubId);
        expect(clubStatistics).toEqual(m.getClubStatistics(clubId));
    }

    async function verifyUserMemberships(userId: number,
                                         r: MainService,
                                         m: SystemState) {
        const memberships = await r.getUserMemberships(userId);
        expect(orderByBigIntId(memberships.map(m => {
            // filter out joinedAt
            return {
                id: m.id,
                user: m.user,
                club: m.club,
                membershipTier: m.membershipTier,
                status: m.status,
                applicationResponses: m.applicationResponses
            }
        }))).toEqual(orderByBigIntId(m.getUserMemberships(userId)));
    }

    return {
        verifyUser,
        verifyClub,
        verifyUserOwnedClub,
        verifyClubMemberships,
        verifyUserMemberships
    };
}

export const verifiers = createVerifiers();
