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
import { rootLogger } from "~/logger";
import Stripe from "stripe";
import { Maybe } from "~/utils/types";
import { stringify } from "~/utils";
import { Email } from "~/server/service/types";

const logger = rootLogger.child({ module: "stripeClient" });

export function createStripeClient(stripe: Stripe): StripeClient {
  async function createAccount(): Promise<CreateAccountResponse> {
    try {
      const account = await stripe.accounts.create({
        type: "standard",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });
      const accountId = account.id;
      logger.info(`successfully created account with id ${accountId}`);
      return { accountId };
    } catch (e) {
      logger.error(e, "failed to create account");
      throw e;
    }
  }

  async function createAccountLink(
    input: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResponse> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: input.accountId,
        // TODO
        refresh_url: `${input.origin}/api/payments/refresh-account-link`,
        return_url: `${input.origin}/settings?tab=connect`,
        type: "account_onboarding"
      });
      const url = accountLink.url;
      logger.info(
        `created account link with redirect url ${url} for account with id ${input.accountId}`
      );
      return {
        redirectUrl: url
      };
    } catch (e) {
      logger.error(
        e,
        `failed to create account link for account with id ${input.accountId}`
      );
      throw e;
    }
  }

  async function getAccountStatus(
    accountId: string
  ): Promise<AccountStatusResponse> {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      const requirements = account.requirements;
      const isComplete = requirements?.currently_due?.length === 0;

      const accountStatus = {
        isComplete,
        missingRequirements: requirements?.currently_due || []
      };

      logger.info(
        `retrieved account status ${stringify(accountStatus)} for account with id ${accountId}`
      );
      return accountStatus;
    } catch (e) {
      logger.error(
        e,
        `failed to get account status for account with id ${accountId}`
      );
      throw e;
    }
  }

  async function createProduct(
    input: CreateProductInput
  ): Promise<CreateProductResponse> {
    try {
      const product = await stripe.products.create({
        name: input.name,
        description: input.description,
        active: true,
        metadata: {
          externalMembershipTierId: input.membershipTierId
        }
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: input.pricePerMonthInUSD,
        currency: "usd",
        recurring: {
          interval: "month"
        }
      });

      logger.info(
        `created product ${product.id} and price ${price.id} from input ${stringify(input)}`
      );

      return {
        productId: product.id,
        priceId: price.id
      };
    } catch (e) {
      logger.error(
        e,
        `failed to create product and price from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function updateProduct(
    productId: string,
    input: UpdateProductInput
  ): Promise<UpdateProductResponse> {
    try {
      await stripe.products.update(productId, {
        name: input.name,
        description: input.description
      });

      const updatedPriceId = await updatePriceIfAmountChanged(
        productId,
        input.pricePerMonthInUSD,
        input.currentPriceId
      );
      logger.info(
        `updated product ${productId} from input ${stringify(input)}`
      );
      return {
        updatedPriceId
      };
    } catch (e) {
      logger.error(e, `failed to update product from ${stringify(input)}`);
      throw e;
    }
  }

  async function updatePriceIfAmountChanged(
    productId: string,
    pricePerMonthInUSD: number,
    currentPriceId: string
  ): Promise<Maybe<string>> {
    try {
      if (pricePerMonthInUSD !== null) {
        const existingPrice = await stripe.prices.retrieve(currentPriceId);
        if (existingPrice.unit_amount !== pricePerMonthInUSD) {
          const newPrice = await stripe.prices.create({
            product: productId,
            unit_amount: pricePerMonthInUSD,
            currency: "usd",
            recurring: {
              interval: "month"
            }
          });
          // deactivate old price
          await stripe.prices.update(currentPriceId, { active: false });
          logger.info(
            `updated price for product ${productId} from price ${currentPriceId} to new price ${newPrice.id} with amount ${pricePerMonthInUSD} `
          );
          return newPrice.id;
        }
      }
      logger.info(
        `did not update price for product ${productId} and price ${currentPriceId} because there was no price change`
      );
      // else no updated price id
      return null;
    } catch (e) {
      logger.error(
        e,
        `failed to update price for product ${productId} and price ${currentPriceId} to ${pricePerMonthInUSD}`
      );
      throw e;
    }
  }

  async function archiveProduct(productId: string): Promise<void> {
    try {
      await stripe.products.update(productId, { active: false });
      logger.info(`archived product ${productId}`);
    } catch (e) {
      logger.error(e, `failed to archive product ${productId}`);
      throw e;
    }
  }

  async function publishProduct(productId: string): Promise<void> {
    try {
      await stripe.products.update(productId, { active: true });
      logger.info(`published product ${productId}`);
    } catch (e) {
      logger.error(e, `failed to publish product ${productId}`);
      throw e;
    }
  }

  async function createCustomer(
    input: CreateCustomerInput
  ): Promise<CreateCustomerResponse> {
    try {
      const customer = await stripe.customers.create({
        name: input.name,
        email: input.email,
        metadata: {
          externalUserId: input.userId
        }
      });
      logger.info(
        `created customer ${customer.id} from input ${stringify(input)}`
      );
      return {
        customerId: customer.id
      };
    } catch (e) {
      logger.error(
        e,
        `failed to create customer from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function getCustomerEmail(customerId: string): Promise<Email> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error(
          `could not get email for customer with id ${customerId} because customer was deleted`
        );
      }
      if (!customer.email) {
        throw new Error(`customer with id ${customerId} was missing email`);
      }
      logger.info(
        `queried email ${customer.email} for customer with id ${customerId}`
      );
      return customer.email;
    } catch (e) {
      logger.error(
        e,
        `failed to get customer email for customer with id ${customerId}`
      );
      throw e;
    }
  }

  async function createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<CreateCheckoutSessionResponse> {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: input.customerId,
        // TODO
        success_url: `${input.origin}/apply/${input.clubId}/completed/`,
        line_items: [
          {
            // subscription
            price: input.priceId,
            quantity: 1
          }
        ],
        setup_intent_data: {
          metadata: {
            externalMembershipId: input.membershipId
          }
        },
        mode: "setup"
      });

      if (!session.url) {
        throw new Error("expected active session with url but found no url");
      }

      logger.info(
        `successfully created checkout session with id ${session.id} from input ${stringify(input)}`
      );

      return { redirectUrl: session.url };
    } catch (e) {
      logger.error(
        e,
        `failed to create checkout session from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResponse> {
    try {
      const setupIntent = await stripe.setupIntents.retrieve(
        input.setupIntentId
      );

      if (!setupIntent.payment_method) {
        throw new Error(
          `no payment method attached to setup intent ${stringify(setupIntent)}`
        );
      }

      // create subscription
      const subscription = await stripe.subscriptions.create(
        {
          customer: input.customerId,
          items: [{ price: input.priceId }],
          default_payment_method: paymentMethodId(setupIntent.payment_method),
          collection_method: "charge_automatically",
          // we will surface inactive status if needed but do not block
          // subscription creation
          payment_behavior: "allow_incomplete",
          metadata: {
            // no bigint, must convert to string
            externalMembershipId: input.membershipId.toString()
          }
        },
        {
          // we want to capture this for tracking purposes
          stripeAccount: input.byAccountId
        }
      );

      logger.info(
        `successfully created subscription with id ${subscription.id} from setup intent with id ${input.setupIntentId}`
      );
      return {
        subscriptionId: subscription.id
      };
    } catch (e) {
      logger.error(
        e,
        `failed to create subscription with setup intent with id ${input.setupIntentId}`
      );
      throw e;
    }
  }

  function paymentMethodId(
    paymentMethod: string | Stripe.PaymentMethod
  ): string {
    if (typeof paymentMethod === "string") {
      return paymentMethod;
    }
    return paymentMethod.id;
  }

  async function cancelSetupIntent(setupIntentId: string): Promise<void> {
    try {
      await stripe.setupIntents.cancel(setupIntentId);
      logger.info(`cancelled setup intent with id ${setupIntentId}`);
    } catch (e) {
      logger.error(e, `failed to cancel setup intent with id ${setupIntentId}`);
      throw e;
    }
  }

  async function cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
      logger.info(`cancelled subscription with id ${subscriptionId}`);
    } catch (e) {
      logger.error(
        e,
        `failed to cancel subscription with id ${subscriptionId}`
      );
      throw e;
    }
  }

  async function getSubscriptionStatus(
    subscriptionId: string
  ): Promise<SubscriptionStatusResponse> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const status = subscription.status;

      logger.info(
        `retrieved subscription status ${status} for subscription with id ${subscriptionId}`
      );
      return { isActive: status === "active", status: status };
    } catch (e) {
      logger.error(
        e,
        `failed to get subscription status for subscription with id ${subscriptionId}`
      );
      throw e;
    }
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
