import { CreateAccountResponse, PaymentService } from "~/server/payments/types";
import { stripe } from "~/server/payments/stripe";
import { rootLogger } from "~/logger";

const logger = rootLogger.child({ module: "paymentService" });

export function createPaymentService(): PaymentService {
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

  return {
    createAccount
  };
}
