import {
  CreateAccountLinkInput,
  CreateAccountLinkResponse,
  CreateAccountResponse,
  PaymentService
} from "~/server/payments/types";
import { rootLogger } from "~/logger";
import Stripe from "stripe";

const logger = rootLogger.child({ module: "paymentService" });

export function createPaymentService(stripe: Stripe): PaymentService {
  async function createAccount(): Promise<CreateAccountResponse> {
    try {
      const account = await stripe.accounts.create({});
      const accountId = account.id;
      logger.info(`successfully created account`);
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
        refresh_url: `${input.origin}/refresh/${input.accountId}`,
        return_url: `${input.origin}/return/${input.accountId}`,
        type: "account_onboarding"
      });
      const url = accountLink.url;
      logger.info(
        `successfully created account link with url ${url} for account with id ${input.accountId}`
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

  return {
    createAccount,
    createAccountLink
  };
}
