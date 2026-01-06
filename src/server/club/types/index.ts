import { Maybe } from "~/utils/types";
import { City, CitySchema } from "~/server/club/types/location";
import { FormQuestions, FormQuestionsSchema } from "~/server/club/types/form";
import { TemplateTheme, TemplateThemeSchema } from "~/client/theme/templates";
import { z } from "zod";
import { MembershipTier } from "~/server/membershipTier/types";
import { Membership } from "~/server/membership/types";
import {
  InstagramHandle,
  InstagramHandleSchema,
  LongTextSchema,
  MutationResult,
  Url,
  UrlSchema
} from "~/server/utils/types";

export type ClubService = ClubQueries & ClubMutations;

type ClubQueries = {
  getClubByPublicId(publicId: string): Promise<Club>;
  getClubStatistics(clubId: number): Promise<ClubStatistics>;
  getClub(id: number): Promise<Club>;
  getAllClubs(): Promise<ClubWithFirstLead[]>;
};

export type Club = {
  id: number;
  publicId: string;
  name: string;
  tagLine: string;
  // TODO we should make this non-nullable once the DB field is
  //  made non-nullable after values are back-populated
  // this is nullable for backwards compatibility purposes
  location: Maybe<City>;
  rhythm: Maybe<Rhythm>;
  description: string;
  websiteUrl: Maybe<Url>;
  instagramHandle: Maybe<InstagramHandle>;
  eventCalendarUrl: Maybe<Url>;
  applicationQuestions: FormQuestions;
  theme: Maybe<TemplateTheme>;
  themeHeadingFont: Maybe<string>;
  displayImageUrls: Url[];
  contributionReasons: ContributionReasons;
  values: ClubValues;
  faqs: FAQs;
  membershipTiers: MembershipTier[];
};

export type ClubWithFirstLead = Club & {
  firstLead?: Membership;
};

export type ClubStatistics = {
  memberCount: number;
};

type ClubMutations = {
  createClub(input: CreateClubInput, userId: number): Promise<MutationResult>;
  updateClub(id: number, input: UpdateClubInput): Promise<MutationResult>;
  deleteClub(id: number): Promise<MutationResult>;
  updateClubApplicationQuestions(
    clubId: number,
    input: UpdateClubApplicationQuestionsInput
  ): Promise<MutationResult>;
  updateClubDisplayImageUrls(
    clubId: number,
    input: UpdateClubDisplayImageUrlsInput
  ): Promise<MutationResult>;
};

const CLUB_PUBLIC_ID_REGEX = /^[a-z0-9_-]+$/;

export const ClubPublicIdSchema = z
  .string()
  .min(3, "Length must be at least 3 characters")
  .regex(
    CLUB_PUBLIC_ID_REGEX,
    "May only contain lowercase letters, numbers, underscores, and dashes"
  );

export const ClubNameSchema = z
  .string()
  .min(3, "Length must be >= 3 characters")
  .max(20, "Length must be >= 20 characters");

export const ClubTagLineSchema = z
  .string()
  .max(80, "Length must be <= 80 characters");

export const CreateClubInputSchema = z.object({
  name: ClubNameSchema,
  publicId: ClubPublicIdSchema,
  location: CitySchema
  // non-required fields (e.g, description, themes, faqs, etc) will be defaulted in the backend
});
export type CreateClubInput = z.infer<typeof CreateClubInputSchema>;

export const FAQQuestionSchema = z
  .string()
  .min(3, "Question must be at least 3 characters")
  .max(200, "Question cannot exceed 200 characters");

export const FAQAnswerSchema = z
  .string()
  .min(3, "Answer must be at least 3 characters")
  .max(2000, "Answer cannot exceed 2000 characters");

export const FAQSchema = z.object({
  question: FAQQuestionSchema,
  answer: FAQAnswerSchema
});
export type FAQ = z.infer<typeof FAQSchema>;

export const FAQsSchema = z.object({
  items: z.array(FAQSchema)
});

export type FAQs = z.infer<typeof FAQsSchema>;

export const DateStringSchema = z.string().date();

export type DateString = z.infer<typeof DateStringSchema>;

export const TimeStringSchema = z.string().time();

export type TimeString = z.infer<typeof TimeStringSchema>;

export const RhythmSchema = z
  .object({
    startDate: DateStringSchema.nullable(),
    startTime: TimeStringSchema.nullable(),
    frequency: z.string().nullable()
  })
  .refine(
    (obj) => {
      const allPresent = !!obj.startDate && !!obj.startTime && !!obj.frequency;
      const allAbsent = !obj.startDate && !obj.startTime && !obj.frequency;
      return allPresent || allAbsent;
    },
    {
      message: "Either all rhythm fields must be provided, or none."
    }
  );

export type Rhythm = z.infer<typeof RhythmSchema>;

export const ClubValueSchema = z.object({
  icon: z.string().min(1, "Icon is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(30, "Title cannot exceed 30 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(160, "Description cannot exceed 160 characters")
});

export type ClubValue = z.infer<typeof ClubValueSchema>;

export const ClubValuesSchema = z.object({
  items: z.array(ClubValueSchema)
});

export type ClubValues = z.infer<typeof ClubValuesSchema>;

export const ContributionReasonSchema = z.object({
  label: z
    .string()
    .min(1, "Label is required")
    .max(10, "Label cannot exceed 10 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(180, "Description cannot exceed 180 characters"),
  coverImageUrl: UrlSchema.nullable()
});

export type ContributionReason = z.infer<typeof ContributionReasonSchema>;

export const ContributionReasonsSchema = z.object({
  items: z.array(ContributionReasonSchema)
});

export type ContributionReasons = z.infer<typeof ContributionReasonsSchema>;

export const UpdateClubInputSchema = z.object({
  name: ClubNameSchema,
  publicId: ClubPublicIdSchema,
  tagLine: ClubTagLineSchema,
  description: LongTextSchema,
  location: CitySchema,
  rhythm: RhythmSchema,
  websiteUrl: UrlSchema.nullable(),
  instagramHandle: InstagramHandleSchema.nullable(),
  eventCalendarUrl: UrlSchema.nullable(),
  theme: TemplateThemeSchema.nullable(),
  themeHeadingFont: z.string().nullable(),
  contributionReasons: ContributionReasonsSchema,
  values: ClubValuesSchema,
  faqs: FAQsSchema
});
export type UpdateClubInput = z.infer<typeof UpdateClubInputSchema>;

export const UpdateClubApplicationQuestionsInputSchema = z.object({
  applicationQuestions: FormQuestionsSchema
});
export type UpdateClubApplicationQuestionsInput = z.infer<
  typeof UpdateClubApplicationQuestionsInputSchema
>;

export const UpdateClubDisplayImageUrlsInputSchema = z.object({
  displayImageUrls: z.array(UrlSchema)
});
export type UpdateClubDisplayImageUrlsInput = z.infer<
  typeof UpdateClubDisplayImageUrlsInputSchema
>;
