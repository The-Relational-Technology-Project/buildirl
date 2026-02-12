import {
  Club,
  ContributionReasonsSchema,
  ClubValuesSchema,
  DateString,
  FAQsSchema,
  Rhythm,
  TimeString
} from "~/server/club/types";
import { parseAsZodType } from "~/utils/zod";
import {
  HexColorSchema,
  InstagramHandleSchema,
  UrlSchema
} from "~/server/utils/types";
import { FormQuestionsSchema } from "~/server/club/types/form";
import { TemplateThemeSchema } from "~/client/theme/templates";
import { z } from "zod";
import { Prisma } from ".prisma/client";
import ClubGetPayload = Prisma.ClubGetPayload;
import {
  asMembershipTier,
  MEMBERSHIP_TIER_SELECT,
  orderedByPricing
} from "~/server/membershipTier/utils";
import { Maybe } from "~/utils/types";

export const CLUB_SELECT = {
  id: true,
  publicId: true,
  name: true,
  tagLine: true,
  description: true,
  howWeHang: true,
  frequency: true,
  startDate: true,
  startTime: true,
  location: true,
  websiteUrl: true,
  instagramHandle: true,
  eventCalendarUrl: true,
  applicationQuestions: true,
  theme: true,
  themeHeadingFont: true,
  accentColor: true,
  displayImageUrls: true,
  contributionReasons: true,
  values: true,
  faqs: true,
  membershipTiers: {
    select: {
      ...MEMBERSHIP_TIER_SELECT
    }
  }
} satisfies Prisma.ClubSelect;

export function asClub(
  r: ClubGetPayload<{ select: typeof CLUB_SELECT }>
): Club {
  return {
    id: r.id,
    publicId: r.publicId,
    name: r.name,
    tagLine: r.tagLine,
    description: r.description,
    howWeHang: r.howWeHang,
    rhythm: toRhythm(r.startDate, r.startTime, r.frequency),
    location: r.location,
    websiteUrl: parseAsZodType(r.websiteUrl, UrlSchema.nullable()),
    instagramHandle: parseAsZodType(
      r.instagramHandle,
      InstagramHandleSchema.nullable()
    ),
    eventCalendarUrl: parseAsZodType(r.eventCalendarUrl, UrlSchema.nullable()),
    applicationQuestions: parseAsZodType(
      r.applicationQuestions,
      FormQuestionsSchema
    ),
    theme: parseAsZodType(r.theme, TemplateThemeSchema.nullable()),
    themeHeadingFont: r.themeHeadingFont,
    accentColor: parseAsZodType(r.accentColor, HexColorSchema.nullable()),
    displayImageUrls: parseAsZodType(r.displayImageUrls, z.array(UrlSchema)),
    contributionReasons: parseAsZodType(
      r.contributionReasons,
      ContributionReasonsSchema
    ),
    values: parseAsZodType(r.values, ClubValuesSchema),
    faqs: parseAsZodType(r.faqs, FAQsSchema),
    membershipTiers: orderedByPricing(
      r.membershipTiers.map((t) => asMembershipTier(t))
    )
  };
}

export function toDateStringFromDate(date: Maybe<Date>): Maybe<DateString> {
  return date ? date.toISOString().slice(0, 10) : null;
}

export function toTimeStringFromDate(time: Maybe<Date>): Maybe<TimeString> {
  return time ? time.toISOString().slice(11, 16) : null;
}

export function toDateFromDateString(
  startDate: Maybe<DateString>
): Maybe<Date> {
  if (!startDate) {
    return null;
  }
  return new Date(startDate);
}

export function toDateFromTimeString(
  startTime: Maybe<TimeString>
): Maybe<Date> {
  if (!startTime) {
    return null;
  }
  return new Date(`1970-01-01T${startTime}:00Z`);
}

export function toRhythm(
  startDate: Maybe<Date>,
  startTime: Maybe<Date>,
  frequency: Maybe<string>
): Maybe<Rhythm> {
  const dateString = toDateStringFromDate(startDate);
  const timeString = toTimeStringFromDate(startTime);

  if (!dateString && !timeString && !frequency) {
    return null;
  }

  if (dateString && timeString && frequency) {
    return {
      startDate: dateString,
      startTime: timeString,
      frequency
    };
  }

  throw new Error("Invalid rhythm state: should be all or none");
}
