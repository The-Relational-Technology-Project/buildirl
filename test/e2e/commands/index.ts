import {constant, double, option, record, string, uuid, webUrl} from "fast-check";
import CreateUserCommand from "./createUserCommand";
import {
    ClubNameSchema,
    ClubPublicIdSchema,
    FirstNameSchema,
    InstagramHandleSchema,
    LastNameSchema
} from "~/server/service/types";
import UpdateUserCommand from "./updateUserCommand";
import itemSelector from "../utils/itemSelector";
import CreateClubCommand from "./createClubCommand";
import {isZodType} from "~/utils/zod";
import UpdateClubCommand from "./updateClubCommand";
import UpdateClubApplicationQuestionsCommand from "./updateClubApplicationQuestionsCommand";
import CreateMembershipTierCommand from "./createMembershipTierCommand";
import UpdateMembershipTierCommand from "./updateMembershipTierCommand";

export const allCommands = () => {
    return [
        createUserCommands(),
        updateUserCommands(),
        createClubCommands(),
        updateClubCommands(),
        updateClubApplicationQuestionsCommands(),
        createMembershipTierCommands(),
        updateMembershipTierCommands()
    ];
};

function createUserCommands() {
    return record({
        firstName: string().filter((s) => isZodType(s, FirstNameSchema)),
        lastName: string().filter((s) => isZodType(s, LastNameSchema)),
        description: string(),
        authUserId: uuid()
    }).map(
        (i) =>
            new CreateUserCommand(
                {
                    firstName: i.firstName,
                    lastName: i.lastName,
                    description: i.description
                },
                i.authUserId
            )
    );
}

function updateUserCommands() {
    return record({
        userIdSelector: itemSelector<number>(),
        description: string(),
    }).map(
        (i) =>
            new UpdateUserCommand(
                {
                    description: i.description
                },
                i.userIdSelector
            )
    );
}

function createClubCommands() {
    return record({
        name: string(),
        publicId: string().filter((s) => isZodType(s, ClubPublicIdSchema)),
        tagLine: string(),
        description: string(),
        websiteURL: option(webUrl(), {freq: 4}),
        instagramHandle: option(string().filter(s => isZodType(s, InstagramHandleSchema)), {freq: 4}),
        eventCalendarURL: option(webUrl(), {freq: 4}),
        userIdSelector: itemSelector<number>()
    }).map(
        (i) => new CreateClubCommand({
            name: i.name,
            publicId: i.publicId,
            tagLine: i.tagLine,
            description: i.description,
            websiteURL: i.websiteURL,
            instagramHandle: i.instagramHandle,
            eventCalendarURL: i.eventCalendarURL
        }, i.userIdSelector)
    );
}

function updateClubCommands() {
    return record({
        clubIdSelector: itemSelector<number>(),
        name: string().filter((s) => isZodType(s, ClubNameSchema)),
        publicId: string().filter((s) => isZodType(s, ClubPublicIdSchema)),
        tagLine: string(),
        description: string(),
        websiteURL: option(webUrl(), {freq: 4}),
        instagramHandle: option(string().filter(s => isZodType(s, InstagramHandleSchema)), {freq: 4}),
        eventCalendarURL: option(webUrl(), {freq: 4}),
    }).map(
        (i) => new UpdateClubCommand({
            name: i.name,
            publicId: i.publicId,
            tagLine: i.tagLine,
            description: i.description,
            websiteURL: i.websiteURL,
            instagramHandle: i.instagramHandle,
            eventCalendarURL: i.eventCalendarURL
        }, i.clubIdSelector)
    );
}

function updateClubApplicationQuestionsCommands() {
    return record({
        clubIdSelector: itemSelector<number>(),
        // TODO
        applicationQuestions: constant({})
    }).map(
        (i) => new UpdateClubApplicationQuestionsCommand(
            {applicationQuestions: i.applicationQuestions},
            i.clubIdSelector)
    );
}

function toHundredthPrecision(i: number) {
    return Number(i.toFixed(2));
}

function createMembershipTierCommands() {
    return record({
        clubIdSelector: itemSelector<number>(),
        name: string(),
        benefitDescription: string(),
        contributionDescription: string(),
        costPerMonthInUSD: double({min: 0})
            // round to 2 decimals for now
            .map(n => toHundredthPrecision(2))
    }).map(
        (i) => new CreateMembershipTierCommand(
            {
                name: i.name,
                benefitDescription: i.benefitDescription,
                contributionDescription: i.contributionDescription,
                costPerMonthInUSD: i.costPerMonthInUSD
            },
            i.clubIdSelector)
    );
}

function updateMembershipTierCommands() {
    return record({
        membershipTierIdSelector: itemSelector<number>(),
        name: string(),
        benefitDescription: string(),
        contributionDescription: string()
    }).map(
        (i) => new UpdateMembershipTierCommand({
            name: i.name, 
            benefitDescription: i.benefitDescription, 
            contributionDescription: i.contributionDescription
        }, 
            i.membershipTierIdSelector)
    );
}
