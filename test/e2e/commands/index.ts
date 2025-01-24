import {
  Arbitrary,
  constant,
  float,
  integer,
  option,
  record,
  string,
  uuid,
  webUrl
} from "fast-check";
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
import { isZodType } from "~/utils/zod";
import UpdateClubCommand from "./updateClubCommand";
import UpdateClubApplicationQuestionsCommand from "./updateClubApplicationQuestionsCommand";
import CreateMembershipTierCommand from "./createMembershipTierCommand";
import UpdateMembershipTierCommand from "./updateMembershipTierCommand";
import SubmitMembershipApplicationCommand from "./submitMembershipApplicationCommand";
import ApproveMembershipApplicationCommand from "./approveMembershipApplicationCommand";
import DeclineMembershipApplicationCommand from "./declineMembershipApplicationCommand";
import DeactivateMembershipCommand from "./deactivateMembershipCommand";
import DeleteMembershipTierCommand from "./deleteMembershipTierCommand";

export const allCommands = () => {
  return [
    createUserCommands(),
    updateUserCommands(),
    createClubCommands(),
    updateClubCommands(),
    updateClubApplicationQuestionsCommands(),
    createMembershipTierCommands(),
    updateMembershipTierCommands(),
    deleteMembershipTierCommands(),
    submitMembershipApplicationCommands(),
    approveMembershipApplicationCommands(),
    declineMembershipApplicationCommands(),
    deactivateMembershipCommands()
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
    description: string()
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
    websiteURL: option(webUrl(), { freq: 4 }),
    instagramHandle: option(
      string().filter((s) => isZodType(s, InstagramHandleSchema)),
      { freq: 4 }
    ),
    eventCalendarURL: option(webUrl(), { freq: 4 }),
    userIdSelector: itemSelector<number>()
  }).map(
    (i) =>
      new CreateClubCommand(
        {
          name: i.name,
          publicId: i.publicId,
          tagLine: i.tagLine,
          description: i.description,
          websiteURL: i.websiteURL,
          instagramHandle: i.instagramHandle,
          eventCalendarURL: i.eventCalendarURL
        },
        i.userIdSelector
      )
  );
}

function updateClubCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    name: string().filter((s) => isZodType(s, ClubNameSchema)),
    publicId: string().filter((s) => isZodType(s, ClubPublicIdSchema)),
    tagLine: string(),
    description: string(),
    websiteURL: option(webUrl(), { freq: 4 }),
    instagramHandle: option(
      string().filter((s) => isZodType(s, InstagramHandleSchema)),
      { freq: 4 }
    ),
    eventCalendarURL: option(webUrl(), { freq: 4 })
  }).map(
    (i) =>
      new UpdateClubCommand(
        {
          name: i.name,
          publicId: i.publicId,
          tagLine: i.tagLine,
          description: i.description,
          websiteURL: i.websiteURL,
          instagramHandle: i.instagramHandle,
          eventCalendarURL: i.eventCalendarURL
        },
        i.clubIdSelector
      )
  );
}

function updateClubApplicationQuestionsCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    // TODO
    applicationQuestions: constant({})
  }).map(
    (i) =>
      new UpdateClubApplicationQuestionsCommand(
        { applicationQuestions: i.applicationQuestions },
        i.clubIdSelector
      )
  );
}

function monetaryValue(): Arbitrary<number> {
  return (
    // generate values between 0 to $9999.99 dollars
    integer({ min: 0, max: 999999 })
      //  2 decimals
      .map((n) => n / 100)
  );
}

function createMembershipTierCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    name: string(),
    benefitDescription: string(),
    contributionDescription: string(),
    costPerMonthInUSD: monetaryValue()
  }).map(
    (i) =>
      new CreateMembershipTierCommand(
        {
          name: i.name,
          benefitDescription: i.benefitDescription,
          contributionDescription: i.contributionDescription,
          costPerMonthInUSD: i.costPerMonthInUSD
        },
        i.clubIdSelector
      )
  );
}

function updateMembershipTierCommands() {
  return record({
    membershipTierIdSelector: itemSelector<number>(),
    name: string(),
    benefitDescription: string(),
    contributionDescription: string(),
    costPerMonthInUSD: monetaryValue()
  }).map(
    (i) =>
      new UpdateMembershipTierCommand(
        {
          name: i.name,
          benefitDescription: i.benefitDescription,
          contributionDescription: i.contributionDescription,
          costPerMonthInUSD: i.costPerMonthInUSD
        },
        i.membershipTierIdSelector
      )
  );
}

function deleteMembershipTierCommands() {
  return record({
    membershipTierIdSelector: itemSelector<number>()
  }).map((i) => new DeleteMembershipTierCommand(i.membershipTierIdSelector));
}

function submitMembershipApplicationCommands() {
  return record({
    membershipTierIdSelector: itemSelector<number>(),
    userIdSelector: itemSelector<number>(),
    // TODO
    applicationResponses: constant({})
  }).map(
    (i) =>
      new SubmitMembershipApplicationCommand(
        { applicationResponses: i.applicationResponses },
        i.membershipTierIdSelector,
        i.userIdSelector
      )
  );
}

function approveMembershipApplicationCommands() {
  return record({
    membershipIdSelector: itemSelector<bigint>()
  }).map(
    (i) => new ApproveMembershipApplicationCommand(i.membershipIdSelector)
  );
}

function declineMembershipApplicationCommands() {
  return record({
    membershipIdSelector: itemSelector<bigint>()
  }).map(
    (i) => new DeclineMembershipApplicationCommand(i.membershipIdSelector)
  );
}

function deactivateMembershipCommands() {
  return record({
    membershipIdSelector: itemSelector<bigint>()
  }).map((i) => new DeactivateMembershipCommand(i.membershipIdSelector));
}
