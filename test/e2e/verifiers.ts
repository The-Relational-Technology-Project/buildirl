import {
  type Club,
  type MainService,
  type Membership,
  type User
} from "~/server/service/types";
import { type SystemState } from "./systemState";
import { orderByBigIntId, orderByNumberId } from "./utils";
import { OmitRecursively } from "~/utils/omit";

function createVerifiers() {
  function userWithoutCreatedAt(
    user: User
  ): OmitRecursively<User, "createdAt"> {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      description: user.description
    };
  }

  async function verifyUser(userId: number, r: MainService, m: SystemState) {
    const user = await r.getUser(userId);
    expect(userWithoutCreatedAt(user)).toEqual(m.getUser(userId));
  }

  function clubWithoutCreatedAt(
    club: Club
  ): OmitRecursively<Club, "createdAt"> {
    return {
      id: club.id,
      publicId: club.publicId,
      name: club.name,
      tagLine: club.tagLine,
      description: club.description,
      owner: userWithoutCreatedAt(club.owner),
      websiteURL: club.websiteURL,
      instagramHandle: club.instagramHandle,
      eventCalendarURL: club.eventCalendarURL,
      applicationQuestions: club.applicationQuestions,
      membershipTiers: club.membershipTiers
    };
  }

  async function verifyClub(clubId: number, r: MainService, m: SystemState) {
    const expected = m.getClub(clubId);
    // main entity query
    const club = await r.getClub(clubId);
    expect(clubWithoutCreatedAt(club)).toEqual(expected);
    // also verify query by public id
    const clubByPublicId = await r.getClubByPublicId(expected.publicId);
    expect(clubWithoutCreatedAt(clubByPublicId)).toEqual(expected);
  }

  async function verifyUserOwnedClub(
    userId: number,
    r: MainService,
    m: SystemState
  ) {
    const userOwnedClubs = await r.getUserOwnedClubs(userId);
    expect(
      orderByNumberId(userOwnedClubs.map((c) => clubWithoutCreatedAt(c)))
    ).toEqual(orderByNumberId(m.getUserOwnedClubs(userId)));
  }

  async function verifyClubMemberships(
    clubId: number,
    r: MainService,
    m: SystemState
  ) {
    await verifyActiveMembershipsForClub(clubId, r, m);
    await verifyMembershipApplicationsForClub(clubId, r, m);
    await verifyClubStatistics(clubId, r, m);
  }

  function membershipWithoutCreatedAt(
    membership: Membership
  ): OmitRecursively<Membership, "createdAt"> {
    // filter out createdAt
    return {
      id: membership.id,
      user: userWithoutCreatedAt(membership.user),
      club: clubWithoutCreatedAt(membership.club),
      membershipTier: membership.membershipTier,
      status: membership.status,
      applicationResponses: membership.applicationResponses
    };
  }

  async function verifyActiveMembershipsForClub(
    clubId: number,
    r: MainService,
    m: SystemState
  ) {
    const memberships = await r.getActiveMembershipsForClub(clubId);
    expect(
      orderByBigIntId(memberships.map((m) => membershipWithoutCreatedAt(m)))
    ).toEqual(orderByBigIntId(m.getActiveMembershipsForClub(clubId)));
  }

  async function verifyMembershipApplicationsForClub(
    clubId: number,
    r: MainService,
    m: SystemState
  ) {
    const memberships = await r.getMembershipApplicationsForClub(clubId);
    expect(
      orderByBigIntId(memberships.map((m) => membershipWithoutCreatedAt(m)))
    ).toEqual(orderByBigIntId(m.getMembershipApplicationsForClub(clubId)));
  }

  async function verifyClubStatistics(
    clubId: number,
    r: MainService,
    m: SystemState
  ) {
    const clubStatistics = await r.getClubStatistics(clubId);
    expect(clubStatistics).toEqual(m.getClubStatistics(clubId));
  }

  async function verifyUserMemberships(
    userId: number,
    r: MainService,
    m: SystemState
  ) {
    const memberships = await r.getUserMemberships(userId);
    expect(
      orderByBigIntId(memberships.map((m) => membershipWithoutCreatedAt(m)))
    ).toEqual(orderByBigIntId(m.getUserMemberships(userId)));
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
