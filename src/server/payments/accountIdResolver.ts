import { Prisma, PrismaClient } from "@prisma/client"
import { rootLogger } from "~/logger";

export type AccountIdResolver = {
    fromMembership(membershipId: bigint): Promise<string>
    fromMembershipInTransaction(membershipId: bigint, tx: Prisma.TransactionClient): Promise<string>
    fromClub(clubId: number): Promise<string>
    fromMembershipTierInTransaction(membershipTierId: number, tx: Prisma.TransactionClient): Promise<string>
}

const logger = rootLogger.child({ module: "accountIdResolver" });

export function createAccountIdResolver(prisma: PrismaClient): AccountIdResolver {

    async function fromMembership(membershipId: bigint): Promise<string> {
        return prisma.$transaction(async (tx) => {
            return fromMembershipInTransaction(membershipId, tx);
        });
    }

    async function fromMembershipInTransaction(membershipId: bigint, tx: Prisma.TransactionClient): Promise<string> {
        try {
            const membership = await tx.membership.findUniqueOrThrow({
                select: {
                    membershipTier: {
                        select: {
                            club: {
                                select: {
                                    id: true,
                                    stripeConnectAccountId: true
                                }
                            }
                        }
                    }
                },
                where: { id: membershipId }
            });

            const accountId = membership.membershipTier.club.stripeConnectAccountId;
            
            if (!accountId) {
                throw new Error(
                    `club with id ${membership.membershipTier.club.id} has no stripeConnectAccountId`
                );
            }
            
            logger.info(`retrieved stripeConnectAccountId for membership with id ${membershipId}`);
            return accountId;
        } catch (e) {
            logger.error(
                e,
                `failed to retrieve stripeConnectAccountId for membership with id ${membershipId}`
            );
            throw e;
        }
    }

    async function fromClub(clubId: number): Promise<string> {
        try {
            const club = await prisma.club.findUniqueOrThrow({
                select: {
                    id: true,
                    stripeConnectAccountId: true
                },
                where: { id: clubId }
            });
            
            const accountId = club.stripeConnectAccountId;
            
            if (!accountId) {
                throw new Error(`club with id ${clubId} has no stripeConnectAccountId`);
            }
            
            logger.info(`retrieved stripeConnectAccountId for club with id ${clubId}`);
            return accountId;
        } catch (e) {
            logger.error(
                e,
                `failed to retrieve stripeConnectAccountId for club with id ${clubId}`
            );
            throw e;
        }
    }

    async function fromMembershipTierInTransaction(
        membershipTierId: number,
        tx: Prisma.TransactionClient
      ): Promise<string> {
        try {
          const membershipTier = await tx.membershipTier.findUniqueOrThrow({
            select: {
              club: {
                select: {
                  id: true,
                  stripeConnectAccountId: true
                }
              }
            },
            where: { id: membershipTierId }
          });
    
          const stripeConnectAccountId = membershipTier.club.stripeConnectAccountId;
    
          if (!stripeConnectAccountId) {
            throw new Error(
              `club with id ${membershipTier.club.id} has no stripeConnectAccountId`
            );
          }
    
          logger.info(
            `retrieved stripeConnectAccountId for membership tier with id ${membershipTierId}`
          );
    
          return stripeConnectAccountId;
        } catch (e) {
          logger.error(
            e,
            `failed to retrieve stripeConnectAccountId for membership tier with id ${membershipTierId}`
          );
          throw e;
        }
      }

    return {
        fromMembership,
        fromMembershipInTransaction,
        fromClub,
        fromMembershipTierInTransaction
    }   
}