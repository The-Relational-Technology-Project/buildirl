import { isDefaultFreeTier, Maybe, BillingInterval } from "~/utils/types";
import { OmitRecursively } from "~/utils/omit";
import { FormQuestions, FormResponses } from "~/server/club/types/form";
import { TemplateTheme } from "~/client/theme/templates";
import {
  DEFAULT_APPLICATION_QUESTIONS,
  DEFAULT_FREE_MEMBERSHIP_TIER
} from "~/server/utils/defaults";
import {
  EmailTemplateType,
  SetEmailTemplateInput,
  EmailBlastStatus,
  EmailBlastInput
} from "~/server/email/types";
import { EmailTemplate } from "~/server/email/types";
import { EmailTemplateId } from "~/server/email/types";
import { ItemSelector } from "./utils/itemSelector";
import { InstagramHandle, Url } from "~/server/utils/types";
import {
  Club,
  ClubStatistics,
  ClubValues,
  CreateClubInput,
  FAQs,
  Rhythm,
  UpdateClubApplicationQuestionsInput,
  UpdateClubDisplayImageUrlsInput,
  UpdateClubInput
} from "~/server/club/types";
import {
  Membership,
  MembershipStatus,
  MembershipWithClub,
  Role,
  SubmitMembershipApplicationInput
} from "~/server/membership/types";
import {
  CreateMembershipTierInput,
  MembershipTier,
  UpdateMembershipTierInput
} from "~/server/membershipTier/types";
import {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserSocialsInput,
  UpdateUserSocialsInputSchema,
  User,
  UserSocials
} from "~/server/user/types";
import { stringify } from "~/utils";

// this entities differ from api ones mostly in that nested entities
// are replaced by their reference ids
type ClubState = {
  id: number;
  publicId: string;
  name: string;
  tagLine: string;
  description: string;
  location: string;
  rhythm: Maybe<Rhythm>;
  websiteUrl: Maybe<Url>;
  instagramHandle: Maybe<InstagramHandle>;
  eventCalendarUrl: Maybe<Url>;
  applicationQuestions: FormQuestions;
  theme: Maybe<TemplateTheme>;
  themeHeadingFont: Maybe<string>;
  displayImageUrls: Url[];
  membershipTierIds: number[];
  hasStripeAccount: boolean;
  values: ClubValues;
  faqs: FAQs;
};

type EmailBlastState = {
  id: bigint;
  clubId: number;
  subject: string;
  htmlContent: string;
  textContent: string;
  status: EmailBlastStatus;
};

type MembershipState = {
  id: bigint;
  userId: number;
  clubId: number;
  membershipTierId: number;
  status: MembershipStatus;
  applicationResponses: FormResponses;
  isWelcomed: boolean;
  role: Role;
};

type UserState = {
  id: number;
  firstName: string;
  lastName: string;
  description: string;
  socials: Maybe<UserSocials>;
  // settings
  email: Maybe<string>;
};

export class SystemState {
  private readonly users: Map<number, UserState>;
  private readonly clubs: Map<number, ClubState>;
  private readonly membershipTiers: Map<number, MembershipTier>;
  private readonly memberships: Map<bigint, MembershipState>;
  // clubIds to all following userIds
  private readonly clubFollowing: Map<number, Set<number>>;
  // clubIds to template by type
  private readonly emailTemplates: Map<
    number,
    Map<EmailTemplateType, EmailTemplate>
  >;
  private readonly emailBlasts: Map<bigint, EmailBlastState>;

