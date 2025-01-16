import {
    ApplicationQuestions, Club,
    CreateClubInput, CreateUserInput,
    InstagramHandle, MembershipTier, UpdateClubInput,
    UpdateUserInput, URL, UpdateClubApplicationQuestionsInput,
    type User, CreateMembershipTierInput, UpdateMembershipTierInput,
} from "~/server/service/types";
import {Maybe} from "~/utils/types";

// this differs from Club in mostly that nested entities
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

export class SystemState {
    private readonly users: Map<number, User>;
    private readonly clubs: Map<number, ClubState>;
    private readonly membershipTiers: Map<number, MembershipTier>;

    constructor() {
        this.users = new Map();
        this.clubs = new Map();
        this.membershipTiers = new Map();
    }

    public getUser(id: number): User {
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
            throw new Error(`user with id ${id} already exists`)
        }
        this.users.set(id, {
            id: id,
            ...input}
        );
    }

    public updateUser(id: number, input: UpdateUserInput) {
        const user = this.getUser(id);
        this.users.set(id, {
            ...user,
            description: input.description
        })
    }

    public getClubState(id: number): ClubState {
        const clubState = this.clubs.get(id);
        if (!clubState) {
            throw new Error(`club with id ${id} was expected`);
        }
        return clubState;
    }

    public getClub(id: number): Club {
        const clubState = this.getClubState(id);
        return this.clubStateToClub(clubState);
    }

    private getClubStateBy(filter: (clubState: ClubState) => boolean): ClubState {
        const clubStates = Array.from(this.clubs.values()).filter(filter);
        if (clubStates.length !== 1) {
            throw new Error(`expected 1 club state, got ${clubStates.length}: ${clubStates}`);
        }
        return clubStates[0]!;
    }

    private orderedByCost(membershipTiers: MembershipTier[]): MembershipTier[] {
        return membershipTiers
            // if equal cost, sort by id
            .sort((a, b) => a.id - b.id)
            .sort((a, b) => a.costPerMonthInUSD - b.costPerMonthInUSD);
    }

    public clubStateToClub(clubState: ClubState): Club {
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
            membershipTiers: this.orderedByCost(clubState.membershipTierIds.map(id => this.getMembershipTier(id))),
        };
    }

    public hasClubs(): boolean {
        return this.clubs.size > 0;
    }

    public getClubIds(): number[] {
        return Array.from(this.clubs.keys());
    }

    public getUserOwnedClubs(userId: number): Club[] {
        return Array.from(this.clubs.values())
        .filter(club => club.ownerUserId === userId)
        .map(club => this.clubStateToClub(club));
    }

    public createClub(userId: number, clubId: number, input: CreateClubInput) {
        if (!!this.clubs.get(clubId)) {
            throw new Error(`club with id ${clubId} already exists`)
        }
        this.clubs.set(clubId,
            {
                id: clubId,
                ...input,
                ownerUserId: userId,
                // empty to start
                applicationQuestions: {},
                membershipTierIds: []
            }
        );
    }

    public updateClub(id: number, input: UpdateClubInput) {
        const clubState = this.getClubState(id);
        this.clubs.set(id, {
            ...clubState,
            ...input
        });
    }

    public updateClubApplicationQuestions(id: number, input: UpdateClubApplicationQuestionsInput) {
        const clubState = this.getClubState(id);
        this.clubs.set(id, {
            ...clubState,
            ...input
        });
    }

    public createMembershipTier(membershipTierId: number, clubId: number, input: CreateMembershipTierInput) {
        if (!!this.membershipTiers.get(membershipTierId)) {
            throw new Error(`membership tier with id ${membershipTierId} already exists`)
        }
        this.membershipTiers.set(membershipTierId, {
            id: membershipTierId,
            name: input.name,
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

    public getClubIdForMembershipTier(membershipTierId: number): number {
        const club = this.getClubStateBy(c => c.membershipTierIds.includes(membershipTierId));
        if (!club) {
            throw new Error(`club with membership tier id ${membershipTierId} was expected`);
        }
        return club.id;
    }
}
