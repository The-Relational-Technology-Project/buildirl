import { z } from "zod";
import { MonetaryValue, Url } from "~/server/utils/types";
import { Maybe, BillingInterval, CheckoutFlowType } from "~/utils/types";
import { Prisma } from "@prisma/client";

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
  createCustomerForMembership(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  createSubscriptionForMembership(
    input: CreateSubscriptionForMembershipInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  cancelSubscription(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  // updates the subscription with the current membership tier
  // associated with the membership
  updateSubscription(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  createProductAndPricesForMembershipTier(
    input: CreateProductAndPricesForMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  archiveProductAndPricesForMembershipTier(
    membershipTierId: number,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  publishProductAndPricesForMembershipTier(
    membershipTierId: number,
    tx: Prisma.TransactionClient
  ): Promise<void>;
  updateProductAndPricesForMembershipTier(
    input: UpdateProductAndPricesForMembershipTierInput,
    tx: Prisma.TransactionClient
  ): Promise<void>;
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
  origin: z.string().url(),
  flowType: z.nativeEnum(CheckoutFlowType)
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

export type CreateSubscriptionForMembershipInput = {
  membershipId: bigint;
};

export type CreateProductAndPricesForMembershipTierInput = {
  name: string;
  description: Maybe<string>;
  pricePerBillingInterval: MonetaryValue;
  billingInterval: BillingInterval;
  initiationFeeInUSD: Maybe<MonetaryValue>;
  membershipTierId: number;
};

export type UpdateProductAndPricesForMembershipTierInput = {
  name: string;
  description: string;
  pricePerBillingInterval: MonetaryValue;
  billingInterval: BillingInterval;
  initiationFeeInUSD: Maybe<MonetaryValue>;
  membershipTierId: number;
};
