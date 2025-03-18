import { NextRequest, NextResponse } from "next/server";
import { rootLogger } from "~/logger";
import { createStripeClient } from "~/server/payments/stripe/stripeClient";
import { stripe } from "~/server/payments/stripe/stripe";
import { prisma } from "~/server/prisma";
import { Prisma, PrismaClient } from "@prisma/client";
import { stringify } from "~/utils";

const logger = rootLogger.child({ module: "backfillCustomersHandler" });
const stripeClient = createStripeClient(stripe);

async function createCustomerForUser(userId: number, prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    return await createCustomerForUserInTransaction(userId, tx);
  });
}

async function createCustomerForUserInTransaction(userId: number, tx: Prisma.TransactionClient): Promise<void> {
  try {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          settings: { select: { email: true, stripeCustomerId: true } }
        }
      });

      if (user.settings?.stripeCustomerId) {
        throw new Error(`user with id ${userId} already has a stripeCustomerId`);
      }

      if (!user.settings?.email) {
        throw new Error(`user with id ${userId} has no settings with email to create Stripe customer`);
      }

      const response = await stripeClient.createCustomer({
        email: user.settings.email,
        name: `${user.firstName} ${user.lastName}`,
        userId: userId
      });

      await tx.userSettings.update({
        data: { stripeCustomerId: response.customerId },
        where: { userId: userId }
      });

      logger.info(
        `backfilled Stripe customer for user with id ${userId} and updated stripeCustomerId ${response.customerId}`
      );
  } catch (e) {
    logger.error(
      e, `failed to backfill Stripe customer for user with ${userId} and update stripeCustomerId`
    );
    throw e;
  }
}

// TODO get rid of this once backfill has been run in all environments
export async function POST(req: NextRequest) {
  try {
    logger.info("starting backfill of Stripe customers for users without stripeCustomerId");

    // find all users without a Stripe customer ID
    const usersWithoutCustomer = await prisma.userSettings.findMany({
      where: { stripeCustomerId: null },
      select: { userId: true }
    });

    logger.info(`found ${usersWithoutCustomer.length} users (${usersWithoutCustomer.map(u => u.userId).join(", ")}) without stripeCustomerId`);

    if (usersWithoutCustomer.length === 0) {
      return NextResponse.json({ 
        message: "No users found without stripeCustomerId. Backfill is complete.",
      }, { status: 200 });
    }

    // create customers for all users sequentially
    for (const user of usersWithoutCustomer) {
      await createCustomerForUser(user.userId, prisma);
    }
    const successMessage = `Stripe customer backfill completed! Successfully backfilled all ${usersWithoutCustomer.length} users without stripeCustomerId.`;
    logger.info(successMessage);
    return NextResponse.json({
      message: successMessage,
    }, { status: 200 });
  } catch (e) {
    const errorMessage = `Stripe customer backfill failed! Please run again to retry the backfill for remaining users.`;
    logger.error(e, errorMessage);
    return NextResponse.json(
      { error: `${errorMessage} error: ${stringify(e)}` },
      { status: 500 }
    );
  }
}
