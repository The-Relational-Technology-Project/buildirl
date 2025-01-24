import {
  ApplicationQuestions,
  Club,
  CreateClubInput,
  CreateUserInput,
  InstagramHandle,
  MembershipTier,
  UpdateClubInput,
  UpdateUserInput,
  URL,
  UpdateClubApplicationQuestionsInput,
  type User,
  CreateMembershipTierInput,
  UpdateMembershipTierInput,
  SubmitMembershipApplicationInput,
  MembershipStatus,
  ApplicationResponses,
  Membership,
  ClubStatistics
} from "~/server/service/types";
import { Maybe } from "~/utils/types";
import { OmitRecursively } from "~/utils/omit";

// this entities differ from api ones mostly in that nested entities
// are replaced by their reference ids
type ClubState = {
  id: number;
  publicId: string;
  name: string;
  tagLine: string;
  description: string;
  ownerUserId: number;
  websiteURL: Maybe<URL>;
  instagramHandle: Maybe<InstagramHandle>;
  eventCalendarURL: Maybe<URL>;
  applicationQuestions: ApplicationQuestions;
  membershipTierIds: number[];
};

type MembershipState = {
  id: bigint;
  userId: number;
  clubId: number;
  membershipTierId: number;
  status: MembershipStatus;
  applicationResponses: ApplicationResponses;
};

type UserState = {
  id: number;
  firstName: string;
  lastName: string;
  description: string;
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

  public getUser(id: number): Omit<User, "createdAt"> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`user with id ${id} was expected`);
    }
    return user;
  }

  public hasUsers(): boolean {
    return this.users.size > 0;
  }

  public getUserIds(): number[] {
    return Array.from(this.users.keys());
  }

  public createUser(id: number, input: CreateUserInput) {
    if (!!this.users.get(id)) {
      throw new Error(`user with id ${id} already exists`);
    }
    this.users.set(id, {
      id: id,
      ...input
    });
  }

  public updateUser(id: number, input: UpdateUserInput) {
    const user = this.getUser(id);
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
      websiteURL: clubState.websiteURL,
      instagramHandle: clubState.instagramHandle,
      eventCalendarURL: clubState.eventCalendarURL,
      applicationQuestions: clubState.applicationQuestions,
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

  public createClub(userId: number, clubId: number, input: CreateClubInput) {
    if (!!this.clubs.get(clubId)) {
      throw new Error(`club with id ${clubId} already exists`);
    }
    this.clubs.set(clubId, {
      id: clubId,
      ...input,
      ownerUserId: userId,
      // empty to start
      applicationQuestions: {},
      membershipTierIds: []
    });
  }

  public updateClub(id: number, input: UpdateClubInput) {
    const clubState = this.getClubState(id);
    this.clubs.set(id, {
      ...clubState,
      ...input
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
    this.deleteMembershipTierFromClub(id);
    this.membershipTiers.delete(id);
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

  public hasMembershipTiers(): boolean {
    return this.membershipTiers.size > 0;
  }

  public getMembershipTierIds(): number[] {
    return Array.from(this.membershipTiers.keys());
  }

  public hasEmptyMembershipTier(): boolean {
    return this.getEmptyMembershipTiersIds().length > 0;
  }

  public getEmptyMembershipTiersIds(): number[] {
    const nonEmptyMembershipTierIds = this.getNonEmptyMembershipTierIds();
    return Array.from(this.membershipTiers.keys()).filter(
      (id) => !nonEmptyMembershipTierIds.has(id)
    );
  }

  public hasPublishedMembershipTier(): boolean {
    return this.getPublishedMembershipTiersIds().length > 0;
  }

  public getPublishedMembershipTiersIds(): number[] {
    return Array.from(this.membershipTiers.values())
      .filter((t) => t.status === "PUBLISHED")
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

  private getNonEmptyMembershipTierIds(): Set<number> {
    return new Set(
      Array.from(this.memberships.values()).map((m) => m.membershipTierId)
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

  public userIsNotOwnerAndDoesNotHaveMembershipInClub(
    userId: number,
    clubId: number
  ): boolean {
    return (
      !Array.from(this.memberships.values()).some(
        (m) => m.userId === userId && m.clubId === clubId
      ) &&
      // nor are they owner
      this.getClubState(clubId).ownerUserId !== userId
    );
  }

  public membershipStateToMembership(
    membershipState: MembershipState
  ): OmitRecursively<Membership, "createdAt"> {
    return {
      id: membershipState.id,
      user: this.getUser(membershipState.userId),
      club: this.getClub(membershipState.clubId),
      membershipTier: this.getMembershipTier(membershipState.membershipTierId),
      status: membershipState.status,
      applicationResponses: membershipState.applicationResponses
    };
  }

  public getActiveMembershipsForClub(
    clubId: number
  ): OmitRecursively<Membership, "createdAt">[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.clubId === clubId)
      .filter((m) => m.status === "ACTIVE")
      .map((m) => this.membershipStateToMembership(m));
  }

  public getMembershipApplicationsForClub(
    clubId: number
  ): OmitRecursively<Membership, "createdAt">[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.clubId === clubId)
      .filter((m) => m.status === "PENDING")
      .map((m) => this.membershipStateToMembership(m));
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
      memberCount: this.membershipCountWithStatus(clubId, "ACTIVE") + 1,
      pendingMembershipApplications: this.membershipCountWithStatus(
        clubId,
        "PENDING"
      )
    };
  }

  public getUserMemberships(
    userId: number
  ): OmitRecursively<Membership, "createdAt">[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.userId === userId)
      .map((m) => this.membershipStateToMembership(m));
  }

  public submitMembershipApplication(
    membershipId: bigint,
    membershipTierId: number,
    input: SubmitMembershipApplicationInput,
    userId: number
  ) {
    const clubId = this.getClubIdForMembershipTier(membershipTierId);
    this.memberships.set(membershipId, {
      id: membershipId,
      userId: userId,
      clubId: clubId,
      membershipTierId: membershipTierId,
      status: "PENDING",
      applicationResponses: input.applicationResponses
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
}
