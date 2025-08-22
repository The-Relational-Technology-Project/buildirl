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
  CreateSubscriptionForMembershipInput,
  CreateSubscriptionForMembershipResponse,
  PublishProductAndPricesForMembershipTierInput,
  StripeClient,
  SubscriptionStatusResponse,
  UpdateProductAndPricesForMembershipTierInput,
  UpdateProductAndPricesForMembershipTierResponse,
  UpdateSubscriptionInput,
  NullablePriceIdResponse
} from "~/server/payments/stripe/types";
import { rootLogger } from "~/logger";
import Stripe from "stripe";
import { Maybe, BillingInterval, CheckoutFlowType } from "~/utils/types";
import { stringify } from "~/utils";

const logger = rootLogger.child({ module: "stripeClient" });

type StripePriceInterval = Pick<
  Stripe.Price.Recurring,
  "interval" | "interval_count"
>;

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

  function toStripePriceInterval(
    interval: BillingInterval
  ): StripePriceInterval {
    switch (interval) {
      case BillingInterval.MONTHLY:
        return {
          interval: "month",
          interval_count: 1
        };
      case BillingInterval.QUARTERLY:
        return {
          interval: "month",
          interval_count: 3
        };
      case BillingInterval.SEMI_ANNUAL:
        return {
          interval: "month",
          interval_count: 6
        };
      default:
        throw new Error(`Unexpected BillingInterval: ${interval}`);
    }
  }

  async function createPrice(
    productId: string,
    priceInUSD: number,
    nickname: string,
    billingInterval: Maybe<BillingInterval>,
    byAccountId: string
  ): Promise<string> {
    const price = await stripe.prices.create(
      {
        product: productId,
        unit_amount: unitAmount(priceInUSD),
        currency: "usd",
        nickname: nickname,
        recurring: billingInterval
          ? toStripePriceInterval(billingInterval)
          : undefined
      },
      {
        stripeAccount: byAccountId
      }
    );

    logger.info(
      `created price ${price.id} for product ${productId} for amount $${priceInUSD} with account ${byAccountId}`
    );

    return price.id;
  }

  async function createProductAndPricesForMembershipTier(
    input: CreateProductAndPricesForMembershipTierInput,
    byAccountId: string
  ): Promise<CreateProductAndPricesForMembershipTierResponse> {
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

      const priceId = await createPrice(
        product.id,
        input.pricePerBillingInterval,
        "monthly recurring",
        input.billingInterval,
        byAccountId
      );

      const maybeInitiationFeePriceId =
        null === input.initiationFeeInUSD
          ? null
          : await createPrice(
              product.id,
              input.initiationFeeInUSD,
              "initiation fee",
              null,
              byAccountId
            );

      logger.info(
        `created product ${product.id} and price ${priceId}${null === maybeInitiationFeePriceId ? "" : ` and initiation fee price ${maybeInitiationFeePriceId}`} from input ${stringify(input)}`
      );

      return {
        productId: product.id,
        priceId: priceId,
        initiationFeePriceId: maybeInitiationFeePriceId
      };
    } catch (e) {
      logger.error(
        e,
        `failed to create product and price from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function updateProductAndPricesForMembershipTier(
    input: UpdateProductAndPricesForMembershipTierInput,
    byAccountId: string
  ): Promise<UpdateProductAndPricesForMembershipTierResponse> {
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

      const updatedPriceId = await updatePriceIfChanged(
        input.productId,
        input.priceId,
        input.pricePerBillingInterval,
        input.billingInterval,
        "monthly recurring",
        byAccountId
      );

      const updatedInitiationFeePriceId =
        await upsertNonRecurringNullablePriceIfChanged(
          input.productId,
          input.initiationFee.priceId,
          input.initiationFee.priceInUSD,
          "initiation fee",
          byAccountId
        );

      logger.info(
        `updated product ${input.productId} from input ${stringify(input)}`
      );
      return {
        updatedPriceId,
        updatedInitiationFeePriceId
      };
    } catch (e) {
      logger.error(e, `failed to update product from ${stringify(input)}`);
      throw e;
    }
  }

  function isPriceChanged(
    existingPrice: Stripe.Price,
    newPriceInUSD: number,
    newBillingInterval: Maybe<BillingInterval>
  ): boolean {
    const isPriceChanged =
      existingPrice.unit_amount !== unitAmount(newPriceInUSD);

    const newPriceInterval = newBillingInterval
      ? toStripePriceInterval(newBillingInterval)
      : null;

    return (
      isPriceChanged ||
      isPriceIntervalChanged(existingPrice.recurring, newPriceInterval)
    );
  }

  function isPriceIntervalChanged(
    existingInterval: Maybe<StripePriceInterval>,
    newInterval: Maybe<StripePriceInterval>
  ): boolean {
    if (existingInterval === null && newInterval === null) {
      return false;
    }
    // one is null other is non-null
    if (existingInterval === null || newInterval === null) {
      return true;
    }
    return (
      existingInterval.interval !== newInterval.interval ||
      existingInterval.interval_count !== newInterval.interval_count
    );
  }

  async function updatePriceIfChanged(
    productId: string,
    currentPriceId: string,
    newPriceInUSD: number,
    newBillingInterval: Maybe<BillingInterval>,
    nickname: string,
    byAccountId: string
  ): Promise<Maybe<string>> {
    try {
      const existingPrice = await stripe.prices.retrieve(currentPriceId, {
        stripeAccount: byAccountId
      });

      if (isPriceChanged(existingPrice, newPriceInUSD, newBillingInterval)) {
        const newPriceId = await createPrice(
          productId,
          newPriceInUSD,
          nickname,
          newBillingInterval,
          byAccountId
        );

        // deactivate old price
        await archivePrice(currentPriceId, byAccountId);
        logger.info(
          `updated price for product ${productId} from price ${currentPriceId} to new price ${newPriceId} with amount ${newPriceInUSD}`
        );
        return newPriceId;
      }

      logger.info(
        `did not update price for product ${productId} and price ${currentPriceId} because there was no price change`
      );
      // else no updated price id
      return null;
    } catch (e) {
      logger.error(
        e,
        `failed to update price for product ${productId} and price ${currentPriceId} to ${newPriceInUSD}`
      );
      throw e;
    }
  }

  async function upsertNonRecurringNullablePriceIfChanged(
    productId: string,
    currentPriceId: Maybe<string>,
    newPriceInUSD: Maybe<number>,
    nickname: string,
    byAccountId: string
  ): Promise<Maybe<NullablePriceIdResponse>> {
    if (null === currentPriceId && null === newPriceInUSD) {
      // no change
      return null;
    }

    // create a price when one does not already exist
    if (null === currentPriceId && null !== newPriceInUSD) {
      const priceId = await createPrice(
        productId,
        newPriceInUSD,
        nickname,
        null,
        byAccountId
      );
      return { updatedPriceId: priceId };
    }

    // archive price if there is existing price but new price is set to null
    if (null !== currentPriceId && null === newPriceInUSD) {
      await archivePrice(currentPriceId, byAccountId);
      // as we updated price to null, we return the response
      // with null value
      return { updatedPriceId: null };
    }

    // somehow typescript compiler doesn't understand this is not possible and we need to spell it out explicitly!
    if (null === currentPriceId || null === newPriceInUSD) {
      throw new Error(
        `expected non-null currentPriceId ${currentPriceId} and newPriceInUSD ${newPriceInUSD}`
      );
    }

    const updatePriceId = await updatePriceIfChanged(
      productId,
      currentPriceId,
      newPriceInUSD,
      null,
      nickname,
      byAccountId
    );

    if (null === updatePriceId) {
      // no change
      return null;
    }

    return { updatedPriceId: updatePriceId };
  }

  async function archivePrice(priceId: string, byAccountId: string) {
    return await stripe.prices.update(
      priceId,
      { active: false },
      {
        stripeAccount: byAccountId
      }
    );
  }

  async function archiveProductAndPricesForMembershipTier(
    input: ArchiveProductAndPricesForMembershipTierInput,
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
      for (const priceId of input.priceIds) {
        await archivePrice(priceId, byAccountId);
      }
      logger.info(
        `archived product ${input.productId} and prices ${input.priceIds.join(", ")}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to archive product ${input.productId} and price ${input.priceIds.join(", ")}`
      );
      throw e;
    }
  }

  async function publishProductAndPricesForMembershipTier(
    input: PublishProductAndPricesForMembershipTierInput,
    byAccountId: string
  ): Promise<void> {
    try {
      await stripe.products.update(
        input.productId,
        { active: true },
        { stripeAccount: byAccountId }
      );
      for (const priceId of input.priceIds) {
        await stripe.prices.update(
          priceId,
          { active: true },
          {
            stripeAccount: byAccountId
          }
        );
      }
      logger.info(
        `published product ${input.productId} and price ${input.priceIds.join(", ")}`
      );
    } catch (e) {
      logger.error(
        e,
        `failed to publish product ${input.productId} and price ${input.priceIds.join(", ")}`
      );
      throw e;
    }
  }

  async function createCustomerForMembership(
    input: CreateCustomerForMembershipInput,
    byAccountId: string
  ): Promise<CreateCustomerForMembershipResponse> {
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

  async function createCustomerPortalConfiguration(
    byAccountId: string
  ): Promise<CreateCustomerPortalConfigurationResponse> {
    try {
      const configuration = await stripe.billingPortal.configurations.create(
        {
          features: {
            customer_update: {
              allowed_updates: [
                "address",
                "email",
                "name",
                "phone",
                "shipping"
              ],
              enabled: true
            },
            invoice_history: { enabled: true },
            payment_method_update: { enabled: true },
            // these are the important ones; we do not want customers to cancel
            // subscription out of application; instead they should use in-app flows
            subscription_cancel: { enabled: false },
            subscription_update: { enabled: false }
          }
        },
        {
          stripeAccount: byAccountId
        }
      );
      logger.info(
        `successfully created customer portal configuration with id ${configuration.id}`
      );
      return {
        configurationId: configuration.id
      };
    } catch (e) {
      logger.error(e, `failed to create customer portal configuration`);
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
          configuration: input.configurationId,
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

  async function createCheckoutSessionForMembership(
    input: CreateCheckoutSessionForMembershipInput,
    byAccountId: string
  ): Promise<CreateCheckoutSessionForMembershipResponse> {
    try {
      const successUrl =
        input.flowType === CheckoutFlowType.TIER_CHANGE
          ? `${input.origin}/apply/${input.clubPublicId}/completed?flow=tier-change`
          : `${input.origin}/apply/${input.clubPublicId}/completed`;

      const session = await stripe.checkout.sessions.create(
        {
          customer: input.customerId,
          success_url: successUrl,
          currency: "usd",
          setup_intent_data: {
            metadata: {
              // does not allow saving of bigint so we convert to string
              externalMembershipId: input.membershipId.toString(),
              flow_type: input.flowType
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

  function generateSubscriptionIdempotencyKey(membershipId: bigint): string {
    return `membership-${membershipId}`;
  }

  async function createSubscriptionForMembership(
    input: CreateSubscriptionForMembershipInput,
    byAccountId: string
  ): Promise<CreateSubscriptionForMembershipResponse> {
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

      const idempotencyKey = generateSubscriptionIdempotencyKey(
        input.membershipId
      );

      const subscription = await stripe.subscriptions.create(
        {
          customer: input.customerId,
          items: [{ price: input.priceId }],
          add_invoice_items:
            // add initiation fee as item on first invoice only
            // if there is one
            null === input.initiationFeePriceId
              ? undefined
              : [{ price: input.initiationFeePriceId }],
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
          stripeAccount: byAccountId,
          idempotencyKey: idempotencyKey
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

  function isMissingStripeSubscription(e: unknown): boolean {
    return stringify(e).toLowerCase().includes("no such subscription");
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
      // this can happen if subscription was expired by Stripe.
      // we should continue here as the subscription is effectively
      // canceled if it does not exist
      if (isMissingStripeSubscription(e)) {
        return;
      }
      throw e;
    }
  }

  async function updateSubscription(
    input: UpdateSubscriptionInput,
    byAccountId: string
  ): Promise<void> {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        input.subscriptionId,
        {
          stripeAccount: byAccountId
        }
      );

      const subscriptionItems = subscription.items.data;
      if (subscriptionItems.length !== 1) {
        throw new Error(
          `subscription ${input.subscriptionId} has ${subscriptionItems.length} subscription items, only one subscription item is expected`
        );
      }

      const subscriptionItem = subscriptionItems[0];
      if (!subscriptionItem) {
        throw new Error(
          `subscription ${input.subscriptionId} has no valid subscription item`
        );
      }

      await stripe.subscriptions.update(
        input.subscriptionId,
        {
          items: [
            {
              id: subscriptionItem.id,
              price: input.newPriceId
            }
          ],
          // charge for new price immediately, and calculate prorations
          // as an immediate invoice
          proration_behavior: "always_invoice"
        },
        {
          stripeAccount: byAccountId
        }
      );

      // if there's an initiation fee for the new tier, create an invoice item
      if (input.newInitiationFeePriceId) {
        await stripe.invoiceItems.create(
          {
            customer: subscription.customer as string,
            price: input.newInitiationFeePriceId,
            subscription: input.subscriptionId
          },
          {
            stripeAccount: byAccountId
          }
        );
      }

      logger.info(
        `updated subscription ${input.subscriptionId} with new price ${input.newPriceId}`
      );
      return;
    } catch (e) {
      logger.error(
        e,
        `failed to update subscription with id ${input.subscriptionId}`
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
      if (isMissingStripeSubscription(e)) {
        return { isActive: false, status: "missing" };
      }
      throw e;
    }
  }

  return {
    createAccount,
    createAccountLink,
    getAccountStatus,
    createProductAndPricesForMembershipTier,
    updateProductAndPricesForMembershipTier,
    archiveProductAndPricesForMembershipTier,
    publishProductAndPricesForMembershipTier,
    createCustomerForMembership,
    createCustomerPortalConfiguration,
    createCustomerPortalSession,
    createCheckoutSessionForMembership,
    createSubscriptionForMembership,
    cancelSubscription,
    updateSubscription,
    getSubscriptionStatus
  };
}
