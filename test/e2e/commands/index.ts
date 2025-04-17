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
    createStripeAccountCommands()
  ];
};

function createUserCommands() {
  return record({
    firstName: string().filter((s) => isZodType(s, FirstNameSchema)),
    lastName: string().filter((s) => isZodType(s, LastNameSchema)),
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

function createClubCommands() {
  return record({
    name: string(),
    publicId: string().filter((s) => isZodType(s, ClubPublicIdSchema)),
    tagLine: string(),
    description: string(),
    websiteUrl: option(webUrl(), { freq: 4 }),
    instagramHandle: option(
      string().filter((s) => isZodType(s, InstagramHandleSchema)),
      { freq: 4 }
    ),
    eventCalendarUrl: option(webUrl(), { freq: 4 }),
    userIdSelector: itemSelector<number>(),
    faqs: oneof(
      record({
        items: array(record({
          question: string().filter(s => s.length >= 3 && s.length <= 2000),
          answer: string().filter(s => s.length >= 3 && s.length <= 20000)
        }), { maxLength: 5 })
      }),
      constant({ items: [] }),
      constant({ 
        items: [{ 
          question: "abc", 
          answer: "def" 
        }] 
      }),
      constant({
        items: [{
          question: "This is a longer question that spans multiple paragraphs.\n\nIt has line breaks and represents a more complex question scenario that might occur in real-world usage.",
          answer: "This is a comprehensive answer that spans multiple paragraphs.\n\nIt includes several distinct points and explanations.\n\nThe format allows for detailed responses with proper spacing between thoughts.\n\nThis tests the system's ability to handle and display structured content."
        }]
      }),
      constant(undefined)
    )
  }).map(
    (i) =>
      new CreateClubCommand(
        {
          name: i.name,
          publicId: i.publicId,
          tagLine: i.tagLine,
          description: i.description,
          websiteUrl: i.websiteUrl,
          instagramHandle: i.instagramHandle,
          eventCalendarUrl: i.eventCalendarUrl,
          faqs: i.faqs
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
    faqs: oneof(
      record({
        items: array(record({
          question: string().filter(s => s.length >= 3 && s.length <= 2000),
          answer: string().filter(s => s.length >= 3 && s.length <= 20000)
        }), { maxLength: 10 })
      }),
      constant({ items: [] }),
      constant({ 
        items: [{ 
          question: "abc", 
          answer: "def" 
        }] 
      }),
      constant({ 
        items: Array(20).fill(0).map((_, i) => ({ 
          question: `Question ${i+1}`, 
          answer: `Answer ${i+1}` 
        }))
      }),
      constant({ 
        items: [{ 
          question: "A very long question that spans multiple paragraphs and approaches the maximum allowed length.\n\nIt includes line breaks to test formatting and display capabilities of the interface.\n\nThis helps ensure that the UI can properly render structured content.",
          answer: "A very long answer that spans multiple paragraphs to test the system's ability to handle extensive content.\n\nParagraph 2: Additional information that might be needed for a comprehensive answer.\n\nParagraph 3: More details about the topic at hand and how it relates to the club's activities.\n\nParagraph 4: Examples or case studies that illustrate the point being made.\n\nParagraph 5: Background information that provides context for the answer.\n\nParagraph 6: Technical details or specifications that might be relevant.\n\nParagraph 7: References or citations to external resources for further reading.\n\nParagraph 8: Concluding remarks that summarize the key points and provide a final perspective on the question."
        }] 
      }),
      constant({
        items: [
          { question: "Short Q", answer: "Short A" },
          { 
            question: "Long question with detailed context that includes multiple paragraphs?\n\nThis is the second paragraph of the question.",
            answer: "Long detailed answer that contains multiple paragraphs to test rendering and storage.\n\nSecond paragraph providing more details.\n\nThird paragraph with additional information.\n\nFourth paragraph expanding on the concept."
          }
        ]
      })
    )
  }).map(
    (i) =>
      new UpdateClubCommand(
        {
          name: i.name,
          publicId: i.publicId,
          tagLine: i.tagLine,
          description: i.description,
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
