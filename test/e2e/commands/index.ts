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
  ContributionReasonSchema,
  ClubPublicIdSchema,
  ClubValueSchema,
  DateStringSchema,
  FAQAnswerSchema,
  FAQQuestionSchema,
  TimeStringSchema
} from "~/server/club/types";
import {
  InstagramHandleSchema,
  HexColorSchema,
  RequiredStringSchema,
  TwitterHandleSchema,
  FacebookHandleSchema,
  LinkedInHandleSchema
} from "~/server/utils/types";
import { BillingInterval } from "~/utils/types";
import UpdateUserCommand from "./updateUserCommand";
import UpdateUserSocialsCommand from "./updateUserSocialsCommand";
import itemSelector from "../utils/itemSelector";
import CreateClubCommand from "./createClubCommand";
import { isZodType } from "~/utils/zod";
import { z } from "zod";
import UpdateClubCommand from "./updateClubCommand";
import UpdateClubApplicationQuestionsCommand from "./updateClubApplicationQuestionsCommand";
import CreateMembershipTierCommand from "./createMembershipTierCommand";
import UpdateMembershipTierCommand from "./updateMembershipTierCommand";
import SubmitMembershipApplicationCommand from "./submitMembershipApplicationCommand";
import ApproveMembershipApplicationCommand from "./approveMembershipApplicationCommand";
import DeclineMembershipApplicationCommand from "./declineMembershipApplicationCommand";
import WithdrawMembershipApplicationCommand from "./withdrawMembershipApplicationCommand";
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
import CreateEmailBlastCommand from "./createEmailBlastCommand";
import UpdateEmailBlastCommand from "./updateEmailBlastCommand";
import DeleteEmailBlastCommand from "./deleteEmailBlastCommand";
import SendEmailBlastCommand from "./sendEmailBlastCommand";
import SetMembershipAsLeadCommand from "./setMembershipAsLeadCommand";
import ClearMembershipRoleCommand from "./clearMembershipRoleCommand";
import { EMAIL_CONTENT_LIMITS } from "~/server/email/types";
import UpdateMembershipTierForMembershipCommand from "./updateMembershipTierForMembershipCommand";
import CreateMembershipCampaignCommand from "./createMembershipCampaignCommand";
import UpdateMembershipCampaignCommand from "./updateMembershipCampaignCommand";
import DeleteMembershipCampaignCommand from "./deleteMembershipCampaignCommand";
import { CampaignBudgetItem } from "~/server/membershipCampaign/types";
import { dateStringArbitrary, timeStringArbitrary } from "../utils/clubUtils";

export const allCommands = () => {
  return [
    createUserCommands(),
    updateUserCommands(),
    updateUserSocialsCommands(),
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
    withdrawMembershipApplicationCommands(),
    deactivateMembershipCommands(),
    setMembershipAsWelcomedCommands(),
    createStripeAccountCommands(),
    followClubCommands(),
    unfollowClubCommands(),
    setEmailTemplateCommands(),
    deleteEmailTemplateCommands(),
    setAsLeadCommands(),
    clearRoleCommands(),
    createEmailBlastCommands(),
    updateEmailBlastCommands(),
    deleteEmailBlastCommands(),
    sendEmailBlastCommands(),
    updateMembershipTierForMembershipCommands(),
    createMembershipCampaignCommands(),
    updateMembershipCampaignCommands(),
    deleteMembershipCampaignCommands()
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
    firstName: string(),
    lastName: string(),
    description: string()
  }).map(
    (i) =>
      new UpdateUserCommand(
        {
          firstName: i.firstName,
          lastName: i.lastName,
          description: i.description
        },
        i.userIdSelector
      )
  );
}

function socialHandleArbitrary<T extends z.ZodSchema>(
  schema: T
): Arbitrary<string> {
  return string().filter((s) => isZodType(s, schema));
}

function updateUserSocialsCommands() {
  return record({
    userIdSelector: itemSelector<number>(),
    twitter: option(socialHandleArbitrary(TwitterHandleSchema), { freq: 3 }),
    instagram: option(socialHandleArbitrary(InstagramHandleSchema), {
      freq: 3
    }),
    facebook: option(socialHandleArbitrary(FacebookHandleSchema), { freq: 3 }),
    linkedin: option(socialHandleArbitrary(LinkedInHandleSchema), { freq: 3 }),
    website: option(webUrl(), { freq: 3 })
  }).map(
    (i) =>
      new UpdateUserSocialsCommand(
        {
          twitter: i.twitter ?? null,
          instagram: i.instagram ?? null,
          facebook: i.facebook ?? null,
          linkedin: i.linkedin ?? null,
          website: i.website ?? null
        },
        i.userIdSelector
      )
  );
}

