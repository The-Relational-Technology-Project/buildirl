import { createStripeClient } from "~/server/payments/stripe/stripeClient";
import { stripe } from "~/server/payments/stripe/stripe";
import { createAccountIdResolver } from "~/server/payments/accountIdResolver";
import { prisma } from "~/server/prisma";
import { createEmailClient } from "~/server/email/client/emailClient";
import { mailTransport } from "~/server/email/client/nodemailer";
import { createUserService } from "~/server/user/service";
import { createEmailService } from "~/server/email/service";
import { createPaymentService } from "~/server/payments/service";
import { createMembershipTierService } from "~/server/membershipTier/service";
import { createFollowingService } from "~/server/following/service";
import { createRoleService } from "~/server/role/service";
import { createMembershipService } from "~/server/membership/service";
import { createClubService } from "~/server/club/service";

const stripeClient = createStripeClient(stripe);
const accountIdResolver = createAccountIdResolver(prisma);
const emailClient = createEmailClient(mailTransport);

/**
 * Export these entity services as modules so they can be reused
 * between the trpc layer and other http handlers
 */
export const userService = createUserService(prisma);
export const emailService = createEmailService(
  prisma,
  emailClient,
  userService
);
export const paymentService = createPaymentService(
  stripeClient,
  prisma,
  accountIdResolver
);
export const membershipTierService = createMembershipTierService(
  prisma,
  paymentService
);
export const followingService = createFollowingService(prisma, userService);
export const roleService = createRoleService(prisma);
export const membershipService = createMembershipService(
  prisma,
  userService,
  membershipTierService,
  followingService,
  roleService,
  emailService,
  paymentService
);
export const clubService = createClubService(
  prisma,
  membershipTierService,
  membershipService
);
