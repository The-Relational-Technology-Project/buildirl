import {option, record, string, stringMatching, uuid, webUrl} from "fast-check";
import CreateUserCommand from "./createUserCommand";
import {
    CLUB_PUBLIC_ID_REGEX,
    ClubNameSchema,
    ClubPublicIdSchema,
    FIRST_NAME_REGEX,
    FirstNameSchema,
    INSTAGRAM_HANDLE_REGEX,
    InstagramHandleSchema,
    LAST_NAME_REGEX,
    LastNameSchema
} from "~/server/service/types";
import UpdateUserCommand from "./updateUserCommand";
import itemSelector from "../utils/itemSelector";
import CreateClubCommand from "./createClubCommand";
import {isZodType} from "~/utils/zod";
import UpdateClubCommand from "./updateClubCommand";

export const allCommands = () => {
    return [
        createUserCommands(),
        updateUserCommands(),
        createClubCommands(),
        updateClubCommands()
    ];
};

function createUserCommands() {
    return record({
        firstName: stringMatching(FIRST_NAME_REGEX).filter((s) => isZodType(s, FirstNameSchema)),
        lastName: stringMatching(LAST_NAME_REGEX).filter((s) => isZodType(s, LastNameSchema)),
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
        publicId: stringMatching(CLUB_PUBLIC_ID_REGEX).filter((s) => isZodType(s, ClubPublicIdSchema)),
        tagLine: string(),
        description: string(),
        websiteURL: option(webUrl(), {freq: 4}),
        instagramHandle: option(stringMatching(INSTAGRAM_HANDLE_REGEX).filter(s => isZodType(s, InstagramHandleSchema)), {freq: 4}),
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
        publicId: stringMatching(CLUB_PUBLIC_ID_REGEX).filter((s) => isZodType(s, ClubPublicIdSchema)),
        tagLine: string(),
        description: string(),
        websiteURL: option(webUrl(), {freq: 4}),
        instagramHandle: option(stringMatching(INSTAGRAM_HANDLE_REGEX).filter(s => isZodType(s, InstagramHandleSchema)), {freq: 4}),
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
