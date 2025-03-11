import { Url, UrlSchema } from "~/server/service/types";
import { z } from "zod";

export type PaymentService = {
  createAccount(): Promise<CreateAccountResponse>;
  createAccountLink(
    input: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResponse>;
};

export const CreateAccountLinkInputSchema = z.object({
  origin: UrlSchema,
  accountId: z.string()
});
export type CreateAccountLinkInput = z.infer<
  typeof CreateAccountLinkInputSchema
>;

export type CreateAccountLinkResponse = {
  redirectUrl: Url;
};

export type CreateAccountResponse = {
  accountId: string;
};
