import { NextRequest, NextResponse } from "next/server";
import { rootLogger } from "~/logger";
import { env } from "~/env";
import { stripe } from "~/server/payments/stripe/stripe";
import { stringify } from "~/utils";
import { createPaymentEventProcessor } from "~/server/payments/eventProcessor";
import { prisma } from "~/server/prisma";
import { membershipService } from "~/server/services";

const logger = rootLogger.child({ module: "stripeWebhookHandler" });

const eventProcessor = createPaymentEventProcessor(prisma, membershipService);

export async function POST(req: NextRequest): Promise<NextResponse> {
  // raw body from request
  const body = await req.text();

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logger.error("missing Stripe signature");
    return NextResponse.json(
      { error: "missing Stripe signature" },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    // https://docs.stripe.com/api/events/types
    // https://docs.stripe.com/billing/subscriptions/webhooks
    switch (event.type) {
      case "setup_intent.succeeded":
        const session = event.data.object;
        await eventProcessor.onSetupIntentSuccess(session);
        break;
      // TODO handle 'customer.subscription.deleted', possibly automatically
      //  put them in the free tier
      default:
        // TODO for failed cases (e.g. invoice.payment_failed), should we at
        //  least alert as error?
        logger.warn(
          `unhandled event type: ${event.type} with id ${event.id} from account ${event.account}`
        );
    }

    logger.info(
      `successfully processed event ${event.type} with id ${event.id} from account ${event.account}`
    );

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    logger.error(e, `webhook error for req ${stringify(body)}`);
    // errors here will be retried by Stripe
    // TODO we can observe if there are classes and distinguish errors that are not retryable
    return NextResponse.json(
      { error: `webhook error: ${stringify(e)}` },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
      "Access-Control-Max-Age": "86400"
    }
  });
}
