import Stripe from "stripe";

export function uniqueSetupIntentId(): string {
  return `setup:intent:id:${crypto.randomUUID()}`;
}

export function setupCheckoutSession(
  setupIntentId: string,
  membershipId: string
): Stripe.Checkout.Session {
  return {
    id: `cs_test_mock`,
    object: "checkout.session",
    adaptive_pricing: null,
    after_expiration: null,
    allow_promotion_codes: false,
    amount_subtotal: 2000,
    amount_total: 2000,
    automatic_tax: {
      enabled: false,
      status: null,
      liability: null
    },
    billing_address_collection: "auto",
    cancel_url: "https://stripe.com/cancel",
    client_reference_id: null,
    client_secret: null,
    collected_information: null,
    consent: null,
    consent_collection: null,
    created: 100000,
    currency: "usd",
    currency_conversion: null,
    custom_fields: [],
    custom_text: {
      after_submit: null,
      shipping_address: null,
      submit: null,
      terms_of_service_acceptance: null
    },
    customer: null,
    customer_creation: "if_required",
    customer_details: null,
    customer_email: null,
    discounts: [],
    expires_at: 100100,
    invoice: null,
    invoice_creation: {
      enabled: false,
      invoice_data: {
        account_tax_ids: null,
        custom_fields: null,
        description: null,
        footer: null,
        issuer: null,
        metadata: null,
        rendering_options: null
      }
    },
    livemode: false,
    locale: null,
    metadata: {
      membershipId: membershipId
    },
    mode: "setup",
    payment_intent: null,
    payment_link: null,
    payment_method_collection: "always",
    payment_method_configuration_details: null,
    payment_method_options: null,
    payment_method_types: ["card"],
    payment_status: "no_payment_required",
    phone_number_collection: {
      enabled: false
    },
    recovered_from: null,
    redirect_on_completion: "always",
    return_url: "https://stripe.com/return",
    saved_payment_method_options: null,
    setup_intent: {
      // the id and the metadata of the setup intent is the only part of the
      // payload that actually matters
      id: setupIntentId,
      metadata: {
        externalMembershipId: membershipId
      },
      object: "setup_intent",
      application: null,
      attach_to_self: false,
      automatic_payment_methods: null,
      cancellation_reason: null,
      client_secret: "setup_mock_secret",
      created: 100000,
      customer: null,
      description: null,
      flow_directions: null,
      last_setup_error: null,
      latest_attempt: null,
      livemode: false,
      mandate: null,
      next_action: null,
      on_behalf_of: null,
      payment_method: "pm_mock",
      payment_method_configuration_details: null,
      payment_method_options: null,
      payment_method_types: ["card"],
      single_use_mandate: null,
      status: "succeeded",
      usage: "off_session"
    },
    shipping_address_collection: null,
    shipping_cost: null,
    shipping_details: null,
    shipping_options: [],
    status: "open",
    submit_type: "auto",
    subscription: null,
    success_url: "https://stripe.com/success",
    tax_id_collection: {
      enabled: false,
      required: "never"
    },
    total_details: {
      amount_discount: 0,
      amount_shipping: 0,
      amount_tax: 0,
      breakdown: {
        discounts: [],
        taxes: []
      }
    },
    ui_mode: "hosted",
    url: `https://checkout.stripe.com/pay/cs_test_mock`
  };
}
