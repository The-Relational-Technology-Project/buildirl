import { USER_SELECT, asUser } from "~/server/user/service";
import { Prisma } from ".prisma/client";
import { Membership, MembershipWithClub } from "~/server/membership/types";
import { parseAsZodType } from "~/utils/zod";
import { FormResponsesSchema } from "~/server/club/types/form";
import MembershipGetPayload = Prisma.MembershipGetPayload;
import { asClub, CLUB_SELECT } from "~/server/club/utils";
import {
  asMembershipTier,
  MEMBERSHIP_TIER_SELECT
} from "~/server/membershipTier/utils";
import { Maybe } from "~/utils/types";
import { Email } from "~/server/utils/types";

export const MEMBERSHIP_SELECT = {
  id: true,
  user: { select: USER_SELECT },
  membershipTier: {
    select: {
      ...MEMBERSHIP_TIER_SELECT
    }
  },
  status: true,
  applicationResponses: true,
  role: true,
  isWelcomed: true,
  createdAt: true
} satisfies Prisma.MembershipSelect;

export const MEMBERSHIP_WITH_CLUB_SELECT = {
  ...MEMBERSHIP_SELECT,
  membershipTier: {
    select: {
      ...MEMBERSHIP_TIER_SELECT,
      // we want to include this in
      // Membership metadata
      club: {
        select: CLUB_SELECT
      }
    }
  }
} satisfies Prisma.MembershipSelect;

export function asMembership(
  r: MembershipGetPayload<{ select: typeof MEMBERSHIP_SELECT }>,
  userEmail: Maybe<Email> = null
): Membership {
  return {
    id: r.id,
    user: asUser(r.user),
    membershipTier: asMembershipTier(r.membershipTier),
    status: r.status,
    applicationResponses: parseAsZodType(
      r.applicationResponses,
      FormResponsesSchema
    ),
    email: userEmail,
    isWelcomed: r.isWelcomed,
    role: r.role,
    createdAt: r.createdAt
  };
}

export async function asMembershipWithClub(
  r: MembershipGetPayload<{ select: typeof MEMBERSHIP_WITH_CLUB_SELECT }>,
  userEmail: Maybe<Email> = null
): Promise<MembershipWithClub> {
  return {
    id: r.id,
    user: asUser(r.user),
    club: asClub(r.membershipTier.club),
    membershipTier: asMembershipTier(r.membershipTier),
    status: r.status,
    applicationResponses: parseAsZodType(
      r.applicationResponses,
      FormResponsesSchema
    ),
    email: userEmail,
    isWelcomed: r.isWelcomed,
    role: r.role,
    createdAt: r.createdAt
  };
}