  constructor() {
    this.users = new Map();
    this.clubs = new Map();
    this.membershipTiers = new Map();
    this.memberships = new Map();
    this.clubFollowing = new Map();
    this.emailTemplates = new Map();
    this.emailBlasts = new Map();
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
      description: user.description,
      socials: user.socials
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
      socials: null,
      email: email
    });
  }

  public updateUser(id: number, input: UpdateUserInput) {
    const user = this.getUserState(id);
    this.users.set(id, {
      ...user,
      description: input.description
    });
  }

  public updateUserSocials(id: number, input: UpdateUserSocialsInput) {
    const user = this.getUserState(id);
    const validatedInput = UpdateUserSocialsInputSchema.parse(input);

    const socials: UserSocials = {
      twitter: validatedInput.twitter,
      instagram: validatedInput.instagram,
      facebook: validatedInput.facebook,
      linkedin: validatedInput.linkedin,
      website: validatedInput.website
    };

    this.users.set(id, {
      ...user,
      socials: socials
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

  private getBillingIntervalSortPriority(interval: BillingInterval): number {
    switch (interval) {
      case BillingInterval.MONTHLY:
        return 1;
      case BillingInterval.QUARTERLY:
        return 2;
      case BillingInterval.SEMI_ANNUAL:
        return 3;
      default:
        return 999;
    }
  }

  private orderByCost(membershipTiers: MembershipTier[]): MembershipTier[] {
    return membershipTiers
      .sort((a, b) => a.id - b.id)
      .sort((a, b) => a.costPerBillingInterval - b.costPerBillingInterval)
      .sort(
        (a, b) =>
          this.getBillingIntervalSortPriority(a.billingInterval) -
          this.getBillingIntervalSortPriority(b.billingInterval)
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
      location: clubState.location,
      rhythm: clubState.rhythm,
      websiteUrl: clubState.websiteUrl,
      instagramHandle: clubState.instagramHandle,
      eventCalendarUrl: clubState.eventCalendarUrl,
      applicationQuestions: clubState.applicationQuestions,
      theme: clubState.theme,
      themeHeadingFont: clubState.themeHeadingFont,
      displayImageUrls: clubState.displayImageUrls,
      values: clubState.values,
      faqs: clubState.faqs,
      membershipTiers: this.orderByCost(
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

  public hasClubsWithNoActiveMembershipsOrMembershipApplications(): boolean {
    return (
      this.getClubIdsWithNoActiveMembershipsOrMembershipApplications().length >
      0
    );
  }

  public getClubIdsWithNoActiveMembershipsOrMembershipApplications(): number[] {
    const clubsWithMemberships =
      this.getClubIdsWithActiveMembershipsOrMembershipApplications();
    return Array.from(this.clubs.keys()).filter(
      (id) => !clubsWithMemberships.has(id)
    );
  }

  private getClubIdsWithActiveMembershipsOrMembershipApplications(): Set<number> {
    return new Set(
      Array.from(this.memberships.values())
        .filter((m) => m.status === "ACTIVE" || m.status === "PENDING")
        .map((m) => m.clubId)
    );
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
    freeMembershipTierId: number,
    leadMembershipId: bigint
  ) {
    if (!!this.clubs.get(clubId)) {
      throw new Error(`club with id ${clubId} already exists`);
    }
    this.clubs.set(clubId, {
      id: clubId,
      ...input,
      // defaults
      tagLine: "",
      description: "",
      rhythm: null,
      websiteUrl: null,
      instagramHandle: null,
      eventCalendarUrl: null,
      applicationQuestions: DEFAULT_APPLICATION_QUESTIONS,
      theme: null,
      themeHeadingFont: null,
      displayImageUrls: [],
      values: { items: [] },
      faqs: { items: [] },
      membershipTierIds: [],
      hasStripeAccount: false
    });

    this.createFreeMembershipTier(freeMembershipTierId, clubId);
    this.createLeadMembership(
      leadMembershipId,
      freeMembershipTierId,
      clubId,
      userId
    );
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

  private createLeadMembership(
    leadMembershipId: bigint,
    freeMembershipTierId: number,
    clubId: number,
    userId: number
  ) {
    this.memberships.set(leadMembershipId, {
      id: leadMembershipId,
      userId: userId,
      clubId: clubId,
      membershipTierId: freeMembershipTierId,
      status: "ACTIVE",
      applicationResponses: { responses: [] },
      isWelcomed: true,
      role: "LEAD"
    });
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
    this.deleteEmailBlastsForClub(id);
    // cascading delete
    this.clubFollowing.delete(id);
    this.clubs.delete(id);
    this.emailTemplates.delete(id);
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
      costPerBillingInterval: input.costPerBillingInterval,
      billingInterval: input.billingInterval,
      initiationFeeCostInUSD: input.initiationFeeCostInUSD
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

  public hasPaidMembershipTierWithNoActiveMembersOrPendingApplicationsThatAreNotLastPublished(): boolean {
    return (
      this.getPaidMembershipTierIdsWithNoActiveMembersOrPendingApplicationsThatAreNotLastPublished()
        .length > 0
    );
  }

  public getPaidMembershipTierIdsWithNoActiveMembersOrPendingApplicationsThatAreNotLastPublished(): number[] {
    const activeMembersMembershipTierIds =
      this.getMembershipTierIdsWithActiveMembersOrPendingApplications();
    return Array.from(this.membershipTiers.values())
      .filter(
        // definition of default free tier is 0 cost
        (m) =>
          !activeMembersMembershipTierIds.has(m.id) &&
          m.costPerBillingInterval !== 0 &&
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

  public getMembershipTierIds(): number[] {
    return Array.from(this.membershipTiers.values()).map((t) => t.id);
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

  public hasPendingApplications(membershipTierId: number) {
    return this.getMembershipTierIdsWithPendingApplications().has(
      membershipTierId
    );
  }

  private getMembershipTierIdsWithPendingApplications(): Set<number> {
    return new Set(
      Array.from(this.memberships.values())
        .filter((m) => m.status === "PENDING")
        .map((m) => m.membershipTierId)
    );
  }

  public hasActiveMembersOrPendingApplications(membershipTierId: number) {
    return this.getMembershipTierIdsWithActiveMembersOrPendingApplications().has(
      membershipTierId
    );
  }

  private getMembershipTierIdsWithActiveMembersOrPendingApplications(): Set<number> {
    return new Set(
      Array.from(this.memberships.values())
        .filter((m) => m.status === "ACTIVE" || m.status === "PENDING")
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

  public userDoesNotHaveActiveMembershipInClub(
    userId: number,
    clubId: number
  ): boolean {
    return !Array.from(this.memberships.values())
      .filter((v) => v.status === "ACTIVE")
      .some((m) => m.userId === userId && m.clubId === clubId);
  }

  public membershipStateToMembership(
    membershipState: MembershipState,
    includeEmail: boolean = false
  ): OmitRecursively<Membership, "createdAt"> {
    return {
      id: membershipState.id,
      user: this.getUser(membershipState.userId),
      membershipTier: this.getMembershipTier(membershipState.membershipTierId),
      status: membershipState.status,
      applicationResponses: membershipState.applicationResponses,
      email: includeEmail ? this.getUserEmail(membershipState.userId) : null,
      isWelcomed: membershipState.isWelcomed,
      role: membershipState.role
    };
  }

  public membershipStateToMembershipWithClub(
    membershipState: MembershipState,
    includeEmail: boolean = false
  ): OmitRecursively<MembershipWithClub, "createdAt"> {
    return {
      id: membershipState.id,
      user: this.getUser(membershipState.userId),
      club: this.getClub(membershipState.clubId),
      membershipTier: this.getMembershipTier(membershipState.membershipTierId),
      status: membershipState.status,
      applicationResponses: membershipState.applicationResponses,
      email: includeEmail ? this.getUserEmail(membershipState.userId) : null,
      isWelcomed: membershipState.isWelcomed,
      role: membershipState.role
    };
  }

  private getUserEmail(userId: number): Maybe<string> {
    const user = this.getUserState(userId);
    return user.email;
  }

  private getUserEmails(userIds: number[]): string[] {
    return userIds.map((userId) => {
      const email = this.getUserEmail(userId);
      if (!email) {
        throw new Error(
          `failed to find required email for user with id ${userId}`
        );
      }
      return email;
    });
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

  public leadUserIdForClub(clubId: number) {
    const activeMemberships = this.getActiveMembershipsForClub(clubId, false);
    const leadMemberships = activeMemberships.filter((m) => m.role === "LEAD");
    if (leadMemberships.length !== 1) {
      throw new Error(
        `expected exactly one lead membership but found ${stringify(leadMemberships)}`
      );
    }
    return leadMemberships[0]!.user.id;
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
      memberCount: this.membershipCountWithStatus(clubId, "ACTIVE")
    };
  }

  public getUserMemberships(
    userId: number
  ): OmitRecursively<MembershipWithClub, "createdAt">[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.userId === userId)
      .map((m) => this.membershipStateToMembershipWithClub(m, false));
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
      isWelcomed: false,
      role: "MEMBER"
    });
  }

  public getActiveMembershipIds(): bigint[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.status === "ACTIVE")
      .map((m) => m.id);
  }

  public getActiveMembershipIdsToClubWithMultipleMembershipTiers(): bigint[] {
    const clubsWithMultipleTiers = Array.from(this.clubs.values())
      .filter((club) => {
        const publishedTierIds = this.getPublishedMembershipTierIdsForClub(
          club.id
        );
        return publishedTierIds.length > 1;
      })
      .map((club) => club.id);

    return Array.from(this.memberships.values())
      .filter(
        (m) =>
          m.status === "ACTIVE" && clubsWithMultipleTiers.includes(m.clubId)
      )
      .map((m) => m.id);
  }

  public hasActiveMembershipIdsToClubWithMultipleMembershipTiers() {
    return (
      this.getActiveMembershipIdsToClubWithMultipleMembershipTiers().length > 0
    );
  }

  public getPendingMembershipIds(): bigint[] {
    return Array.from(this.memberships.values())
      .filter((m) => m.status === "PENDING")
      .map((m) => m.id);
  }

  public getPendingOrPendingIncompleteMembershipIds(): bigint[] {
    return Array.from(this.memberships.values())
      .filter(
        (m) => m.status === "PENDING" || m.status === "PENDING_INCOMPLETE"
      )
      .map((m) => m.id);
  }

  public getMembershipState(membershipId: bigint): MembershipState {
    const membershipState = this.memberships.get(membershipId);
    if (!membershipState) {
      throw new Error(`membership with id ${membershipId} was expected`);
    }
    return membershipState;
  }

  public isNotLastLeadMembershipForClub(membershipId: bigint): boolean {
    const membershipState = this.getMembershipState(membershipId);

    if (membershipState.role !== "LEAD") {
      // not a lead, so can't be last lead
      return true;
    }

    const clubId = membershipState.clubId;
    const leadCount = Array.from(this.memberships.values()).filter(
      (m) => m.clubId === clubId && m.role === "LEAD" && m.status === "ACTIVE"
    ).length;

    // if there's more than one lead, this isn't the last one
    return leadCount > 1;
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
    this.unfollowClub(membershipState.userId, membershipState.clubId);
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

  public withdrawMembershipApplication(membershipId: bigint) {
    const membershipState = this.getMembershipState(membershipId);
    this.memberships.set(membershipId, {
      ...membershipState,
      status: "WITHDRAWN"
    });
  }

  public setMembershipAsWelcomed(membershipId: bigint) {
    const membershipState = this.getMembershipState(membershipId);
    this.memberships.set(membershipId, {
      ...membershipState,
      isWelcomed: true
    });
  }

  public setStripeAccountCreatedForClub(clubId: number) {
    const club = this.getClubState(clubId);
    this.clubs.set(clubId, {
      ...club,
      hasStripeAccount: true
    });
  }

  public getClubIdsWithoutStripeAccounts(): number[] {
    return Array.from(this.clubs.values())
      .filter((c) => !c.hasStripeAccount)
      .map((c) => c.id);
  }

  public getClubIdsWithStripeAccounts(): number[] {
    return Array.from(this.clubs.values())
      .filter((c) => c.hasStripeAccount)
      .map((c) => c.id);
  }

  public getPublishedMembershipTierIdsForClub(clubId: number): number[] {
    const club = this.getClubState(clubId);
    return club.membershipTierIds
      .map((id) => this.membershipTiers.get(id)!)
      .filter((tier) => tier && tier.status === "PUBLISHED")
      .map((tier) => tier.id);
  }

  public updateMembershipTierForMembership(
    membershipId: bigint,
    newMembershipTierId: number
  ) {
    const membership = this.getMembershipState(membershipId);
    this.memberships.set(membershipId, {
      ...membership,
      membershipTierId: newMembershipTierId
    });
  }

  public followClub(userId: number, clubId: number) {
    if (!this.clubFollowing.has(clubId)) {
      this.clubFollowing.set(clubId, new Set());
    }
    this.clubFollowing.get(clubId)!.add(userId);
  }

  public unfollowClub(userId: number, clubId: number) {
    if (this.clubFollowing.has(clubId)) {
      const followers = this.clubFollowing.get(clubId)!;
      followers.delete(userId);

      if (followers.size === 0) {
        this.clubFollowing.delete(clubId);
      }
    }
  }

  public hasClubFollowings(): boolean {
    for (const [, followers] of this.clubFollowing.entries()) {
      if (followers.size > 0) {
        return true;
      }
    }
    return false;
  }

  public getClubFollowers(
    clubId: number
  ): OmitRecursively<User, "createdAt">[] {
    if (!this.clubFollowing.has(clubId)) {
      return [];
    }
    const followerUserIds = this.clubFollowing.get(clubId)!;
    return Array.from(followerUserIds).map((userId) => this.getUser(userId));
  }

  public getUserFollowedClubs(
    userId: number
  ): OmitRecursively<Club, "createdAt">[] {
    const clubIds: number[] = [];

    for (const [clubId, followers] of this.clubFollowing.entries()) {
      if (followers.has(userId)) {
        clubIds.push(clubId);
      }
    }

    return clubIds.map((clubId) => this.getClub(clubId));
  }

  public getFollowedClubIds(): number[] {
    return Array.from(this.clubFollowing.keys());
  }

  public getFollowingUserIdsForClub(clubId: number): number[] {
    return [...this.clubFollowing.get(clubId)!];
  }

  public setEmailTemplate(id: EmailTemplateId, input: SetEmailTemplateInput) {
    if (!this.emailTemplates.has(id.clubId)) {
      this.emailTemplates.set(id.clubId, new Map());
    }

    const clubTemplates = this.emailTemplates.get(id.clubId)!;
    clubTemplates.set(id.type, {
      type: id.type,
      ...input
    });
  }

  public deleteEmailTemplate(id: EmailTemplateId) {
    if (!this.emailTemplates.has(id.clubId)) {
      throw new Error(
        `missing email template for clubId ${id.clubId} and template type ${id.type}`
      );
    }
    const clubTemplates = this.emailTemplates.get(id.clubId)!;
    clubTemplates.delete(id.type);

    if (clubTemplates.size === 0) {
      this.emailTemplates.delete(id.clubId);
    }
  }

  public getEmailTemplate(id: EmailTemplateId): Maybe<EmailTemplate> {
    if (!this.emailTemplates.has(id.clubId)) {
      return null;
    }
    const clubTemplates = this.emailTemplates.get(id.clubId)!;
    const template = clubTemplates.get(id.type);
    if (!template) {
      return null;
    }
    return template;
  }

  public hasEmailTemplates(): boolean {
    return this.emailTemplates.size > 0;
  }

  public selectEmailTemplate(
    clubIdSelector: ItemSelector<number>,
    templateTypeSelector: ItemSelector<EmailTemplateType>
  ): EmailTemplateId {
    const clubId = clubIdSelector.select(
      Array.from(this.emailTemplates.keys())
    );
    const clubTemplates = this.emailTemplates.get(clubId)!;
    const type = templateTypeSelector.select(Array.from(clubTemplates.keys()));

    return { clubId, type };
  }

  public createEmailBlast(id: bigint, clubId: number, input: EmailBlastInput) {
    if (this.emailBlasts.has(id)) {
      throw new Error(`email blast with id ${id} already exists`);
    }
    this.emailBlasts.set(id, {
      id,
      clubId,
      subject: input.subject,
      htmlContent: input.htmlContent,
      textContent: input.textContent,
      status: "DRAFT"
    });
  }

  public updateEmailBlast(id: bigint, input: EmailBlastInput) {
    const emailBlast = this.getEmailBlastState(id);
    this.emailBlasts.set(id, {
      ...emailBlast,
      subject: input.subject,
      htmlContent: input.htmlContent,
      textContent: input.textContent
    });
  }

  public deleteEmailBlast(id: bigint) {
    this.emailBlasts.delete(id);
  }

  private getEmailBlastState(id: bigint): EmailBlastState {
    const emailBlast = this.emailBlasts.get(id);
    if (!emailBlast) {
      throw new Error(`email blast with id ${id} was expected`);
    }
    return emailBlast;
  }

  public getEmailBlast(id: bigint): EmailBlastState {
    return this.getEmailBlastState(id);
  }

  public getEmailBlasts(clubId: number): EmailBlastState[] {
    return Array.from(this.emailBlasts.values())
      .filter((blast) => blast.clubId === clubId)
      .sort((a, b) => Number(b.id - a.id)); // simulate updatedAt desc ordering
  }

  public hasEmailBlasts(): boolean {
    return this.emailBlasts.size > 0;
  }

  public hasEmailBlastsWithStatus(status: EmailBlastStatus): boolean {
    return this.getEmailBlastIdsWithStatus(status).length > 0;
  }

  public getEmailBlastIds(): bigint[] {
    return Array.from(this.emailBlasts.keys());
  }

  public getEmailBlastIdsWithStatus(status: EmailBlastStatus): bigint[] {
    return Array.from(this.emailBlasts.values())
      .filter((blast) => blast.status === status)
      .map((blast) => blast.id);
  }

  public getDraftEmailBlastIds(): bigint[] {
    return this.getEmailBlastIdsWithStatus("DRAFT");
  }

  public sendEmailBlast(id: bigint) {
    const emailBlast = this.getEmailBlastState(id);
    this.emailBlasts.set(id, {
      ...emailBlast,
      status: "SENT"
    });
  }

  private deleteEmailBlastsForClub(clubId: number) {
    const emailBlastsForClub = Array.from(this.emailBlasts.values()).filter(
      (blast) => blast.clubId === clubId
    );

    for (const emailBlast of emailBlastsForClub) {
      this.emailBlasts.delete(emailBlast.id);
    }
  }

  public setMembershipAsLead(membershipId: bigint) {
    const membershipState = this.getMembershipState(membershipId);
    this.memberships.set(membershipId, {
      ...membershipState,
      role: "LEAD"
    });
  }

  public clearMembershipRole(membershipId: bigint) {
    const membershipState = this.getMembershipState(membershipId);
    this.memberships.set(membershipId, {
      ...membershipState,
      role: "MEMBER"
    });
  }
}
