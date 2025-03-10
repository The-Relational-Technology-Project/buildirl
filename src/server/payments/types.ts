import { Id, Maybe } from "~/utils/types";

export type PaymentService = {
  createAccount(): Promise<PaymentResponse>;
};

export type PaymentResponse = {
  createdEntityId: Maybe<Id>;
};
