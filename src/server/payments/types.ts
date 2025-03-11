import { Url, UrlSchema } from "~/server/service/types";
import { z } from "zod";

// Connected Account Management Types
export type PaymentService = {
  // Connected Account Management
  createAccount(): Promise<CreateAccountResponse>;
  createAccountLink(input: CreateAccountLinkInput): Promise<CreateAccountLinkResponse>;
  getAccountStatus(accountId: string): Promise<AccountStatusResponse>;
  createDashboardLink(accountId: string): Promise<DashboardLinkResponse>;
  
  // Subscription Product Setup
  createProduct(input: CreateProductInput): Promise<CreateProductResponse>;
  updateProduct(input: UpdateProductInput): Promise<UpdateProductResponse>;
  deleteProduct(productId: string): Promise<DeleteProductResponse>;
  
  // Payment Flow
  createSetupIntent(input: CreateSetupIntentInput): Promise<CreateSetupIntentResponse>;
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResponse>;
  cancelSetupIntent(setupIntentId: string): Promise<CancelSetupIntentResponse>;
  
  // Subscription Management
  cancelSubscription(subscriptionId: string): Promise<CancelSubscriptionResponse>;
  updateSubscriptionPaymentMethod(input: UpdateSubscriptionPaymentMethodInput): Promise<UpdateSubscriptionPaymentMethodResponse>;
  
  // Default Setup Intent
  createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResponse>;
  createDefaultSetupIntent(input: CreateDefaultSetupIntentInput): Promise<CreateSetupIntentResponse>;
  getDefaultPaymentMethod(customerId: string): Promise<GetDefaultPaymentMethodResponse>;
  updateDefaultPaymentMethod(input: UpdateDefaultPaymentMethodInput): Promise<UpdateDefaultPaymentMethodResponse>;
};

// Connected Account Types
export const CreateAccountLinkInputSchema = z.object({
  origin: UrlSchema,
  accountId: z.string()
});
export type CreateAccountLinkInput = z.infer<typeof CreateAccountLinkInputSchema>;

export type CreateAccountLinkResponse = {
  redirectUrl: Url;
};

export type CreateAccountResponse = {
  accountId: string;
};

export type AccountStatusResponse = {
  accountId: string;
  isComplete: boolean;
  missingRequirements?: string[];
};

export type DashboardLinkResponse = {
  redirectUrl: Url;
};

// Product Types
export const CreateProductInputSchema = z.object({
  accountId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  priceAmount: z.number(),
  currency: z.string().default('usd'),
  interval: z.enum(['day', 'week', 'month', 'year']),
  tierExternalId: z.string(),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

export type CreateProductResponse = {
  productId: string;
  priceId: string;
};

export const UpdateProductInputSchema = z.object({
  productId: z.string(),
  priceId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  priceAmount: z.number().optional(),
  active: z.boolean().optional(),
});
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;

export type UpdateProductResponse = {
  productId: string;
  priceId: string;
};

export type DeleteProductResponse = {
  success: boolean;
};

// Payment Flow Types
export const CreateSetupIntentInputSchema = z.object({
  accountId: z.string(),
  customerId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});
export type CreateSetupIntentInput = z.infer<typeof CreateSetupIntentInputSchema>;

export type CreateSetupIntentResponse = {
  setupIntentId: string;
  clientSecret: string;
};

export const CreateSubscriptionInputSchema = z.object({
  accountId: z.string(),
  customerId: z.string(),
  priceId: z.string(),
  setupIntentId: z.string(),
  metadata: z.record(z.string()).optional(),
});
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionInputSchema>;

export type CreateSubscriptionResponse = {
  subscriptionId: string;
  status: string;
};

export type CancelSetupIntentResponse = {
  success: boolean;
};

// Subscription Management Types
export type CancelSubscriptionResponse = {
  success: boolean;
};

export const UpdateSubscriptionPaymentMethodInputSchema = z.object({
  subscriptionId: z.string(),
  paymentMethodId: z.string(),
});
export type UpdateSubscriptionPaymentMethodInput = z.infer<typeof UpdateSubscriptionPaymentMethodInputSchema>;

export type UpdateSubscriptionPaymentMethodResponse = {
  success: boolean;
};

// Default Setup Intent Types
export const CreateCustomerInputSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerInputSchema>;

export type CreateCustomerResponse = {
  customerId: string;
};

export const CreateDefaultSetupIntentInputSchema = z.object({
  customerId: z.string(),
  accountId: z.string(),
});
export type CreateDefaultSetupIntentInput = z.infer<typeof CreateDefaultSetupIntentInputSchema>;

export type GetDefaultPaymentMethodResponse = {
  paymentMethodId?: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
};

export const UpdateDefaultPaymentMethodInputSchema = z.object({
  customerId: z.string(),
  paymentMethodId: z.string(),
});
export type UpdateDefaultPaymentMethodInput = z.infer<typeof UpdateDefaultPaymentMethodInputSchema>;

export type UpdateDefaultPaymentMethodResponse = {
  success: boolean;
};
