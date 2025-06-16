import { PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { RoleService } from "./types";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import { stringify } from "~/utils";

const logger = rootLogger.child({ module: "roleService" });

export function createRoleService(prisma: PrismaClient): RoleService {
  async function isActiveMembership(membershipId: bigint): Promise<boolean> {
    try {
      const membership = await prisma.membership.findUniqueOrThrow({
        where: { id: membershipId }
      });
      logger.info(
        `queried active membership status for membership with id ${membershipId} with result ${stringify(membership.status)}`
      );
      return membership.status === "ACTIVE";
    } catch (e) {
      logger.error(
        e,
        `failed to query active membership status for membership with id ${membershipId}`
      );
      throw e;
    }
  }

  async function setMembershipAsLead(
    membershipId: bigint
  ): Promise<MutationResult> {
    if (!(await isActiveMembership(membershipId))) {
      throw new Error(
        `Failed to set membership with id ${membershipId} as lead because it is not active.`
      );
    }
    try {
      await prisma.membership.update({
        data: {
          role: "LEAD"
        },
        where: { id: membershipId }
      });

      logger.info(`set role of membership with id ${membershipId} to lead`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to set role of membership with id ${membershipId} to lead`
      );
      throw e;
    }
  }

  async function clearMembershipRole(
    membershipId: bigint
  ): Promise<MutationResult> {
    if (!(await isActiveMembership(membershipId))) {
      throw new Error(
        `Failed to clear role for membership with id ${membershipId} as lead because it is not active.`
      );
    }
    if (await isMembershipLastLeadForClub(membershipId)) {
      throw new Error(
        // user friendly message
        `Failed to clear role for membership with id ${membershipId} because it is the last lead for the club. 
        You must first assign another member as club lead.`
      );
    }

    try {
      await prisma.membership.update({
        data: {
          role: "MEMBER"
        },
        where: { id: membershipId }
      });

      logger.info(`cleared role for membership with id ${membershipId}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to clear role for membership with id ${membershipId}`
      );
      throw e;
    }
  }

  async function isMembershipLastLeadForClub(
    membershipId: bigint
  ): Promise<boolean> {
    try {
      const membership = await prisma.membership.findUniqueOrThrow({
        where: { id: membershipId },
        select: {
          role: true,
          membershipTier: {
            select: {
              clubId: true
            }
          }
        }
      });
      logger.info(
        `queried membership with id ${membershipId} with result ${membership}`
      );

      if (membership.role !== "LEAD") {
        // not a lead, so can't be last lead
        return false;
      }

      const clubId = membership.membershipTier.clubId;
      const leadCount = await prisma.membership.count({
        where: {
          role: "LEAD",
          status: "ACTIVE",
          membershipTier: {
            clubId: clubId
          }
        }
      });
      logger.info(
        `queried lead count for club with id ${clubId} with result ${leadCount}`
      );

      // last lead
      return leadCount === 1;
    } catch (e) {
      logger.error(
        e,
        `failed to query if last lead membership id ${membershipId} for club`
      );
      throw e;
    }
  }

  return {
    setMembershipAsLead,
    clearMembershipRole,
    isMembershipLastLeadForClub
  };
}
