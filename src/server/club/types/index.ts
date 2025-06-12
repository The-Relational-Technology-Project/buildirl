import { Maybe } from "~/utils/types";
import { City, CitySchema } from "~/server/club/types/location";
import { User } from "~/server/user/types";
import { FormQuestions, FormQuestionsSchema } from "~/server/club/types/form";
import { TemplateTheme, TemplateThemeSchema } from "~/client/theme/templates";
import { z } from "zod";
import { MembershipTier } from "~/server/membershipTier/types";
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
  // internal
  getClubOwnerUserId(clubId: number): Promise<number>;
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
  description: string;
  owner: User;
  websiteUrl: Maybe<Url>;
  instagramHandle: Maybe<InstagramHandle>;
  eventCalendarUrl: Maybe<Url>;
  applicationQuestions: FormQuestions;
  theme: Maybe<TemplateTheme>;
  themeHeadingFont: Maybe<string>;
  displayImageUrls: Url[];
  faqs: FAQs;
  membershipTiers: MembershipTier[];
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
  .max(64, "Length must be >= 64 characters");

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

export const UpdateClubInputSchema = z.object({
  name: ClubNameSchema,
  publicId: ClubPublicIdSchema,
  tagLine: ClubTagLineSchema,
  description: LongTextSchema,
  location: CitySchema,
  websiteUrl: UrlSchema.nullable(),
  instagramHandle: InstagramHandleSchema.nullable(),
  eventCalendarUrl: UrlSchema.nullable(),
  theme: TemplateThemeSchema.nullable(),
  themeHeadingFont: z.string().nullable(),
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