function locationArbitrary() {
  return oneof(...Array.from(CitySchema.options).map(constant));
}

function frequencyArbitrary() {
  return oneof(constant("WEEKLY"), constant("BIWEEKLY"), constant("MONTHLY"));
}

function createClubCommands() {
  return record({
    name: string(),
    // make it length 10 to avoid collisions across runs
    publicId: string({ minLength: 10 }).filter((s) =>
      isZodType(s, ClubPublicIdSchema)
    ),
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

function contributionReasonsArbitrary() {
  return record({
    items: array(
      record({
        label: string()
          .filter((s) => isZodType(s, ContributionReasonSchema.shape.label))
          .filter((s) => s.length <= 10),
        description: string().filter((s) =>
          isZodType(s, ContributionReasonSchema.shape.description)
        ),
        coverImageUrl: option(webUrl(), { freq: 4, nil: null }).filter((s) =>
          isZodType(s, ContributionReasonSchema.shape.coverImageUrl)
        )
      }),
      { maxLength: 5 }
    )
  });
}

function updateClubCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    name: string().filter((s) => isZodType(s, ClubNameSchema)),
    // make it length 10 to avoid collisions across runs
    publicId: string({ minLength: 10 }).filter((s) =>
      isZodType(s, ClubPublicIdSchema)
    ),
    tagLine: string(),
    description: string(),
    location: locationArbitrary(),
    rhythm: record({
      startDate: dateStringArbitrary.filter((s) =>
        isZodType(s, DateStringSchema)
      ),
      startTime: timeStringArbitrary.filter((s) =>
        isZodType(s, TimeStringSchema)
      ),
      frequency: frequencyArbitrary()
    }),
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
    accentColor: option(
      string().filter((s) => isZodType(s, HexColorSchema)),
      { freq: 4 }
    ),
    contributionReasons: contributionReasonsArbitrary(),
    values: record({
      items: array(
        record({
          icon: string().filter((s) =>
            isZodType(s, ClubValueSchema.shape.icon)
          ),
          title: string()
            .filter((s) => isZodType(s, ClubValueSchema.shape.title))
            .filter((s) => s.length <= 30),
          description: string()
            .filter((s) => isZodType(s, ClubValueSchema.shape.description))
            .filter((s) => s.length <= 160)
        }),
        { maxLength: 5 }
      )
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
          rhythm: i.rhythm,
          websiteUrl: i.websiteUrl,
          instagramHandle: i.instagramHandle,
          eventCalendarUrl: i.eventCalendarUrl,
          theme: i.theme,
          themeHeadingFont: i.themeHeadingFont,
          accentColor: i.accentColor,
          contributionReasons: i.contributionReasons,
          values: i.values,
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
function billingIntervalArbitrary() {
  return oneof(
    constant(BillingInterval.MONTHLY),
    constant(BillingInterval.QUARTERLY),
    constant(BillingInterval.SEMI_ANNUAL)
  );
}

function createMembershipTierCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    name: string(),
    benefitDescription: string(),
    contributionDescription: string(),
    costPerBillingInterval: monetaryValue(),
    billingInterval: billingIntervalArbitrary(),
    initiationFeeCostInUSD: option(monetaryValue(), { freq: 2 })
  }).map(
    (i) =>
      new CreateMembershipTierCommand(
        {
          name: i.name,
          benefitDescription: i.benefitDescription,
          contributionDescription: i.contributionDescription,
          costPerBillingInterval: i.costPerBillingInterval,
          billingInterval: i.billingInterval,
          initiationFeeCostInUSD: i.initiationFeeCostInUSD
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
    costPerBillingInterval: monetaryValue(),
    billingInterval: billingIntervalArbitrary(),
    initiationFeeCostInUSD: option(monetaryValue(), { freq: 4 })
  }).map(
    (i) =>
      new UpdateMembershipTierCommand(
        {
          name: i.name,
          benefitDescription: i.benefitDescription,
          contributionDescription: i.contributionDescription,
          costPerBillingInterval: i.costPerBillingInterval,
          billingInterval: i.billingInterval,
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

function withdrawMembershipApplicationCommands() {
  return record({
    membershipIdSelector: itemSelector<bigint>()
  }).map(
    (i) => new WithdrawMembershipApplicationCommand(i.membershipIdSelector)
  );
}

function deactivateMembershipCommands() {
  return record({
    membershipIdSelector: itemSelector<bigint>(),
    byClubLead: boolean()
  }).map(
    (i) =>
      new DeactivateMembershipCommand(i.membershipIdSelector, {
        byClubLead: i.byClubLead
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
    subject: string({ maxLength: EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH }),
    htmlContent: string({
      maxLength: EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH
    }),
    textContent: string({
      maxLength: EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH
    })
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

function createEmailBlastCommands() {
  return record({
    clubIdSelector: itemSelector<number>(),
    subject: string({ maxLength: EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH }),
    htmlContent: string({
      maxLength: EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH
    }),
    textContent: string({
      maxLength: EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH
    })
  }).map(
    (i) =>
      new CreateEmailBlastCommand(
        {
          subject: i.subject,
          htmlContent: i.htmlContent,
          textContent: i.textContent
        },
        i.clubIdSelector
      )
  );
}

function updateEmailBlastCommands() {
  return record({
    emailBlastIdSelector: itemSelector<bigint>(),
    subject: string({ maxLength: EMAIL_CONTENT_LIMITS.SUBJECT_MAX_LENGTH }),
    htmlContent: string({
      maxLength: EMAIL_CONTENT_LIMITS.HTML_CONTENT_MAX_LENGTH
    }),
    textContent: string({
      maxLength: EMAIL_CONTENT_LIMITS.TEXT_CONTENT_MAX_LENGTH
    })
  }).map(
    (i) =>
      new UpdateEmailBlastCommand(i.emailBlastIdSelector, {
        subject: i.subject,
        htmlContent: i.htmlContent,
        textContent: i.textContent
      })
  );
}

function deleteEmailBlastCommands() {
  return record({
    emailBlastIdSelector: itemSelector<bigint>()
  }).map((i) => new DeleteEmailBlastCommand(i.emailBlastIdSelector));
}

function sendEmailBlastCommands() {
  return record({
    emailBlastIdSelector: itemSelector<bigint>()
  }).map((i) => new SendEmailBlastCommand(i.emailBlastIdSelector));
}

function setAsLeadCommands() {
  return record({
    membershipIdSelector: itemSelector<bigint>()
  }).map((i) => new SetMembershipAsLeadCommand(i.membershipIdSelector));
}

function clearRoleCommands() {
  return record({
    membershipIdSelector: itemSelector<bigint>()
  }).map((i) => new ClearMembershipRoleCommand(i.membershipIdSelector));
}

function updateMembershipTierForMembershipCommands() {
  return record({
    membershipIdSelector: itemSelector<bigint>(),
    newMembershipTierIdSelector: itemSelector<number>()
  }).map(
    (i) =>
      new UpdateMembershipTierForMembershipCommand(
        i.membershipIdSelector,
        i.newMembershipTierIdSelector
      )
  );
}

function aDayWithinTheNextTwoMonths(): Arbitrary<Date> {
  return integer({ min: 10, max: 30 }).map(
    (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  );
}

function budgetItems(): Arbitrary<Array<CampaignBudgetItem>> {
  return array(
    record({
      label: string().filter((s) => isZodType(s, RequiredStringSchema)),
      costPerMonthInUSD: monetaryValue()
    }),
    { minLength: 1, maxLength: 5 }
  );
}

function createMembershipCampaignCommands() {
  const arbitraryDate = aDayWithinTheNextTwoMonths();
  return record({
    clubIdSelector: itemSelector<number>(),
    budgetItems: budgetItems(),
    targetNumberOfMemberships: integer({ min: 2, max: 999 }),
    targetDate: arbitraryDate
  }).map(
    (i) =>
      new CreateMembershipCampaignCommand(
        {
          budgetItems: i.budgetItems,
          targetNumberOfMemberships: i.targetNumberOfMemberships,
          targetDate: i.targetDate
        },
        i.clubIdSelector
      )
  );
}

function updateMembershipCampaignCommands() {
  return record({
    membershipCampaignIdSelector: itemSelector<number>(),
    budgetItems: budgetItems(),
    targetNumberOfMemberships: integer({ min: 2, max: 999 }),
    targetDate: aDayWithinTheNextTwoMonths()
  }).map(
    (i) =>
      new UpdateMembershipCampaignCommand(
        {
          budgetItems: i.budgetItems,
          targetNumberOfMemberships: i.targetNumberOfMemberships,
          targetDate: i.targetDate
        },
        i.membershipCampaignIdSelector
      )
  );
}

function deleteMembershipCampaignCommands() {
  return record({
    campaignIdSelector: itemSelector<number>()
  }).map((i) => new DeleteMembershipCampaignCommand(i.campaignIdSelector));
}
