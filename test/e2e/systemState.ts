import {
  Club,
  CreateClubInput,
  CreateUserInput,
  InstagramHandle,
  MembershipTier,
  UpdateClubInput,
  UpdateUserInput,
  Url,
  UpdateClubApplicationQuestionsInput,
  type User,
  CreateMembershipTierInput,
  UpdateMembershipTierInput,
  SubmitMembershipApplicationInput,
  MembershipStatus,
  Membership,
  ClubStatistics,
  UpdateClubDisplayImageUrlsInput
} from "~/server/service/types";
import { isDefaultFreeTier, Maybe } from "~/utils/types";
import { OmitRecursively } from "~/utils/omit";
import { FormQuestions, FormResponses } from "~/server/service/types/form";
import { TemplateTheme } from "~/client/theme/templates";
import {
  DEFAULT_APPLICATION_QUESTIONS,
  DEFAULT_FREE_MEMBERSHIP_TIER
} from "~/server/service/defaults";

// this entities differ from api ones mostly in that nested entities
// are replaced by their reference ids
type ClubState = {
  id: number;
  publicId: string;
  name: string;
  tagLine: string;
  description: string;
  ownerUserId: number;
  websiteUrl: Maybe<Url>;
  instagramHandle: Maybe<InstagramHandle>;
  eventCalendarUrl: Maybe<Url>;
  applicationQuestions: FormQuestions;
  theme: Maybe<TemplateTheme>;
  displayImageUrls: Url[];
  membershipTierIds: number[];
};

type MembershipState = {
  id: bigint;
  userId: number;
  clubId: number;
  membershipTierId: number;
  status: MembershipStatus;
  applicationResponses: FormResponses;
  isWelcomed: boolean;
};

type UserState = {
  id: number;
  firstName: string;
  lastName: string;
  description: string;
  // settings
  email: Maybe<string>;
  hasStripeAccount: boolean;
};

export class SystemState {
  private readonly users: Map<number, UserState>;
  private readonly clubs: Map<number, ClubState>;
  private readonly membershipTiers: Map<number, MembershipTier>;
  private readonly memberships: Map<bigint, MembershipState>;

  constructor() {
    this.users = new Map();
    this.clubs = new Map();
    this.membershipTiers = new Map();
    this.memberships = new Map();
  }

