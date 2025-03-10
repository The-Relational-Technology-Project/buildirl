import { PaymentResponse, PaymentService } from "~/server/payments/types";

export function createPaymentService(): PaymentService {
  async function createAccount(): Promise<PaymentResponse> {
    throw new Error("unimplemented");
  }

  return {
    createAccount
  };
}
