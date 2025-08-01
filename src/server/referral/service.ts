// !! PROTOTYPE

import { PrismaClient } from "@prisma/client";
import { ReferralService } from "~/server/referral/types";

export function createReferralService(prisma: PrismaClient): ReferralService {
  async function submitReferralEmails(referrerId: number, emails: string[]) {
    const referralData = emails.map((email) => ({
      referrerId,
      email
    }));

    await prisma.referralEmail.createMany({
      data: referralData
    });

    return;
  }

  return {
    submitReferralEmails
  };
}
