import { type Membership, MembershipWithClub } from "~/server/membership/types";
import { type SystemState } from "./systemState";
import { orderByBigIntId, orderByNumberId } from "./utils";
import { OmitRecursively } from "~/utils/omit";
import {
  EmailService,
  EmailTemplateId,
  EmailBlast
} from "~/server/email/types";
import { User } from "~/server/user/types";
import { Club } from "~/server/club/types";
import { Services } from "./system.test";

function createVerifiers() {
  function userWithoutCreatedAt(
    user: User
  ): OmitRecursively<User, "createdAt"> {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      description: user.description,
      socials: user.socials
    };
  }

  async function verifyUser(userId: number, r: Services, m: SystemState) {
    const user = await r.user.getUser(userId);
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
      location: club.location,
      rhythm: club.rhythm,
      description: club.description,
      websiteUrl: club.websiteUrl,
      instagramHandle: club.instagramHandle,
      eventCalendarUrl: club.eventCalendarUrl,
      applicationQuestions: club.applicationQuestions,
      theme: club.theme,
      themeHeadingFont: club.themeHeadingFont,
      displayImageUrls: club.displayImageUrls,
      faqs: club.faqs,
      membershipTiers: club.membershipTiers
    };
  }

  async function verifyClub(clubId: number, r: Services, m: SystemState) {
    const expected = m.getClub(clubId);
    // main entity query
    const club = await r.club.getClub(clubId);
    expect(clubWithoutCreatedAt(club)).toEqual(expected);
    // also verify query by public id
    const clubByPublicId = await r.club.getClubByPublicId(expected.publicId);
    expect(clubWithoutCreatedAt(clubByPublicId)).toEqual(expected);
  }

  async function verifyClubMemberships(
    clubId: number,
    r: Services,
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
      membershipTier: membership.membershipTier,
      status: membership.status,
      applicationResponses: membership.applicationResponses,
      email: membership.email,
      role: membership.role,
      isWelcomed: membership.isWelcomed
    };
  }

  function membershipWithClubWithoutCreatedAt(
    membership: MembershipWithClub
  ): OmitRecursively<MembershipWithClub, "createdAt"> {
    // filter out createdAt
    return {
      id: membership.id,
      user: userWithoutCreatedAt(membership.user),
      club: clubWithoutCreatedAt(membership.club),
      membershipTier: membership.membershipTier,
      status: membership.status,
      applicationResponses: membership.applicationResponses,
      email: membership.email,
      role: membership.role,
      isWelcomed: membership.isWelcomed
    };
  }

  async function verifyActiveMembershipsForClub(
    clubId: number,
    r: Services,
    m: SystemState
  ) {
    const memberships = await r.membership.getActiveMembershipsForClub(
      clubId,
      true
    );
    expect(
      orderByBigIntId(memberships.map((m) => membershipWithoutCreatedAt(m)))
    ).toEqual(orderByBigIntId(m.getActiveMembershipsForClub(clubId, true)));
  }

  async function verifyMembershipApplicationsForClub(
    clubId: number,
    r: Services,
    m: SystemState
  ) {
    const memberships =
      await r.membership.getMembershipApplicationsForClub(clubId);
    expect(
      orderByBigIntId(memberships.map((m) => membershipWithoutCreatedAt(m)))
    ).toEqual(orderByBigIntId(m.getMembershipApplicationsForClub(clubId)));
  }

  async function verifyClubStatistics(
    clubId: number,
    r: Services,
    m: SystemState
  ) {
    const clubStatistics = await r.club.getClubStatistics(clubId);
    expect(clubStatistics).toEqual(m.getClubStatistics(clubId));
  }

  async function verifyUserMemberships(
    userId: number,
    r: Services,
    m: SystemState
  ) {
    const memberships = await r.membership.getUserMemberships(userId);
    expect(
      orderByBigIntId(
        memberships.map((m) => membershipWithClubWithoutCreatedAt(m))
      )
    ).toEqual(orderByBigIntId(m.getUserMemberships(userId)));
  }

  async function verifyClubFollowers(
    clubId: number,
    r: Services,
    m: SystemState
  ) {
    const followers = await r.following.getClubFollowers(clubId);
    expect(
      // we only compare user not email or createdAt dates
      orderByNumberId(followers.map((f) => userWithoutCreatedAt(f.user)))
    ).toEqual(orderByNumberId(m.getClubFollowers(clubId)));
  }

  async function verifyUserFollowedClubs(
    userId: number,
    r: Services,
    m: SystemState
  ) {
    const followedClubs = await r.following.getUserFollowedClubs(userId);
    expect(
      orderByNumberId(followedClubs.map((c) => clubWithoutCreatedAt(c)))
    ).toEqual(orderByNumberId(m.getUserFollowedClubs(userId)));
  }

  async function verifyEmailTemplate(
    id: EmailTemplateId,
    r: EmailService,
    m: SystemState
  ) {
    const template = await r.getEmailTemplate(id);
    expect(template).toEqual(m.getEmailTemplate(id));
  }

  function emailBlastWithoutCreatedAt(
    emailBlast: EmailBlast
  ): OmitRecursively<EmailBlast, "createdAt" | "updatedAt"> {
    return {
      id: emailBlast.id,
      clubId: emailBlast.clubId,
      subject: emailBlast.subject,
      htmlContent: emailBlast.htmlContent,
      textContent: emailBlast.textContent,
      status: emailBlast.status
    };
  }

  async function verifyEmailBlasts(
    clubId: number,
    r: EmailService,
    m: SystemState
  ) {
    const emailBlasts = await r.getEmailBlasts(clubId);
    expect(
      orderByBigIntId(emailBlasts.map((b) => emailBlastWithoutCreatedAt(b)))
    ).toEqual(orderByBigIntId(m.getEmailBlasts(clubId)));
  }

  return {
    verifyUser,
    verifyClub,
    verifyClubMemberships,
    verifyUserMemberships,
    verifyClubFollowers,
    verifyUserFollowedClubs,
    verifyEmailTemplate,
    verifyEmailBlasts
  };
}

export const verifiers = createVerifiers();
