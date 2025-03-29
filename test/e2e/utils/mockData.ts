import Stripe from "stripe";

export function uniqueSetupIntentId(): string {
  return `setup:intent:id:${crypto.randomUUID()}`;
}

export function setupIntent(
  setupIntentId: string,
  membershipId: string
): Stripe.SetupIntent {
  return {
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
  };
}
