export type PaymentService = {
  createAccount(): Promise<CreateAccountResponse>;
};

export type CreateAccountResponse = {
  accountId: string;
};