  // use this only for internal operations as it also contains
  // user settings which are private to `User`
  public getUserState(id: number): UserState {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`user with id ${id} was expected`);
    }
    return user;
  }

  public getUser(id: number): Omit<User, "createdAt"> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`user with id ${id} was expected`);
    }
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      description: user.description
      // do not pass through user settings like email
    };
  }

  public hasUsers(): boolean {
    return this.users.size > 0;
  }

  public getUserIds(): number[] {
    return Array.from(this.users.keys());
  }

  public createUser(id: number, input: CreateUserInput, email: Maybe<string>) {
    if (!!this.users.get(id)) {
      throw new Error(`user with id ${id} already exists`);
    }
    this.users.set(id, {
      id: id,
      ...input,
      email: email,
      hasStripeAccount: false
    });
  }

  public updateUser(id: number, input: UpdateUserInput) {
    const user = this.getUserState(id);
    this.users.set(id, {
      ...user,
      description: input.description
    });
  }

  public getClubState(id: number): ClubState {
    const clubState = this.clubs.get(id);
    if (!clubState) {
      throw new Error(`club with id ${id} was expected`);
    }
    return clubState;
  }

  public getClub(id: number): OmitRecursively<Club, "createdAt"> {
    const clubState = this.getClubState(id);
    return this.clubStateToClub(clubState);
  }

  private getClubStateBy(filter: (clubState: ClubState) => boolean): ClubState {
    const clubStates = Array.from(this.clubs.values()).filter(filter);
    if (clubStates.length !== 1) {
      throw new Error(
        `expected 1 club state, got ${clubStates.length}: ${clubStates}`
      );
    }
    return clubStates[0]!;
  }

  private orderedByCost(membershipTiers: MembershipTier[]): MembershipTier[] {
    return (
      membershipTiers
        // if equal cost, sort by id
        .sort((a, b) => a.id - b.id)
        .sort((a, b) => a.costPerMonthInUSD - b.costPerMonthInUSD)
    );
  }

  public clubStateToClub(
    clubState: ClubState
  ): OmitRecursively<Club, "createdAt"> {
    return {
      id: clubState.id,
      publicId: clubState.publicId,
      name: clubState.name,
      tagLine: clubState.tagLine,
      description: clubState.description,
      owner: this.getUser(clubState.ownerUserId),
      websiteUrl: clubState.websiteUrl,
      instagramHandle: clubState.instagramHandle,
      eventCalendarUrl: clubState.eventCalendarUrl,
      applicationQuestions: clubState.applicationQuestions,
      theme: clubState.theme,
      displayImageUrls: clubState.displayImageUrls,
      membershipTiers: this.orderedByCost(
        clubState.membershipTierIds.map((id) => this.getMembershipTier(id))
      )
    };
  }

  public hasClubs(): boolean {
    return this.clubs.size > 0;
  }

  public getClubIds(): number[] {
    return Array.from(this.clubs.keys());
  }

  public hasClubsWithNoMemberships(): boolean {
    return this.getClubIdsWithNoMemberships().length > 0;
  }

  public getClubIdsWithNoMemberships(): number[] {
    const clubsWithMemberships = this.getClubIdsWithMemberships();
    return Array.from(this.clubs.keys()).filter(
      (id) => !clubsWithMemberships.has(id)
    );
  }

  private getClubIdsWithMemberships(): Set<number> {
    return new Set(Array.from(this.memberships.values()).map((m) => m.clubId));
  }

  public getUserOwnedClubs(
    userId: number
  ): OmitRecursively<Club, "createdAt">[] {
    return Array.from(this.clubs.values())
      .filter((club) => club.ownerUserId === userId)
      .map((club) => this.clubStateToClub(club));
  }

  public isNotClubPublicIdUsed(clubPublicId: string): boolean {
    return !Array.from(this.clubs.values()).some(
      (club) => club.publicId === clubPublicId
    );
  }

  public createClub(
    userId: number,
    clubId: number,
    input: CreateClubInput,
    freeMembershipTierId: number
  ) {
    if (!!this.clubs.get(clubId)) {
      throw new Error(`club with id ${clubId} already exists`);
    }
    this.clubs.set(clubId, {
      id: clubId,
      ...input,
      ownerUserId: userId,
      // empty to start
      applicationQuestions: DEFAULT_APPLICATION_QUESTIONS,
      theme: null,
      displayImageUrls: [],
      membershipTierIds: []
    });

    this.createFreeMembershipTier(freeMembershipTierId, clubId);
  }

  private createFreeMembershipTier(
    freeMembershipTierId: number,
    clubId: number
  ) {
    this.createMembershipTier(
      freeMembershipTierId,
      clubId,
      DEFAULT_FREE_MEMBERSHIP_TIER
    );
  }

  public updateClub(id: number, input: UpdateClubInput) {
    const clubState = this.getClubState(id);
    this.clubs.set(id, {
      ...clubState,
      ...input
    });
  }

  public deleteClub(id: number) {
    this.deleteMembershipTiersForClub(id);
    this.clubs.delete(id);
  }

  private deleteMembershipTiersForClub(clubId: number) {
    const clubState = this.getClubState(clubId);
    clubState.membershipTierIds.forEach((id) => {
      this.deleteMembershipTier(id);
    });
  }

  public updateClubApplicationQuestions(
    id: number,
    input: UpdateClubApplicationQuestionsInput
  ) {
    const clubState = this.getClubState(id);
    this.clubs.set(id, {
      ...clubState,
      ...input
    });
  }

  public updateClubDisplayImageUrls(
    id: number,
    input: UpdateClubDisplayImageUrlsInput
  ) {
    const clubState = this.getClubState(id);
    this.clubs.set(id, {
      ...clubState,
      ...input
    });
  }

  public createMembershipTier(
    membershipTierId: number,
    clubId: number,
    input: CreateMembershipTierInput
  ) {
    if (!!this.membershipTiers.get(membershipTierId)) {
      throw new Error(
        `membership tier with id ${membershipTierId} already exists`
      );
    }
    this.membershipTiers.set(membershipTierId, {
      id: membershipTierId,
      name: input.name,
      status: "PUBLISHED",
      benefitDescription: input.benefitDescription,
      contributionDescription: input.contributionDescription,
      costPerMonthInUSD: input.costPerMonthInUSD
    });
    // link the membership tier to the club
    const clubState = this.getClubState(clubId);
    clubState.membershipTierIds.push(membershipTierId);
  }

  public updateMembershipTier(id: number, input: UpdateMembershipTierInput) {
    const membershipTier = this.getMembershipTier(id);
    this.membershipTiers.set(id, {
      ...membershipTier,
      ...input
    });
  }

  public deleteMembershipTier(id: number) {
    this.deleteMembershipsForMembershipTier(id);
    this.deleteMembershipTierFromClub(id);
    this.membershipTiers.delete(id);
  }

  private deleteMembershipsForMembershipTier(membershipTierId: number) {
    const membershipsForMembershipTier = Array.from(
      this.memberships.values()
    ).filter((m) => m.membershipTierId === membershipTierId);

    for (const membership of membershipsForMembershipTier) {
      if (membership.status === "ACTIVE") {
        throw new Error(
          `cannot delete active membership with id ${membership.id}`
        );
      }
      this.memberships.delete(membership.id);
    }
  }

  public publishMembershipTier(id: number) {
    const membershipTier = this.getMembershipTier(id);
    this.membershipTiers.set(id, {
      ...membershipTier,
      status: "PUBLISHED"
    });
  }

  public unpublishMembershipTier(id: number) {
    const membershipTier = this.getMembershipTier(id);
    this.membershipTiers.set(id, {
      ...membershipTier,
      status: "UNPUBLISHED"
    });
  }

  private deleteMembershipTierFromClub(membershipTierId: number) {
    const clubId = this.getClubIdForMembershipTier(membershipTierId);
    const club = this.getClubState(clubId);
    this.clubs.set(clubId, {
      ...club,
      // remove membership tier id
      membershipTierIds: club.membershipTierIds.filter(
        (id) => id !== membershipTierId
      )
    });
  }

  public getMembershipTier(id: number): MembershipTier {
    const membershipTier = this.membershipTiers.get(id);
    if (!membershipTier) {
      throw new Error(`membership tier with id ${id} was expected`);
    }
    return membershipTier;
  }

  public hasNoActiveMembersMembershipTier(): boolean {
    return this.getNoActiveMembersMembershipTiersIds().length > 0;
  }

  public getNoActiveMembersMembershipTiersIds(): number[] {
    const activeMembersMembershipTierIds =
      this.getActiveMembersMembershipTierIds();
    return Array.from(this.membershipTiers.keys()).filter(
      (id) => !activeMembersMembershipTierIds.has(id)
    );
  }

  public hasEmptyNotFreeAndNotLastPublishedMembershipTier(): boolean {
    return (
      this.getNoActiveMembersNotFreeAndNotLastPublishedMembershipTiersIds()
        .length > 0
    );
  }

  public getNoActiveMembersNotFreeAndNotLastPublishedMembershipTiersIds(): number[] {
    const activeMembersMembershipTierIds =
      this.getActiveMembersMembershipTierIds();
    return Array.from(this.membershipTiers.values())
      .filter(
        // definition of default free tier is 0 cost
        (m) =>
          !activeMembersMembershipTierIds.has(m.id) &&
          m.costPerMonthInUSD !== 0 &&
          !this.isMembershipTierLastPublished(m.id)
      )
      .map((m) => m.id);
  }

  public isMembershipTierLastPublished(membershipTierId: number): boolean {
    const clubId = this.getClubIdForMembershipTier(membershipTierId);
    const club = this.getClubState(clubId);
    const publishedMembershipTiers = club.membershipTierIds.filter(
      (id) => this.getMembershipTier(id).status === "PUBLISHED"
    );
    return (
      publishedMembershipTiers.length === 1 &&
      publishedMembershipTiers[0] === membershipTierId
    );
  }

  public isDefaultFreeTier(membershipTierId: number): boolean {
    const membershipTier = this.getMembershipTier(membershipTierId);
    return isDefaultFreeTier(membershipTier);
  }

  public hasPublishedMembershipTiers(): boolean {
    return this.getPublishedMembershipTierIds().length > 0;
  }

  public getPublishedMembershipTierIds(): number[] {
    return Array.from(this.membershipTiers.values())
      .filter((t) => t.status === "PUBLISHED")
      .map((t) => t.id);
  }

  public hasPublishedButNotLastPublishedMembershipTiers(): boolean {
    return this.getPublishedButNotLastPublishedMembershipTierIds().length > 0;
  }

  public getPublishedButNotLastPublishedMembershipTierIds(): number[] {
    return Array.from(this.membershipTiers.values())
      .filter(
        (t) =>
          t.status === "PUBLISHED" && !this.isMembershipTierLastPublished(t.id)
      )
      .map((t) => t.id);
  }

  public hasUnpublishedMembershipTier(): boolean {
    return this.getUnpublishedMembershipTiersIds().length > 0;
  }

  public getUnpublishedMembershipTiersIds(): number[] {
    return Array.from(this.membershipTiers.values())
      .filter((t) => t.status === "UNPUBLISHED")
      .map((t) => t.id);
  }

  private getActiveMembersMembershipTierIds(): Set<number> {
    return new Set(
      Array.from(this.memberships.values())
        .filter((m) => m.status === "ACTIVE")
        .map((m) => m.membershipTierId)
    );
  }

  public getClubIdForMembershipTier(membershipTierId: number): number {
    const club = this.getClubStateBy((c) =>
      c.membershipTierIds.includes(membershipTierId)
    );
    if (!club) {
      throw new Error(
        `club with membership tier id ${membershipTierId} was expected`
      );
    }
    return club.id;
  }

  public userIsNotOwnerAndDoesNotHaveActiveMembershipInClub(
    userId: number,
    clubId: number
  ): boolean {
    return (
      !Array.from(this.memberships.values())
        .filter((v) => v.status === "ACTIVE")
        .some((m) => m.userId === userId && m.clubId === clubId) &&
      // nor are they owner
      this.getClubState(clubId).ownerUserId !== userId
    );
  }

  public membershipStateToMembership(
    membershipState: MembershipState,
    includeEmail: boolean = false
  ): OmitRecursively<Membership, "createdAt"> {
    return {
      id: membershipState.id,
      user: this.getUser(membershipState.userId),
      club: this.getClub(membershipState.clubId),
      membershipTier: this.getMembershipTier(membershipState.membershipTierId),
      status: membershipState.status,
      applicationResponses: membershipState.applicationResponses,
      email: includeEmail ? this.getUserEmail(membershipState.userId) : null,
      isWelcomed: membershipState.isWelcomed
    };
  }

  private getUserEmail(userId: number): Maybe<string> {
    const user = this.getUserState(userId);
    return user.email;
  }

  public getActiveMembershipsForClub(
    clubId: number,
    includeEmail: boolean
  ): OmitRecursively<Membership, "createdAt">[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.clubId === clubId)
      .filter((m) => m.status === "ACTIVE")
      .map((m) => this.membershipStateToMembership(m, includeEmail));
  }

  public getMembershipApplicationsForClub(
    clubId: number
  ): OmitRecursively<Membership, "createdAt">[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.clubId === clubId)
      .filter((m) => m.status === "PENDING")
      .map((m) => this.membershipStateToMembership(m, true));
  }

  private membershipCountWithStatus(
    clubId: number,
    status: MembershipStatus
  ): number {
    return Array.from(this.memberships.values())
      .filter((m) => m.clubId === clubId)
      .filter((m) => m.status === status).length;
  }

  public getClubStatistics(clubId: number): ClubStatistics {
    return {
      // plus one for owner
      memberCount: this.membershipCountWithStatus(clubId, "ACTIVE") + 1
    };
  }

  public getUserMemberships(
    userId: number
  ): OmitRecursively<Membership, "createdAt">[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.userId === userId)
      .map((m) => this.membershipStateToMembership(m, false));
  }

  public submitMembershipApplication(
    membershipId: bigint,
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number
  ) {
    const clubId = this.getClubIdForMembershipTier(membershipTierId);
    // add or update if already exists (e.g. declined or deactivated)
    this.memberships.set(membershipId, {
      id: membershipId,
      userId: userId,
      clubId: clubId,
      membershipTierId: membershipTierId,
      status: "PENDING",
      applicationResponses: input.applicationResponses,
      isWelcomed: false
    });
  }

  public getActiveMembershipIds(): bigint[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.status === "ACTIVE")
      .map((m) => m.id);
  }

  public getPendingMembershipIds(): bigint[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.status === "PENDING")
      .map((m) => m.id);
  }

  public getMembershipState(membershipId: bigint): MembershipState {
    const membershipState = this.memberships.get(membershipId);
    if (!membershipState) {
      throw new Error(`membership with id ${membershipId} was expected`);
    }
    return membershipState;
  }

  public getClubIdForMembership(membershipId: bigint): number {
    const membershipState = this.getMembershipState(membershipId);
    return membershipState.clubId;
  }

  public getUserIdForMembership(membershipId: bigint): number {
    const membershipState = this.getMembershipState(membershipId);
    return membershipState.userId;
  }

  public approveMembershipApplication(membershipId: bigint) {
    const membershipState = this.getMembershipState(membershipId);
    this.memberships.set(membershipId, {
      ...membershipState,
      status: "ACTIVE"
    });
  }

  public declineMembershipApplication(membershipId: bigint) {
    const membershipState = this.getMembershipState(membershipId);
    this.memberships.set(membershipId, {
      ...membershipState,
      status: "DECLINED"
    });
  }

  public deactivateMembership(membershipId: bigint) {
    const membershipState = this.getMembershipState(membershipId);
    this.memberships.set(membershipId, {
      ...membershipState,
      status: "INACTIVE"
    });
  }

  public setMembershipAsWelcomed(membershipId: bigint) {
    const membershipState = this.getMembershipState(membershipId);
    this.memberships.set(membershipId, {
      ...membershipState,
      isWelcomed: true
    });
  }

  public setStripeAccountCreatedForUser(userId: number) {
    const user = this.getUserState(userId);
    this.users.set(userId, {
      ...user,
      hasStripeAccount: true
    });
  }

  public getUserIdsWithoutStripeAccounts(): number[] {
    return Array.from(this.users.values())
      .filter((u) => !u.hasStripeAccount)
      .map((u) => u.id);
  }

  public getClubIdsWithOwnersWithStripeAccounts(): number[] {
    return Array.from(this.clubs.values())
      .filter((c) => this.users.get(c.ownerUserId)!.hasStripeAccount)
      .map((c) => c.id);
  }
}
