import {
  AccountStatusResponse,
  ArchiveProductAndPriceInput,
  CreateAccountInput,
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
import { rootLogger } from "~/logger";
import Stripe from "stripe";
import { Maybe } from "~/utils/types";
import { stringify } from "~/utils";

const logger = rootLogger.child({ module: "stripeClient" });

export function createStripeClient(stripe: Stripe): StripeClient {
  async function createAccount(
    input: CreateAccountInput
  ): Promise<CreateAccountResponse> {
    try {
      const account = await stripe.accounts.create({
        type: "standard",
        email: input.email,
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
        refresh_url: `${input.origin}/club/${input.clubId}/manage/payments/refresh-account-link`,
        return_url: `${input.origin}/club/${input.clubId}/manage?tab=stripe-connect`,
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

  function unitAmount(priceInUSD: number): number {
    // convert to cents
    return priceInUSD * 100;
  }

  async function createProductAndPrice(
    input: CreateProductAndPriceInput,
    byAccountId: string
  ): Promise<CreateProductAndPriceResponse> {
    try {
      const product = await stripe.products.create(
        {
          name: input.name,
          description: input.description,
          active: true,
          metadata: {
            externalMembershipTierId: input.membershipTierId
          }
        },
        {
          stripeAccount: byAccountId
        }
      );

      const price = await stripe.prices.create(
        {
          product: product.id,
          unit_amount: unitAmount(input.pricePerMonthInUSD),
          currency: "usd",
          recurring: {
            interval: "month"
          }
        },
        {
          stripeAccount: byAccountId
        }
      );

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

  async function updateProductAndPrice(
    input: UpdateProductAndPriceInput,
    byAccountId: string
  ): Promise<UpdateProductAndPriceResponse> {
    try {
      await stripe.products.update(
        input.productId,
        {
          name: input.name,
          description: input.description
        },
        {
          stripeAccount: byAccountId
        }
      );

      const updatedPriceId = await updatePriceIfAmountChanged(
        input.productId,
        input.pricePerMonthInUSD,
        input.priceId,
        byAccountId
      );
      logger.info(
        `updated product ${input.productId} from input ${stringify(input)}`
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
    currentPriceId: string,
    byAccountId: string
  ): Promise<Maybe<string>> {
    try {
      const existingPrice = await stripe.prices.retrieve(currentPriceId, {
        stripeAccount: byAccountId
      });
      if (existingPrice.unit_amount !== unitAmount(pricePerMonthInUSD)) {
        const newPrice = await stripe.prices.create(
          {
            product: productId,
            unit_amount: unitAmount(pricePerMonthInUSD),
            currency: "usd",
            recurring: {
              interval: "month"
            }
          },
          {
            stripeAccount: byAccountId
          }
        );
        // deactivate old price
        await stripe.prices.update(
          currentPriceId,
          { active: false },
          {
            stripeAccount: byAccountId
          }
        );
        logger.info(
          `updated price for product ${productId} from price ${currentPriceId} to new price ${newPrice.id} with amount ${pricePerMonthInUSD} `
        );
        return newPrice.id;
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

  async function archiveProductAndPrice(
    input: ArchiveProductAndPriceInput,
    byAccountId: string
  ): Promise<void> {
    try {
      await stripe.products.update(
        input.productId,
        { active: false },
        {
          stripeAccount: byAccountId
        }
      );
      await stripe.prices.update(
        input.priceId,
        { active: false },
        {
          stripeAccount: byAccountId
        }
      );
      logger.info(
        `archived product ${input.productId} and price ${input.priceId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to archive product ${input.productId} and price ${input.priceId}`
      );
      throw e;
    }
  }

  async function publishProductAndPrice(
    input: PublishProductAndPriceInput,
    byAccountId: string
  ): Promise<void> {
    try {
      await stripe.products.update(
        input.productId,
        { active: true },
        { stripeAccount: byAccountId }
      );
      await stripe.prices.update(
        input.priceId,
        { active: true },
        {
          stripeAccount: byAccountId
        }
      );
      logger.info(
        `published product ${input.productId} and price ${input.priceId}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to publish product ${input.productId} and price ${input.priceId}`
      );
      throw e;
    }
  }

  async function createCustomer(
    input: CreateCustomerInput,
    byAccountId: string
  ): Promise<CreateCustomerResponse> {
    try {
      const customer = await stripe.customers.create(
        {
          name: input.name,
          email: input.email,
          metadata: {
            externalMembershipId: input.membershipId.toString()
          }
        },
        {
          stripeAccount: byAccountId
        }
      );
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

  async function createCustomerPortalSession(
    input: CreateCustomerPortalSessionInput,
    byAccountId: string
  ): Promise<CreateCustomerPortalSessionResponse> {
    try {
      const session = await stripe.billingPortal.sessions.create(
        {
          customer: input.customerId,
          return_url: `${input.origin}/club/${input.clubId}/manage-membership`
        },
        {
          stripeAccount: byAccountId
        }
      );
      logger.info(
        `successfully created customer portal session with url ${session.url} from input ${stringify(input)}`
      );
      return {
        redirectUrl: session.url
      };
    } catch (e) {
      logger.error(
        e,
        `failed to create customer portal session from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function createCheckoutSession(
    input: CreateCheckoutSessionInput,
    byAccountId: string
  ): Promise<CreateCheckoutSessionResponse> {
    try {
      const session = await stripe.checkout.sessions.create(
        {
          customer: input.customerId,
          success_url: `${input.origin}/apply/${input.clubId}/completed`,
          setup_intent_data: {
            metadata: {
              // does not allow saving of bigint so we convert to string
              externalMembershipId: input.membershipId.toString()
            }
          },
          mode: "setup"
        },
        {
          stripeAccount: byAccountId
        }
      );

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
    input: CreateSubscriptionInput,
    byAccountId: string
  ): Promise<CreateSubscriptionResponse> {
    try {
      const setupIntent = await stripe.setupIntents.retrieve(
        input.setupIntentId,
        {
          stripeAccount: byAccountId
        }
      );

      if (!setupIntent.payment_method) {
        throw new Error(
          `no payment method attached to setup intent ${stringify(setupIntent)}`
        );
      }

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
          stripeAccount: byAccountId
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

  async function cancelSetupIntent(
    setupIntentId: string,
    byAccountId: string
  ): Promise<void> {
    try {
      await stripe.setupIntents.cancel(setupIntentId, {
        stripeAccount: byAccountId
      });
      logger.info(`cancelled setup intent with id ${setupIntentId}`);
    } catch (e) {
      logger.error(e, `failed to cancel setup intent with id ${setupIntentId}`);
      throw e;
    }
  }

  async function cancelSubscription(
    subscriptionId: string,
    byAccountId: string
  ): Promise<void> {
    try {
      await stripe.subscriptions.cancel(subscriptionId, {
        stripeAccount: byAccountId
      });
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
    subscriptionId: string,
    byAccountId: string
  ): Promise<SubscriptionStatusResponse> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        stripeAccount: byAccountId
      });
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
    createProductAndPrice,
    updateProductAndPrice,
    archiveProductAndPrice,
    publishProductAndPrice,
    createCustomer,
    createCustomerPortalSession,
    createCheckoutSession,
    createSubscription,
    cancelSetupIntent,
    cancelSubscription,
    getSubscriptionStatus
  };
}
