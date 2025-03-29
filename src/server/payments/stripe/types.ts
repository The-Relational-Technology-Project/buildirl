import { Email, MonetaryValue, Url } from "~/server/service/types";
import { Maybe } from "~/utils/types";

export type StripeClient = {
  // connected account management
  createAccount(input: CreateAccountInput): Promise<CreateAccountResponse>;
  createAccountLink(
    input: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResponse>;
  getAccountStatus(accountId: string): Promise<AccountStatusResponse>;

  // product set-up
  createProductAndPrice(
    input: CreateProductAndPriceInput,
    byAccountId: string
  ): Promise<CreateProductAndPriceResponse>;
  updateProductAndPrice(
    input: UpdateProductAndPriceInput,
    byAccountId: string
  ): Promise<UpdateProductAndPriceResponse>;
  archiveProductAndPrice(
    input: ArchiveProductAndPriceInput,
    byAccountId: string
  ): Promise<void>;
  publishProductAndPrice(
    input: PublishProductAndPriceInput,
    byAccountId: string
  ): Promise<void>;

  // payment flow
  createCustomer(
    input: CreateCustomerInput,
    byAccountId: string
  ): Promise<CreateCustomerResponse>;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
    byAccountId: string
  ): Promise<CreateCheckoutSessionResponse>;
  createSubscription(
    input: CreateSubscriptionInput,
    byAccountId: string
  ): Promise<CreateSubscriptionResponse>;
  cancelSetupIntent(setupIntentId: string, byAccountId: string): Promise<void>;
  cancelSubscription(
    subscriptionId: string,
    byAccountId: string
  ): Promise<void>;
  getSubscriptionStatus(
    subscriptionId: string,
    byAccountId: string
  ): Promise<SubscriptionStatusResponse>;

  // membership management
  createCustomerPortalSession(
    input: CreateCustomerPortalSessionInput,
    byAccountId: string
  ): Promise<CreateCustomerPortalSessionResponse>;
};

export type CreateAccountInput = {
  email: Email;
};

export type CreateAccountLinkInput = {
  origin: Url;
  clubId: number;
  accountId: string;
};

export type CreateAccountLinkResponse = {
  redirectUrl: Url;
};

export type CreateAccountResponse = {
  accountId: string;
};

export type AccountStatusResponse = {
  isComplete: boolean;
  missingRequirements: string[];
};

export type CreateProductAndPriceInput = {
  name: string;
  description?: string;
  pricePerMonthInUSD: MonetaryValue;
  membershipTierId: number;
};

export type CreateProductAndPriceResponse = {
  productId: string;
  priceId: string;
};

export type UpdateProductAndPriceInput = {
  productId: string;
  priceId: string;
  name: string;
  description: string;
  pricePerMonthInUSD: MonetaryValue;
};

export type UpdateProductAndPriceResponse = {
  // null if unchanged
  updatedPriceId: Maybe<string>;
};

export type ArchiveProductAndPriceInput = {
  productId: string;
  priceId: string;
};

export type PublishProductAndPriceInput = {
  productId: string;
  priceId: string;
};

export type CreateCustomerInput = {
  email: string;
  name: string;
  membershipId: bigint;
};

export type CreateCustomerResponse = {
  customerId: string;
};

export type CreateCustomerPortalSessionInput = {
  clubId: number;
  origin: Url;
  customerId: string;
};

export type CreateCustomerPortalSessionResponse = {
  redirectUrl: Url;
};

export type CreateCheckoutSessionInput = {
  origin: Url;
  clubId: number;
  membershipId: bigint;
  customerId: string;
  priceId: string;
};

export type CreateCheckoutSessionResponse = {
  redirectUrl: Url;
};

export type CreateSubscriptionInput = {
  customerId: string;
  priceId: string;
  setupIntentId: string;
  membershipId: bigint;
};

export type CreateSubscriptionResponse = {
  subscriptionId: string;
};

export type SubscriptionStatusResponse = {
  isActive: boolean;
  status: string;
};
