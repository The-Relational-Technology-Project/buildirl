import {
  Arbitrary,
  array,
  boolean,
  constant,
  emailAddress,
  integer,
  oneof,
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
  FAQAnswerSchema,
  FAQQuestionSchema
} from "~/server/club/types";
import {
  InstagramHandleSchema,
  RequiredStringSchema
} from "~/server/utils/types";
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
import PublishMembershipTierCommand from "./publishMembershipTierCommand";
import UnpublishMembershipTierCommand from "./unpublishMembershipTierCommand";
import DeleteClubCommand from "./deleteClubCommand";
import {
  FONT_SELECTION,
  TEMPLATE_THEME_SELECTION
} from "~/client/theme/templates";
import UpdateClubDisplayImageUrlsCommand from "./updateClubDisplayImageUrlsCommand";
import SetMembershipAsWelcomedCommand from "./setMembershipAsWelcomedCommand";
import CreateStripeAccountCommand from "./createStripeAccountCommand";
import FollowClubCommand from "./followClubCommand";
import UnfollowClubCommand from "./unfollowClubCommand";
import { CitySchema } from "~/server/club/types/location";
import { EmailTemplateType } from "~/server/email/types";
import SetEmailTemplateCommand from "./setEmailTemplateCommand";
import DeleteEmailTemplateCommand from "./deleteEmailTemplateCommand";

export const allCommands = () => {
  return [
    createUserCommands(),
    updateUserCommands(),
    createClubCommands(),
    updateClubCommands(),
    deleteClubCommands(),
    updateClubApplicationQuestionsCommands(),
    updateClubDisplayImageUrlsCommands(),
    createMembershipTierCommands(),
    updateMembershipTierCommands(),
    deleteMembershipTierCommands(),
    publishMembershipTierCommands(),
    unpublishMembershipTierCommands(),
    submitMembershipApplicationCommands(),
    approveMembershipApplicationCommands(),
    declineMembershipApplicationCommands(),
    deactivateMembershipCommands(),
    setMembershipAsWelcomedCommands(),
    createStripeAccountCommands(),
    followClubCommands(),
    unfollowClubCommands(),
    setEmailTemplateCommands(),
    deleteEmailTemplateCommands()
  ];
};

function createUserCommands() {
  return record({
    firstName: string().filter((s) => isZodType(s, RequiredStringSchema)),
    lastName: string().filter((s) => isZodType(s, RequiredStringSchema)),
    description: string(),
    authUserId: uuid(),
    authEmail: emailAddress()
  }).map(
    (i) =>
      new CreateUserCommand(
        {
          firstName: i.firstName,
          lastName: i.lastName,
          description: i.description
        },
        i.authUserId,
        i.authEmail
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

function locationArbitrary() {
  return oneof(...Array.from(CitySchema.options).map(constant));
}

function createClubCommands() {
  return record({
    name: string(),
    publicId: string().filter((s) => isZodType(s, ClubPublicIdSchema)),
    location: locationArbitrary(),
    tagLine: string(),
    description: string(),
    websiteUrl: option(webUrl(), { freq: 4 }),
    instagramHandle: option(
      string().filter((s) => isZodType(s, InstagramHandleSchema)),
      { freq: 4 }
    ),
    eventCalendarUrl: option(webUrl(), { freq: 4 }),
    userIdSelector: itemSelector<number>()
  }).map(
    (i) =>
      new CreateClubCommand(
        {
          name: i.name,
          publicId: i.publicId,
          location: i.location
        },
        i.userIdSelector
      )
  );
}

function faqsArbitrary() {
  return record({
    items: array(
      record({
        question: string().filter((s) => isZodType(s, FAQQuestionSchema)),
        answer: string().filter((s) => isZodType(s, FAQAnswerSchema))
      }),
      { maxLength: 5 }
    )
  });
}

function updateClubCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    name: string().filter((s) => isZodType(s, ClubNameSchema)),
    publicId: string().filter((s) => isZodType(s, ClubPublicIdSchema)),
    tagLine: string(),
    description: string(),
    location: locationArbitrary(),
    websiteUrl: option(webUrl(), { freq: 4 }),
    instagramHandle: option(
      string().filter((s) => isZodType(s, InstagramHandleSchema)),
      { freq: 4 }
    ),
    eventCalendarUrl: option(webUrl(), { freq: 4 }),
    theme: option(
      oneof(...Object.values(TEMPLATE_THEME_SELECTION).map(constant)),
      { freq: 4 }
    ),
    themeHeadingFont: option(oneof(...FONT_SELECTION.map(constant)), {
      freq: 4
    }),
    faqs: faqsArbitrary()
  }).map(
    (i) =>
      new UpdateClubCommand(
        {
          name: i.name,
          publicId: i.publicId,
          tagLine: i.tagLine,
          description: i.description,
          location: i.location,
          websiteUrl: i.websiteUrl,
          instagramHandle: i.instagramHandle,
          eventCalendarUrl: i.eventCalendarUrl,
          theme: i.theme,
          themeHeadingFont: i.themeHeadingFont,
          faqs: i.faqs
        },
        i.clubIdSelector
      )
  );
}

