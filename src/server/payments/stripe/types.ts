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
  createProduct(input: CreateProductInput): Promise<CreateProductResponse>;
  updateProduct(
    productId: string,
    input: UpdateProductInput
  ): Promise<UpdateProductResponse>;
  archiveProduct(productId: string): Promise<void>;
  publishProduct(productId: string): Promise<void>;

  // payment flow
  createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResponse>;
  getCustomerEmail(customerId: string): Promise<Email>;
  createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<CreateCheckoutSessionResponse>;
  createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResponse>;
  cancelSetupIntent(setupIntentId: string): Promise<void>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  getSubscriptionStatus(
    subscriptionId: string
  ): Promise<SubscriptionStatusResponse>;
};

export type CreateAccountLinkInput = {
  origin: Url;
  accountId: string;
};

export type CreateAccountLinkResponse = {
  redirectUrl: Url;
};

export type CreateAccountInput = {
  email: Email;
};

export type CreateAccountResponse = {
  accountId: string;
};

export type AccountStatusResponse = {
  isComplete: boolean;
  missingRequirements: string[];
};

export type CreateProductInput = {
  name: string;
  description?: string;
  pricePerMonthInUSD: MonetaryValue;
  membershipTierId: number;
  byAccountId: string;
};

export type CreateProductResponse = {
  productId: string;
  priceId: string;
};

export type UpdateProductInput = {
  currentPriceId: string;
  name: string;
  description: string;
  pricePerMonthInUSD: MonetaryValue;
};

export type UpdateProductResponse = {
  updatedPriceId: Maybe<string>;
};

export type CreateCheckoutSessionResponse = {
  redirectUrl: Url;
};

export type CreateCustomerInput = {
  email: string;
  name: string;
  userId: number;
};

export type CreateCustomerResponse = {
  customerId: string;
};

export type CreateCheckoutSessionInput = {
  origin: Url;
  clubId: number;
  membershipId: bigint;
  customerId: string;
  priceId: string;
};

export type CreateSubscriptionInput = {
  customerId: string;
  priceId: string;
  setupIntentId: string;
  membershipId: bigint;
  byAccountId: string;
};

export type CreateSubscriptionResponse = {
  subscriptionId: string;
};

export type SubscriptionStatusResponse = {
  isActive: boolean;
  status: string;
};
