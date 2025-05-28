import { z } from "zod";
import { Url } from "~/server/membership/types";
import { Maybe } from "~/utils/types";

export type PaymentService = PaymentMutations & PaymentQueries;

type PaymentQueries = {
  getAccountStatus(clubId: number): Promise<Maybe<AccountStatus>>;
  getSubscriptionStatus(
    membershipId: bigint
  ): Promise<Maybe<SubscriptionStatus>>;
};

type PaymentMutations = {
  createAccount(input: CreateAccountInput): Promise<void>;
  createAccountLink(
    input: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResult>;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
    membershipId: bigint
  ): Promise<CreateCheckoutSessionResult>;
  createCustomerPortalSession(
    input: CreateCustomerPortalSessionInput,
    membershipId: bigint
  ): Promise<CreateCustomerPortalSessionResult>;
};

export type AccountStatus = {
  isComplete: boolean;
  missingRequirements: string[];
};

export type SubscriptionStatus = {
  isActive: boolean;
  status: string;
};

export const CreateAccountInputSchema = z.object({
  clubId: z.number()
});
export type CreateAccountInput = z.infer<typeof CreateAccountInputSchema>;

export const CreateAccountLinkInputSchema = z.object({
  clubId: z.number(),
  origin: z.string().url()
});
export type CreateAccountLinkInput = z.infer<
  typeof CreateAccountLinkInputSchema
>;

export type CreateAccountLinkResult = {
  redirectUrl: Url;
};

export const CreateCheckoutSessionInputSchema = z.object({
  origin: z.string().url()
});
export type CreateCheckoutSessionInput = z.infer<
  typeof CreateCheckoutSessionInputSchema
>;

export type CreateCheckoutSessionResult = {
  redirectUrl: Url;
};

export const CreateCustomerPortalSessionInputSchema = z.object({
  origin: z.string().url()
});
export type CreateCustomerPortalSessionInput = z.infer<
  typeof CreateCustomerPortalSessionInputSchema
>;

export type CreateCustomerPortalSessionResult = {
  redirectUrl: Url;
};
