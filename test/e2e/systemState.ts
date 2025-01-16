import {
    ApplicationQuestions, Club,
    CreateClubInput, CreateUserInput, 
    InstagramHandle, MembershipTier, UpdateClubInput, 
    UpdateUserInput, URL, UpdateClubApplicationQuestionsInput,
    type User,
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
            membershipTiers: clubState.membershipTierIds.map(id => this.getMembershipTier(id)),
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

    public getMembershipTier(id: number): MembershipTier {
        const membershipTier = this.membershipTiers.get(id);
        if (!membershipTier) {
            throw new Error(`membership tier with id ${id} was expected`);
        }
        return membershipTier;
    }
}
