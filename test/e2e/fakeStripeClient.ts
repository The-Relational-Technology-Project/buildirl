import {
  AccountStatusResponse,
  ArchiveProductAndPriceInput,
  CreateAccountLinkInput,
  CreateAccountLinkResponse,
  CreateAccountResponse,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResponse,
  CreateCustomerInput,
  CreateCustomerPortalSessionInput,
  CreateCustomerPortalSessionResponse,
  CreateCustomerResponse,
  CreateProductAndPriceInput,
  CreateProductAndPriceResponse,
  CreateSubscriptionInput,
  CreateSubscriptionResponse,
  PublishProductAndPriceInput,
  StripeClient,
  SubscriptionStatusResponse,
  UpdateProductAndPriceInput,
  UpdateProductAndPriceResponse
} from "~/server/payments/stripe/types";

export function createFakeStripeClient(): StripeClient {
  let nextAccountId: number = 1;
  let nextProductId: number = 1;
  let nextPriceId: number = 1;
  let nextCustomerId: number = 1;
  let nextSubscriptionId: number = 1;

  async function createAccount(): Promise<CreateAccountResponse> {
    const response = { accountId: `account:id:${nextAccountId}` };
    nextAccountId++;
    return Promise.resolve(response);
  }

  async function createAccountLink(
    input: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResponse> {
    throw new Error("not implemented");
  }

  async function getAccountStatus(_: string): Promise<AccountStatusResponse> {
    throw new Error("not implemented");
  }

  async function createProductAndPrice(
    _: CreateProductAndPriceInput
  ): Promise<CreateProductAndPriceResponse> {
    const response = {
      productId: `product:id:${nextProductId}`,
      priceId: `price:id:${nextPriceId}`
    };
    nextProductId++;
    nextPriceId++;
    return Promise.resolve(response);
  }

  async function updateProductAndPrice(
    __: UpdateProductAndPriceInput
  ): Promise<UpdateProductAndPriceResponse> {
    const response = {
      updatedPriceId: `price:id:${nextPriceId}`
    };
    nextPriceId++;
    return Promise.resolve(response);
  }

  async function archiveProductAndPrice(
    _: ArchiveProductAndPriceInput
  ): Promise<void> {
    return Promise.resolve();
  }

  async function publishProductAndPrice(
    _: PublishProductAndPriceInput
  ): Promise<void> {
    return Promise.resolve();
  }

  async function createCustomer(
    _: CreateCustomerInput
  ): Promise<CreateCustomerResponse> {
    const response = { customerId: `customer:id:${nextCustomerId}` };
    nextCustomerId++;
    return Promise.resolve(response);
  }

  async function createCustomerPortalSession(
    _: CreateCustomerPortalSessionInput
  ): Promise<CreateCustomerPortalSessionResponse> {
    throw new Error("not implemented");
  }

  async function createCheckoutSession(
    _: CreateCheckoutSessionInput
  ): Promise<CreateCheckoutSessionResponse> {
    throw new Error("not implemented");
  }

  async function createSubscription(
    _: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResponse> {
    const response = {
      subscriptionId: `subscription:id:${nextSubscriptionId}`
    };
    nextSubscriptionId++;
    return Promise.resolve(response);
  }

  async function cancelSubscription(_: string): Promise<void> {
    return Promise.resolve();
  }

  async function getSubscriptionStatus(
    _: string
  ): Promise<SubscriptionStatusResponse> {
    throw new Error("not implemented");
  }

  return {
    createAccount,
    createAccountLink,
    getAccountStatus,
    createProductAndPrice,
    updateProductAndPrice,
    archiveProductAndPrice,
    publishProductAndPrice,
    createCustomer,
    createCustomerPortalSession,
    createCheckoutSession,
    createSubscription,
    cancelSubscription,
    getSubscriptionStatus
  };
}
