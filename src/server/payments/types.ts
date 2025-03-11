import { MonetaryValueSchema, Url, UrlSchema } from "~/server/service/types";
import { z } from "zod";
import { Maybe } from "~/utils/types";

export type PaymentService = {
  // connected account management
  createAccount(): Promise<CreateAccountResponse>;
  createAccountLink(
    input: CreateAccountLinkInput
  ): Promise<CreateAccountLinkResponse>;
  getAccountStatus(accountId: string): Promise<AccountStatusResponse>;

  // product set-up
  createProduct(input: CreateProductInput): Promise<CreateProductResponse>;
  updateProduct(
    productId: string,
    input: UpdateProductInput
  ): Promise<UpdateProductResponse>;
  archiveProduct(productId: string): Promise<void>;
  publishProduct(productId: string): Promise<void>;

  // payment flow
  createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResponse>;
  cancelSetupIntent(setupIntentId: string): Promise<void>;
  cancelSubscription(subscriptionId: string): Promise<void>;
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

export type AccountStatusResponse = {
  isComplete: boolean;
  missingRequirements?: string[];
};

export const CreateProductInputSchema = z.object({
  accountId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pricePerMonthInUSD: MonetaryValueSchema
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

export type CreateProductResponse = {
  productId: string;
  priceId: string;
};

export const UpdateProductInputSchema = z.object({
  currentPriceId: z.string(),
  name: z.string(),
  description: z.string(),
  pricePerMonthInUSD: MonetaryValueSchema
});
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;

export type UpdateProductResponse = {
  updatedPriceId: Maybe<string>;
};

export const CreateSubscriptionInputSchema = z.object({
  accountId: z.string(),
  customerId: z.string(),
  priceId: z.string(),
  setupIntentId: z.string()
});
export type CreateSubscriptionInput = z.infer<
  typeof CreateSubscriptionInputSchema
>;

export type CreateSubscriptionResponse = {
  subscriptionId: string;
  status: string;
};
