import {
  AccountStatusResponse,
  CreateAccountLinkInput,
  CreateAccountLinkResponse,
  CreateAccountResponse,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResponse,
  CreateCustomerInput,
  CreateCustomerResponse,
  CreateProductInput,
  CreateProductResponse,
  CreateSubscriptionInput,
  CreateSubscriptionResponse,
  StripeClient,
  SubscriptionStatusResponse,
  UpdateProductInput,
  UpdateProductResponse
} from "~/server/payments/stripe/types";
import { Email } from "~/server/service/types";

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

  async function createProduct(
    _: CreateProductInput
  ): Promise<CreateProductResponse> {
    const response = {
      productId: `product:id:${nextProductId}`,
      priceId: `price:id:${nextPriceId}`
    };
    nextProductId++;
    nextPriceId++;
    return Promise.resolve(response);
  }

  async function updateProduct(
    _: string,
    __: UpdateProductInput
  ): Promise<UpdateProductResponse> {
    const response = {
      updatedPriceId: `price:id:${nextPriceId}`
    };
    nextPriceId++;
    return Promise.resolve(response);
  }

  async function archiveProduct(_: string): Promise<void> {
    return Promise.resolve();
  }

  async function publishProduct(_: string): Promise<void> {
    return Promise.resolve();
  }

  async function createCustomer(
    _: CreateCustomerInput
  ): Promise<CreateCustomerResponse> {
    const response = { customerId: `customer:id:${nextCustomerId}` };
    nextCustomerId++;
    return Promise.resolve(response);
  }

  async function getCustomerEmail(_: string): Promise<Email> {
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

  async function cancelSetupIntent(_: string): Promise<void> {
    return Promise.resolve();
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
    createProduct,
    updateProduct,
    archiveProduct,
    publishProduct,
    createCustomer,
    getCustomerEmail,
    createCheckoutSession,
    createSubscription,
    cancelSetupIntent,
    cancelSubscription,
    getSubscriptionStatus
  };
}
