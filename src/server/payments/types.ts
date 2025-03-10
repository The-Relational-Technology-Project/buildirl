export type PaymentService = {
  createAccount(): Promise<CreateAccountResponse>;
  createAccountLink(
    input: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResponse>;
};

export type CreateAccountLinkInput = {
  origin: string;
  accountId: string;
};

export type CreateAccountLinkResponse = {
  url: string;
};

export type CreateAccountResponse = {
  accountId: string;
};
