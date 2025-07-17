import { z } from "zod";
import { Id, Maybe } from "~/utils/types";

export const RequiredStringSchema = z.string().min(1, "Required");

export const LongTextSchema = z
  .string()
  .max(2000, "Cannot be more than 2000 characters");

// restrict to reasonable monetary range ($1.00 to $999.00) with 2 decimal places
export const MonetaryValueSchema = z
  .number()
  .min(1, "Must be a positive value greater than $1.00")
  .max(999, "Cannot be greater than $999.00")
  // 2 decimal places
  .transform((val) => Number(val.toFixed(2)));
export type MonetaryValue = z.infer<typeof MonetaryValueSchema>;

export const UrlSchema = z
  .string()
  .url("Not a valid url (tip: did you forget http(s) prefix?)");
export type Url = z.infer<typeof UrlSchema>;

const INSTAGRAM_HANDLE_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._]{0,29}$/;
const TWITTER_HANDLE_REGEX = /^[a-zA-Z0-9_]{1,15}$/;
const FACEBOOK_HANDLE_REGEX = /^[a-zA-Z0-9.]{5,50}$/;
const LINKEDIN_HANDLE_REGEX = /^[a-zA-Z0-9-]{3,100}$/;

export const InstagramHandleSchema = z
  .string()
  .regex(INSTAGRAM_HANDLE_REGEX, "Not a valid Instagram handle");
export type InstagramHandle = z.infer<typeof InstagramHandleSchema>;

export const TwitterHandleSchema = z
  .string()
  .regex(TWITTER_HANDLE_REGEX, "Not a valid Twitter handle");
export type TwitterHandle = z.infer<typeof TwitterHandleSchema>;

export const FacebookHandleSchema = z
  .string()
  .regex(FACEBOOK_HANDLE_REGEX, "Not a valid Facebook handle");
export type FacebookHandle = z.infer<typeof FacebookHandleSchema>;

export const LinkedInHandleSchema = z
  .string()
  .regex(LINKEDIN_HANDLE_REGEX, "Not a valid LinkedIn handle");
export type LinkedInHandle = z.infer<typeof LinkedInHandleSchema>;

export const EmailSchema = z.string().email("Not a valid email");
export type Email = z.infer<typeof EmailSchema>;

export type MutationResult = {
  createdEntityId: Maybe<Id>;
};

export const NO_ID_MUTATION_RESULT = {
  createdEntityId: null
};