function deleteClubCommands() {
  return record({
    clubIdSelector: itemSelector<number>()
  }).map((i) => new DeleteClubCommand(i.clubIdSelector));
}

function updateClubApplicationQuestionsCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    // TODO
    applicationQuestions: constant({ questions: [] })
  }).map(
    (i) =>
      new UpdateClubApplicationQuestionsCommand(
        { applicationQuestions: i.applicationQuestions },
        i.clubIdSelector
      )
  );
}

function updateClubDisplayImageUrlsCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    displayImageUrls: array(webUrl())
  }).map(
    (i) =>
      new UpdateClubDisplayImageUrlsCommand(
        { displayImageUrls: i.displayImageUrls },
        i.clubIdSelector
      )
  );
}

function monetaryValue(): Arbitrary<number> {
  return (
    // generate values between $0.01 to $1000.00 dollars
    integer({ min: 1, max: 100000 })
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
    costPerMonthInUSD: monetaryValue(),
    initiationFeeCostPerMonthInUSD: option(monetaryValue(), { freq: 2 })
  }).map(
    (i) =>
      new CreateMembershipTierCommand(
        {
          name: i.name,
          benefitDescription: i.benefitDescription,
          contributionDescription: i.contributionDescription,
          costPerMonthInUSD: i.costPerMonthInUSD,
          initiationFeeCostInUSD: i.initiationFeeCostPerMonthInUSD
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
    costPerMonthInUSD: monetaryValue(),
    initiationFeeCostInUSD: option(monetaryValue(), { freq: 4 })
  }).map(
    (i) =>
      new UpdateMembershipTierCommand(
        {
          name: i.name,
          benefitDescription: i.benefitDescription,
          contributionDescription: i.contributionDescription,
          costPerMonthInUSD: i.costPerMonthInUSD,
          initiationFeeCostInUSD: i.initiationFeeCostInUSD
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

function publishMembershipTierCommands() {
  return record({
    membershipTierIdSelector: itemSelector<number>()
  }).map((i) => new PublishMembershipTierCommand(i.membershipTierIdSelector));
}

function unpublishMembershipTierCommands() {
  return record({
    membershipTierIdSelector: itemSelector<number>()
  }).map((i) => new UnpublishMembershipTierCommand(i.membershipTierIdSelector));
}

function submitMembershipApplicationCommands() {
  return record({
    membershipTierIdSelector: itemSelector<number>(),
    userIdSelector: itemSelector<number>(),
    // TODO
    applicationResponses: constant({ responses: [] }),
    shareEmail: constant(true)
  }).map(
    (i) =>
      new SubmitMembershipApplicationCommand(
        {
          applicationResponses: i.applicationResponses,
          shareEmail: i.shareEmail
        },
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
    membershipIdSelector: itemSelector<bigint>(),
    byClubOwner: boolean()
  }).map(
    (i) =>
      new DeactivateMembershipCommand(i.membershipIdSelector, {
        byClubOwner: i.byClubOwner
      })
  );
}

function setMembershipAsWelcomedCommands() {
  return record({
    membershipIdSelector: itemSelector<bigint>()
  }).map((i) => new SetMembershipAsWelcomedCommand(i.membershipIdSelector));
}

function createStripeAccountCommands() {
  return record({
    clubIdSelector: itemSelector<number>()
  }).map((i) => new CreateStripeAccountCommand(i.clubIdSelector));
}

function followClubCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    userIdSelector: itemSelector<number>()
  }).map((i) => new FollowClubCommand(i.clubIdSelector, i.userIdSelector));
}

function unfollowClubCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    userIdSelector: itemSelector<number>()
  }).map((i) => new UnfollowClubCommand(i.clubIdSelector, i.userIdSelector));
}

function setEmailTemplateCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    templateType: oneof(
      ...["ACCEPTANCE", "DEPARTURE", "REJECTION"].map((v) =>
        constant(v as EmailTemplateType)
      )
    ),
    subject: string({ maxLength: 200 }),
    htmlContent: string({ maxLength: 20000 }),
    textContent: string({ maxLength: 20000 })
  }).map(
    (i) =>
      new SetEmailTemplateCommand(i.clubIdSelector, i.templateType, {
        subject: i.subject,
        htmlContent: i.htmlContent,
        textContent: i.textContent
      })
  );
}

function deleteEmailTemplateCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    templateTypeSelector: itemSelector<EmailTemplateType>()
  }).map(
    (i) =>
      new DeleteEmailTemplateCommand(i.clubIdSelector, i.templateTypeSelector)
  );
}
