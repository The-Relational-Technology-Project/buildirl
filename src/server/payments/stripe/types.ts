import { MonetaryValue, Url } from "~/server/utils/types";
import { Maybe } from "~/utils/types";
import { BillingInterval } from "~/utils/types";

export type StripeClient = {
  // connected account management
  createAccount(): Promise<CreateAccountResponse>;
  createAccountLink(
    input: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResponse>;
  getAccountStatus(accountId: string): Promise<AccountStatusResponse>;

  // membership tier product and prices set-up
  createProductAndPricesForMembershipTier(
    input: CreateProductAndPricesForMembershipTierInput,
    byAccountId: string
  ): Promise<CreateProductAndPricesForMembershipTierResponse>;
  updateProductAndPricesForMembershipTier(
    input: UpdateProductAndPricesForMembershipTierInput,
    byAccountId: string
  ): Promise<UpdateProductAndPricesForMembershipTierResponse>;
  archiveProductAndPricesForMembershipTier(
    input: ArchiveProductAndPricesForMembershipTierInput,
    byAccountId: string
  ): Promise<void>;
  publishProductAndPricesForMembershipTier(
    input: PublishProductAndPricesForMembershipTierInput,
    byAccountId: string
  ): Promise<void>;

  // payment flow
  createCustomerForMembership(
    input: CreateCustomerForMembershipInput,
    byAccountId: string
  ): Promise<CreateCustomerForMembershipResponse>;
  createCheckoutSessionForMembership(
    input: CreateCheckoutSessionForMembershipInput,
    byAccountId: string
  ): Promise<CreateCheckoutSessionForMembershipResponse>;
  createSubscriptionForMembership(
    input: CreateSubscriptionForMembershipInput,
    byAccountId: string
  ): Promise<CreateSubscriptionForMembershipResponse>;
  cancelSubscription(
    subscriptionId: string,
    byAccountId: string
  ): Promise<void>;
  getSubscriptionStatus(
    subscriptionId: string,
    byAccountId: string
  ): Promise<SubscriptionStatusResponse>;

  // membership management
  createCustomerPortalConfiguration(
    byAccountId: string
  ): Promise<CreateCustomerPortalConfigurationResponse>;
  createCustomerPortalSession(
    input: CreateCustomerPortalSessionInput,
    byAccountId: string
  ): Promise<CreateCustomerPortalSessionResponse>;
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

export type CreateProductAndPricesForMembershipTierInput = {
  name: string;
  description?: string;
  pricePerBillingInterval: MonetaryValue;
  billingInterval: BillingInterval;
  // null if no initiation fee price
  initiationFeeInUSD: Maybe<MonetaryValue>;
  membershipTierId: number;
};

export type CreateProductAndPricesForMembershipTierResponse = {
  productId: string;
  priceId: string;
  // null if no price created
  initiationFeePriceId: Maybe<string>;
};

/**
 *  If there is:
 *  - null existing priceId and non-null priceInUSD -> create a new price
 *  - non-null existing priceId and null priceInUSD -> archive the old price
 *  - null existing priceId and null priceInUSD -> no-op
 *  - non-null existing priceId and non-null priceInUSD -> update the price (create and archive) only if there is a change in price
 */
export type UpsertNullablePriceInput = {
  priceId: Maybe<string>;
  priceInUSD: Maybe<MonetaryValue>;
};

export type UpdateProductAndPricesForMembershipTierInput = {
  productId: string;
  name: string;
  description: string;
  priceId: string;
  pricePerBillingInterval: MonetaryValue;
  billingInterval: BillingInterval;
  initiationFee: UpsertNullablePriceInput;
};

export type NullablePriceIdResponse = {
  // null if price is set back to null
  updatedPriceId: Maybe<string>;
};

export type UpdateProductAndPricesForMembershipTierResponse = {
  // null if unchanged
  updatedPriceId: Maybe<string>;
  // null if unchanged
  updatedInitiationFeePriceId: Maybe<NullablePriceIdResponse>;
};

export type ArchiveProductAndPricesForMembershipTierInput = {
  productId: string;
  priceIds: string[];
};

export type PublishProductAndPricesForMembershipTierInput = {
  productId: string;
  priceIds: string[];
};

export type CreateCustomerForMembershipInput = {
  email: string;
  name: string;
  membershipId: bigint;
};

export type CreateCustomerForMembershipResponse = {
  customerId: string;
};

export type CreateCustomerPortalConfigurationResponse = {
  configurationId: string;
};

export type CreateCustomerPortalSessionInput = {
  clubId: number;
  origin: Url;
  customerId: string;
  configurationId: string;
};

export type CreateCustomerPortalSessionResponse = {
  redirectUrl: Url;
};

export type CreateCheckoutSessionForMembershipInput = {
  origin: Url;
  clubPublicId: string;
  membershipId: bigint;
  customerId: string;
};

export type CreateCheckoutSessionForMembershipResponse = {
  redirectUrl: Url;
};

export type CreateSubscriptionForMembershipInput = {
  customerId: string;
  priceId: string;
  // null if there is no initiation fee
  initiationFeePriceId: Maybe<string>;
  setupIntentId: string;
  membershipId: bigint;
};

export type CreateSubscriptionForMembershipResponse = {
  subscriptionId: string;
};

export type SubscriptionStatusResponse = {
  isActive: boolean;
  status: string;
};
