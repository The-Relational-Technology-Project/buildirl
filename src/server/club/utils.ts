import { Club, FAQsSchema } from "~/server/club/types";
import { parseAsZodType } from "~/utils/zod";
import { InstagramHandleSchema, UrlSchema } from "~/server/utils/types";
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

export const CLUB_SELECT = {
  id: true,
  publicId: true,
  name: true,
  tagLine: true,
  description: true,
  location: true,
  websiteUrl: true,
  instagramHandle: true,
  eventCalendarUrl: true,
  applicationQuestions: true,
  theme: true,
  themeHeadingFont: true,
  displayImageUrls: true,
  faqs: true,
  membershipTiers: {
    select: {
      ...MEMBERSHIP_TIER_SELECT
    }
  }
};

export function asClub(
  r: ClubGetPayload<{ select: typeof CLUB_SELECT }>
): Club {
  return {
    id: r.id,
    publicId: r.publicId,
    name: r.name,
    tagLine: r.tagLine,
    description: r.description,
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
    displayImageUrls: parseAsZodType(r.displayImageUrls, z.array(UrlSchema)),
    faqs: parseAsZodType(r.faqs, FAQsSchema),
    membershipTiers: orderedByPricing(
      r.membershipTiers.map((t) => asMembershipTier(t))
    )
  };
}
