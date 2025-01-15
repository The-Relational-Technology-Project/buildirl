import { record, string, uuid } from "fast-check";
import CreateUserCommand from "./createUserCommand";
import {
  FIRST_NAME_REGEX,
  LAST_NAME_REGEX,
} from "~/server/service/types";

export const allCommands = () => {
  return [
    createUserCommands()
  ];
};

function createUserCommands() {
  return record({
    firstName: string({ minLength: 2 }).filter((s) => FIRST_NAME_REGEX.test(s)),
    lastName: string({ minLength: 2 }).filter((s) => LAST_NAME_REGEX.test(s)),
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