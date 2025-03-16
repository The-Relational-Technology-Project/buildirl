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
import { Maybe } from "~/utils/types";
import { stringify } from "~/utils";
import { Email } from "~/server/service/types";

export type FakeStripeClient = StripeClient & {
  enqueueCreateAccountResponse(result: CreateAccountResponse): void;
  enqueueCreateAccountLinkResponse(result: CreateAccountLinkResponse): void;
  enqueueAccountStatusResponse(result: AccountStatusResponse): void;
  enqueueCreateProductResponse(result: CreateProductResponse): void;
  enqueueUpdateProductResponse(result: UpdateProductResponse): void;
  enqueueCreateCustomerResponse(result: CreateCustomerResponse): void;
  enqueueCustomerEmail(email: Email): void;
  enqueueCreateCheckoutSessionResponse(result: CreateCheckoutSessionResponse): void;
  enqueueCreateSubscriptionResponse(result: CreateSubscriptionResponse): void;
  enqueueSubscriptionStatusResponse(result: SubscriptionStatusResponse): void;
};

export function createFakeStripeClient(): FakeStripeClient {
  let nextCreateAccountResponse: Maybe<CreateAccountResponse> = null;
  let nextCreateAccountLinkResponse: Maybe<CreateAccountLinkResponse> = null;
  let nextAccountStatusResponse: Maybe<AccountStatusResponse> = null;
  let nextCreateProductResponse: Maybe<CreateProductResponse> = null;
  let nextUpdateProductResponse: Maybe<UpdateProductResponse> = null;
  let nextCreateCustomerResponse: Maybe<CreateCustomerResponse> = null;
  let nextCustomerEmail: Maybe<Email> = null;
  let nextCreateCheckoutSessionResponse: Maybe<CreateCheckoutSessionResponse> = null;
  let nextCreateSubscriptionResponse: Maybe<CreateSubscriptionResponse> = null;
  let nextSubscriptionStatusResponse: Maybe<SubscriptionStatusResponse> = null;

  async function createAccount(): Promise<CreateAccountResponse> {
    if (null === nextCreateAccountResponse) {
      throw new Error("no queued CreateAccountResponse to return");
    }
    const result = nextCreateAccountResponse;
    nextCreateAccountResponse = null;
    return Promise.resolve(result);
  }

  async function createAccountLink(
    _: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResponse> {
    if (null === nextCreateAccountLinkResponse) {
      throw new Error("no queued CreateAccountLinkResponse to return");
    }
    const result = nextCreateAccountLinkResponse;
    nextCreateAccountLinkResponse = null;
    return Promise.resolve(result);
  }

  async function getAccountStatus(
    _: string
  ): Promise<AccountStatusResponse> {
    if (null === nextAccountStatusResponse) {
      throw new Error("no queued AccountStatusResponse to return");
    }
    const result = nextAccountStatusResponse;
    nextAccountStatusResponse = null;
    return Promise.resolve(result);
  }

  async function createProduct(
    _: CreateProductInput
  ): Promise<CreateProductResponse> {
    if (null === nextCreateProductResponse) {
      throw new Error("no queued CreateProductResponse to return");
    }
    const result = nextCreateProductResponse;
    nextCreateProductResponse = null;
    return Promise.resolve(result);
  }

  async function updateProduct(
    _: string,
    __: UpdateProductInput
  ): Promise<UpdateProductResponse> {
    if (null === nextUpdateProductResponse) {
      throw new Error("no queued UpdateProductResponse to return");
    }
    const result = nextUpdateProductResponse;
    nextUpdateProductResponse = null;
    return Promise.resolve(result);
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
    if (null === nextCreateCustomerResponse) {
      throw new Error("no queued CreateCustomerResponse to return");
    }
    const result = nextCreateCustomerResponse;
    nextCreateCustomerResponse = null;
    return Promise.resolve(result);
  }

  async function getCustomerEmail(_: string): Promise<Email> {
    if (null === nextCustomerEmail) {
      throw new Error("no queued Customer Email to return");
    }
    const result = nextCustomerEmail;
    nextCustomerEmail = null;
    return Promise.resolve(result);
  }

  async function createCheckoutSession(
    _: CreateCheckoutSessionInput
  ): Promise<CreateCheckoutSessionResponse> {
    if (null === nextCreateCheckoutSessionResponse) {
      throw new Error("no queued CreateCheckoutSessionResponse to return");
    }
    const result = nextCreateCheckoutSessionResponse;
    nextCreateCheckoutSessionResponse = null;
    return Promise.resolve(result);
  }

  async function createSubscription(
    _: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResponse> {
    if (null === nextCreateSubscriptionResponse) {
      throw new Error("no queued CreateSubscriptionResponse to return");
    }
    const result = nextCreateSubscriptionResponse;
    nextCreateSubscriptionResponse = null;
    return Promise.resolve(result);
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
    if (null === nextSubscriptionStatusResponse) {
      throw new Error("no queued SubscriptionStatusResponse to return");
    }
    const result = nextSubscriptionStatusResponse;
    nextSubscriptionStatusResponse = null;
    return Promise.resolve(result);
  }

  function enqueueCreateAccountResponse(
    result: CreateAccountResponse
  ): void {
    if (nextCreateAccountResponse !== null) {
      throw new Error(
        `could not enqueue ${stringify(result)} as there already exists an enqueued result ${stringify(nextCreateAccountResponse)}`
      );
    }
    nextCreateAccountResponse = result;
  }

  function enqueueCreateAccountLinkResponse(
    result: CreateAccountLinkResponse
  ): void {
    if (nextCreateAccountLinkResponse !== null) {
      throw new Error(
        `could not enqueue ${stringify(result)} as there already exists an enqueued result ${stringify(nextCreateAccountLinkResponse)}`
      );
    }
    nextCreateAccountLinkResponse = result;
  }

  function enqueueAccountStatusResponse(
    result: AccountStatusResponse
  ): void {
    if (nextAccountStatusResponse !== null) {
      throw new Error(
        `could not enqueue ${stringify(result)} as there already exists an enqueued result ${stringify(nextAccountStatusResponse)}`
      );
    }
    nextAccountStatusResponse = result;
  }

  function enqueueCreateProductResponse(
    result: CreateProductResponse
  ): void {
    if (nextCreateProductResponse !== null) {
      throw new Error(
        `could not enqueue ${stringify(result)} as there already exists an enqueued result ${stringify(nextCreateProductResponse)}`
      );
    }
    nextCreateProductResponse = result;
  }

  function enqueueUpdateProductResponse(
    result: UpdateProductResponse
  ): void {
    if (nextUpdateProductResponse !== null) {
      throw new Error(
        `could not enqueue ${stringify(result)} as there already exists an enqueued result ${stringify(nextUpdateProductResponse)}`
      );
    }
    nextUpdateProductResponse = result;
  }

  function enqueueCreateCustomerResponse(
    result: CreateCustomerResponse
  ): void {
    if (nextCreateCustomerResponse !== null) {
      throw new Error(
        `could not enqueue ${stringify(result)} as there already exists an enqueued result ${stringify(nextCreateCustomerResponse)}`
      );
    }
    nextCreateCustomerResponse = result;
  }

  function enqueueCustomerEmail(
    email: Email
  ): void {
    if (nextCustomerEmail !== null) {
      throw new Error(
        `could not enqueue ${stringify(email)} as there already exists an enqueued result ${stringify(nextCustomerEmail)}`
      );
    }
    nextCustomerEmail = email;
  }

  function enqueueCreateCheckoutSessionResponse(
    result: CreateCheckoutSessionResponse
  ): void {
    if (nextCreateCheckoutSessionResponse !== null) {
      throw new Error(
        `could not enqueue ${stringify(result)} as there already exists an enqueued result ${stringify(nextCreateCheckoutSessionResponse)}`
      );
    }
    nextCreateCheckoutSessionResponse = result;
  }

  function enqueueCreateSubscriptionResponse(
    result: CreateSubscriptionResponse
  ): void {
    if (nextCreateSubscriptionResponse !== null) {
      throw new Error(
        `could not enqueue ${stringify(result)} as there already exists an enqueued result ${stringify(nextCreateSubscriptionResponse)}`
      );
    }
    nextCreateSubscriptionResponse = result;
  }

  function enqueueSubscriptionStatusResponse(
    result: SubscriptionStatusResponse
  ): void {
    if (nextSubscriptionStatusResponse !== null) {
      throw new Error(
        `could not enqueue ${stringify(result)} as there already exists an enqueued result ${stringify(nextSubscriptionStatusResponse)}`
      );
    }
    nextSubscriptionStatusResponse = result;
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
    getSubscriptionStatus,
    enqueueCreateAccountResponse,
    enqueueCreateAccountLinkResponse,
    enqueueAccountStatusResponse,
    enqueueCreateProductResponse,
    enqueueUpdateProductResponse,
    enqueueCreateCustomerResponse,
    enqueueCustomerEmail,
    enqueueCreateCheckoutSessionResponse,
    enqueueCreateSubscriptionResponse,
    enqueueSubscriptionStatusResponse
  };
}
