import { z } from "zod";
import { Url } from "~/server/service/types";
import { Maybe } from "~/utils/types";

export type PaymentService = PaymentMutations & PaymentQueries;

type PaymentQueries = {
  getAccountStatus(userId: number): Promise<Maybe<AccountStatus>>;
  getSubscriptionStatus(
    membershipId: bigint
  ): Promise<Maybe<SubscriptionStatus>>;
  getCustomerPortalLink(userId: number): Promise<Url>;
};

type PaymentMutations = {
  createAccount(userId: number): Promise<void>;
  createAccountLink(
    input: CreateAccountLinkInput,
    userId: number
  ): Promise<CreateAccountLinkResult>;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
    userId: number
  ): Promise<CreateCheckoutSessionResult>;
};

export type AccountStatus = {
  isComplete: boolean;
  missingRequirements: string[];
};

export type SubscriptionStatus = {
  isActive: boolean;
  status: string;
};

export const CreateAccountLinkInputSchema = z.object({
  origin: z.string().url()
});
export type CreateAccountLinkInput = z.infer<
  typeof CreateAccountLinkInputSchema
>;

export type CreateAccountLinkResult = {
  redirectUrl: Url;
};

export const CreateCheckoutSessionInputSchema = z.object({
  membershipId: z.bigint(),
  origin: z.string().url()
});
export type CreateCheckoutSessionInput = z.infer<
  typeof CreateCheckoutSessionInputSchema
>;

export type CreateCheckoutSessionResult = {
  redirectUrl: Url;
};
