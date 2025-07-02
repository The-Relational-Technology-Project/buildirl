import {
  AccountStatusResponse,
  ArchiveProductAndPricesForMembershipTierInput,
  CreateAccountLinkInput,
  CreateAccountLinkResponse,
  CreateAccountResponse,
  CreateCheckoutSessionForMembershipInput,
  CreateCheckoutSessionForMembershipResponse,
  CreateCustomerForMembershipInput,
  CreateCustomerPortalConfigurationResponse,
  CreateCustomerPortalSessionInput,
  CreateCustomerPortalSessionResponse,
  CreateCustomerForMembershipResponse,
  CreateProductAndPricesForMembershipTierInput,
  CreateProductAndPricesForMembershipTierResponse,
  CreateProductAndPricesForMembershipTierInputV2,
  CreateSubscriptionForMembershipInput,
  CreateSubscriptionForMembershipResponse,
  PublishProductAndPricesForMembershipTierInput,
  StripeClient,
  SubscriptionStatusResponse,
  UpdateProductAndPricesForMembershipTierInput,
  UpdateProductAndPricesForMembershipTierResponse,
  UpdateProductAndPricesForMembershipTierInputV2
} from "~/server/payments/stripe/types";
import { Maybe } from "~/utils/types";

export function createFakeStripeClient(): StripeClient {
  let nextAccountId: number = 1;
  let nextProductId: number = 1;
  let nextPriceId: number = 1;
  let nextCustomerId: number = 1;
  let nextSubscriptionId: number = 1;
  let nextConfigurationId: number = 1;

  async function createAccount(): Promise<CreateAccountResponse> {
    const response = { accountId: `account:id:${nextAccountId}` };
    nextAccountId++;
    return Promise.resolve(response);
  }

  async function createAccountLink(
    _: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResponse> {
    throw new Error("not implemented");
  }

  async function getAccountStatus(_: string): Promise<AccountStatusResponse> {
    throw new Error("not implemented");
  }

  async function createProductAndPricesForMembershipTier(
    input: CreateProductAndPricesForMembershipTierInput,
    __: string
  ): Promise<CreateProductAndPricesForMembershipTierResponse> {
    const priceId = nextPriceId;
    nextPriceId++;
    let initiationFeePriceId: Maybe<number> = null;
    if (input.initiationFeeInUSD !== null) {
      initiationFeePriceId = nextPriceId;
      nextPriceId++;
    }
    const response = {
      productId: `product:id:${nextProductId}`,
      priceId: `price:id:${priceId}`,
      initiationFeePriceId:
        null === initiationFeePriceId
          ? null
          : `price:id:${initiationFeePriceId}`
    };
    nextProductId++;
    return Promise.resolve(response);
  }

  async function createProductAndPricesForMembershipTierV2(
    input: CreateProductAndPricesForMembershipTierInputV2,
    __: string
  ): Promise<CreateProductAndPricesForMembershipTierResponse> {
    const priceId = nextPriceId;
    nextPriceId++;
    let initiationFeePriceId: Maybe<number> = null;
    if (input.initiationFeeInUSD !== null) {
      initiationFeePriceId = nextPriceId;
      nextPriceId++;
    }
    const response = {
      productId: `product:id:${nextProductId}`,
      priceId: `price:id:${priceId}`,
      initiationFeePriceId:
        null === initiationFeePriceId
          ? null
          : `price:id:${initiationFeePriceId}`
    };
    nextProductId++;
    return Promise.resolve(response);
  }

  async function updateProductAndPricesForMembershipTier(
    input: UpdateProductAndPricesForMembershipTierInput,
    __: string
  ): Promise<UpdateProductAndPricesForMembershipTierResponse> {
    const priceId = nextPriceId;
    nextPriceId++;
    let initiationFeePriceId: Maybe<number> = null;
    if (input.initiationFee !== null) {
      initiationFeePriceId = nextPriceId;
      nextPriceId++;
    }
    const response = {
      updatedPriceId: `price:id:${priceId}`,
      updatedInitiationFeePriceId:
        null === initiationFeePriceId
          ? null
          : {
              updatedPriceId: `price:id:${initiationFeePriceId}`
            }
    };
    return Promise.resolve(response);
  }

  async function updateProductAndPricesForMembershipTierV2(
    input: UpdateProductAndPricesForMembershipTierInputV2,
    __: string
  ): Promise<UpdateProductAndPricesForMembershipTierResponse> {
    const priceId = nextPriceId;
    nextPriceId++;
    let initiationFeePriceId: Maybe<number> = null;
    if (input.initiationFee !== null) {
      initiationFeePriceId = nextPriceId;
      nextPriceId++;
    }
    const response = {
      updatedPriceId: `price:id:${priceId}`,
      updatedInitiationFeePriceId:
        null === initiationFeePriceId
          ? null
          : {
              updatedPriceId: `price:id:${initiationFeePriceId}`
            }
    };
    return Promise.resolve(response);
  }

  async function archiveProductAndPricesForMembershipTier(
    _: ArchiveProductAndPricesForMembershipTierInput,
    __: string
  ): Promise<void> {
    return Promise.resolve();
  }

  async function publishProductAndPricesForMembershipTier(
    _: PublishProductAndPricesForMembershipTierInput,
    __: string
  ): Promise<void> {
    return Promise.resolve();
  }

  async function createCustomerForMembership(
    _: CreateCustomerForMembershipInput,
    __: string
  ): Promise<CreateCustomerForMembershipResponse> {
    const response = { customerId: `customer:id:${nextCustomerId}` };
    nextCustomerId++;
    return Promise.resolve(response);
  }

  async function createCustomerPortalConfiguration(
    _: string
  ): Promise<CreateCustomerPortalConfigurationResponse> {
    const response = {
      configurationId: `configuration:id:${nextConfigurationId}`
    };
    nextConfigurationId++;
    return Promise.resolve(response);
  }

  async function createCustomerPortalSession(
    _: CreateCustomerPortalSessionInput,
    __: string
  ): Promise<CreateCustomerPortalSessionResponse> {
    throw new Error("not implemented");
  }

  async function createCheckoutSessionForMembership(
    _: CreateCheckoutSessionForMembershipInput,
    __: string
  ): Promise<CreateCheckoutSessionForMembershipResponse> {
    throw new Error("not implemented");
  }

  async function createSubscriptionForMembership(
    _: CreateSubscriptionForMembershipInput,
    __: string
  ): Promise<CreateSubscriptionForMembershipResponse> {
    const response = {
      subscriptionId: `subscription:id:${nextSubscriptionId}`
    };
    nextSubscriptionId++;
    return Promise.resolve(response);
  }

  async function cancelSubscription(_: string, __: string): Promise<void> {
    return Promise.resolve();
  }

  async function getSubscriptionStatus(
    _: string,
    __: string
  ): Promise<SubscriptionStatusResponse> {
    throw new Error("not implemented");
  }

  return {
    createAccount,
    createAccountLink,
    getAccountStatus,
    createProductAndPricesForMembershipTier,
    createProductAndPricesForMembershipTierV2,
    updateProductAndPricesForMembershipTier,
    updateProductAndPricesForMembershipTierV2,
    archiveProductAndPricesForMembershipTier,
    publishProductAndPricesForMembershipTier,
    createCustomerForMembership,
    createCustomerPortalConfiguration,
    createCustomerPortalSession,
    createCheckoutSessionForMembership,
    createSubscriptionForMembership,
    cancelSubscription,
    getSubscriptionStatus
  };
}
