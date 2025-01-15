import {record, string, uuid} from "fast-check";
import CreateUserCommand from "./createUserCommand";
import {
    FIRST_NAME_REGEX,
    LAST_NAME_REGEX,
} from "~/server/service/types";
import UpdateUserCommand from "./updateUserCommand";
import itemSelector from "../utils/itemSelector";

export const allCommands = () => {
    return [
        createUserCommands(),
        updateUserCommands()
    ];
};

function createUserCommands() {
    return record({
        firstName: string({minLength: 2}).filter((s) => FIRST_NAME_REGEX.test(s)),
        lastName: string({minLength: 2}).filter((s) => LAST_NAME_REGEX.test(s)),
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