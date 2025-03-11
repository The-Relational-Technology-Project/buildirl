import {
  AccountStatusResponse,
  CancelSetupIntentResponse,
  CancelSubscriptionResponse,
  CreateAccountLinkInput,
  CreateAccountLinkResponse,
  CreateAccountResponse,
  CreateCustomerInput,
  CreateCustomerResponse,
  CreateProductInput,
  CreateProductResponse,
  CreateSetupIntentInput,
  CreateSetupIntentResponse,
  CreateSubscriptionInput,
  CreateSubscriptionResponse,
  ArchiveProductResponse,
  GetDefaultPaymentMethodResponse,
  PaymentService,
  UpdateDefaultPaymentMethodInput,
  UpdateDefaultPaymentMethodResponse,
  UpdateProductInput,
  UpdateProductResponse,
  UpdateSubscriptionPaymentMethodInput,
  UpdateSubscriptionPaymentMethodResponse,
  PublishProductResponse
} from "~/server/payments/types";
import { rootLogger } from "~/logger";
import Stripe from "stripe";
import { Maybe } from "~/utils/types";

const logger = rootLogger.child({ module: "paymentService" });

export function createPaymentService(stripe: Stripe): PaymentService {
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
        refresh_url: `${input.origin}/club/payment/refresh/${input.accountId}`,
        return_url: `${input.origin}/club/payment/return/${input.accountId}`,
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
        `retrieved account status ${accountStatus} for account with id ${accountId}`
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
      const product = await stripe.products.create(
        {
          name: input.name,
          description: input.description,
          active: true
        },
        {
          stripeAccount: input.accountId
        }
      );

      const price = await stripe.prices.create(
        {
          product: product.id,
          unit_amount: input.pricePerMonthInUSD,
          currency: "usd",
          recurring: {
            interval: "month"
          }
        },
        {
          stripeAccount: input.accountId
        }
      );

      logger.info(
        `created product ${product.id} and price ${price.id} from input ${input}`
      );

      return {
        productId: product.id,
        priceId: price.id
      };
    } catch (e) {
      logger.error(e, `failed to create product and price from input ${input}`);
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
      logger.info(`updated product ${productId} from input ${input}`);
      return {
        updatedPriceId
      };
    } catch (e) {
      logger.error(e, `failed to update product from ${input}`);
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

  async function archiveProduct(
    productId: string
  ): Promise<ArchiveProductResponse> {
    try {
      await stripe.products.update(productId, { active: false });
      logger.info(`archived product ${productId}`);
      return { success: true };
    } catch (e) {
      logger.error(e, `failed to archive product ${productId}`);
      throw e;
    }
  }

  async function publishProduct(
    productId: string
  ): Promise<PublishProductResponse> {
    try {
      await stripe.products.update(productId, { active: true });
      logger.info(`published product ${productId}`);
      return { success: true };
    } catch (e) {
      logger.error(e, `failed to publish product ${productId}`);
      throw e;
    }
  }

  // Payment Flow
  async function createSetupIntent(
    input: CreateSetupIntentInput
  ): Promise<CreateSetupIntentResponse> {
    try {
      const setupIntent = await stripe.setupIntents.create(
        {
          customer: input.customerId,
          payment_method_types: ["card"],
          metadata: input.metadata
        },
        {
          stripeAccount: input.accountId
        }
      );

      logger.info(`Successfully created setup intent: ${setupIntent.id}`);
      return {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret as string
      };
    } catch (e) {
      logger.error(
        e,
        `Failed to create setup intent for account: ${input.accountId}`
      );
      throw e;
    }
  }

  async function createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResponse> {
    try {
      // Get payment method from setup intent
      const setupIntent = await stripe.setupIntents.retrieve(
        input.setupIntentId,
        { stripeAccount: input.accountId }
      );

      if (!setupIntent.payment_method) {
        throw new Error("No payment method attached to setup intent");
      }

      // Create the subscription
      const subscription = await stripe.subscriptions.create(
        {
          customer: input.customerId,
          items: [{ price: input.priceId }],
          default_payment_method: setupIntent.payment_method as string,
          metadata: input.metadata,
          collection_method: "charge_automatically",
          payment_behavior: "default_incomplete",
          expand: ["latest_invoice.payment_intent"]
        },
        {
          stripeAccount: input.accountId
        }
      );

      logger.info(`Successfully created subscription: ${subscription.id}`);
      return {
        subscriptionId: subscription.id,
        status: subscription.status
      };
    } catch (e) {
      logger.error(
        e,
        `Failed to create subscription with setup intent: ${input.setupIntentId}`
      );
      throw e;
    }
  }

  async function cancelSetupIntent(
    setupIntentId: string
  ): Promise<CancelSetupIntentResponse> {
    try {
      await stripe.setupIntents.cancel(setupIntentId);
      logger.info(`Successfully cancelled setup intent: ${setupIntentId}`);
      return { success: true };
    } catch (e) {
      logger.error(e, `Failed to cancel setup intent: ${setupIntentId}`);
      throw e;
    }
  }

  async function cancelSubscription(
    subscriptionId: string
  ): Promise<CancelSubscriptionResponse> {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
      logger.info(`Successfully cancelled subscription: ${subscriptionId}`);
      return { success: true };
    } catch (e) {
      logger.error(e, `Failed to cancel subscription: ${subscriptionId}`);
      throw e;
    }
  }

  async function updateSubscriptionPaymentMethod(
    input: UpdateSubscriptionPaymentMethodInput
  ): Promise<UpdateSubscriptionPaymentMethodResponse> {
    try {
      await stripe.subscriptions.update(input.subscriptionId, {
        default_payment_method: input.paymentMethodId
      });
      logger.info(
        `Successfully updated payment method for subscription: ${input.subscriptionId}`
      );
      return { success: true };
    } catch (e) {
      logger.error(
        e,
        `Failed to update payment method for subscription: ${input.subscriptionId}`
      );
      throw e;
    }
  }

  async function createCustomer(
    input: CreateCustomerInput
  ): Promise<CreateCustomerResponse> {
    try {
      const customer = await stripe.customers.create({
        email: input.email,
        name: input.name,
        metadata: input.metadata
      });
      logger.info(`Successfully created customer: ${customer.id}`);
      return {
        customerId: customer.id
      };
    } catch (e) {
      logger.error(e, `Failed to create customer with email: ${input.email}`);
      throw e;
    }
  }

  async function createDefaultSetupIntent(
    input: CreateDefaultSetupIntentInput
  ): Promise<CreateSetupIntentResponse> {
    return createSetupIntent({
      accountId: input.accountId,
      customerId: input.customerId,
      metadata: { isDefault: "true" }
    });
  }

  async function getDefaultPaymentMethod(
    customerId: string
  ): Promise<GetDefaultPaymentMethodResponse> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card"
      });

      if (paymentMethods.data.length === 0) {
        logger.info(`No payment methods found for customer: ${customerId}`);
        return {};
      }

      // Use the first payment method as default
      const paymentMethod = paymentMethods.data[0];

      logger.info(
        `Successfully retrieved default payment method for customer: ${customerId}`
      );
      return {
        paymentMethodId: paymentMethod.id,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year
      };
    } catch (e) {
      logger.error(
        e,
        `Failed to get default payment method for customer: ${customerId}`
      );
      throw e;
    }
  }

  async function updateDefaultPaymentMethod(
    input: UpdateDefaultPaymentMethodInput
  ): Promise<UpdateDefaultPaymentMethodResponse> {
    try {
      await stripe.customers.update(input.customerId, {
        invoice_settings: {
          default_payment_method: input.paymentMethodId
        }
      });
      logger.info(
        `Successfully updated default payment method for customer: ${input.customerId}`
      );
      return { success: true };
    } catch (e) {
      logger.error(
        e,
        `Failed to update default payment method for customer: ${input.customerId}`
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
    createSetupIntent,
    createSubscription,
    cancelSetupIntent,
    cancelSubscription,
    updateSubscriptionPaymentMethod,
    createCustomer,
    createDefaultSetupIntent,
    getDefaultPaymentMethod,
    updateDefaultPaymentMethod
  };
}
