import { Prisma, type PrismaClient } from "@prisma/client";
import { rootLogger } from "~/logger";
import { stringify } from "~/utils";
import { DEFAULT_APPLICATION_QUESTIONS } from "~/server/utils/defaults";
import {
  Club,
  ClubService,
  ClubStatistics,
  CreateClubInput,
  UpdateClubApplicationQuestionsInput,
  UpdateClubDisplayImageUrlsInput,
  UpdateClubInput
} from "~/server/club/types";
import { MutationResult, NO_ID_MUTATION_RESULT } from "~/server/utils/types";
import { asClub, CLUB_SELECT } from "~/server/club/utils";
import { MembershipTierService } from "~/server/membershipTier/types";
import { idAsNumber } from "~/utils/types";
import { MembershipService } from "~/server/membership/types";

const logger = rootLogger.child({ module: "clubService" });

export function createClubService(
  prisma: PrismaClient,
  membershipTierService: MembershipTierService,
  membershipService: MembershipService
): ClubService {
  async function getClubByPublicId(publicId: string): Promise<Club> {
    try {
      const result = await prisma.club.findUniqueOrThrow({
        select: CLUB_SELECT,
        where: {
          publicId: publicId
        }
      });
      const club = asClub(result);
      logger.info(
        `queried club with publicId ${publicId} with result ${stringify(club)}`
      );
      return club;
    } catch (e) {
      logger.error(e, `failed to query club with publicId ${publicId}`);
      throw e;
    }
  }

  async function getClub(id: number): Promise<Club> {
    try {
      const result = await prisma.club.findUniqueOrThrow({
        select: CLUB_SELECT,
        where: { id }
      });
      const club = asClub(result);
      logger.info(`queried club with id ${id} with result ${stringify(club)}`);
      return club;
    } catch (e) {
      logger.error(e, `failed to query club with id ${id}`);
      throw e;
    }
  }

  async function getClubStatistics(clubId: number): Promise<ClubStatistics> {
    try {
      const memberCount = await prisma.membership.count({
        where: {
          membershipTier: {
            clubId: clubId
          },
          status: "ACTIVE"
        }
      });
      const statistics = {
        memberCount: memberCount
      };
      logger.info(
        `queried club statistics for club with clubId ${clubId} with result ${stringify(statistics)}`
      );
      return statistics;
    } catch (e) {
      logger.error(
        e,
        `failed to query club statistics for club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function createClub(
    input: CreateClubInput,
    userId: number
  ): Promise<MutationResult> {
    return prisma.$transaction(async (tx) => {
      return createClubInTransaction(input, userId, tx);
    });
  }

  async function createClubInTransaction(
    input: CreateClubInput,
    userId: number,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult> {
    try {
      const { id } = await tx.club.create({
        data: {
          ...input,
          // defaults
          tagLine: "",
          description: "",
          websiteUrl: null,
          instagramHandle: null,
          eventCalendarUrl: null,
          applicationQuestions: DEFAULT_APPLICATION_QUESTIONS,
          theme: Prisma.DbNull,
          faqs: { items: [] }
        },
        select: {
          id: true
        }
      });
      logger.info(
        `created club from input ${stringify(input)} with clubId ${id}`
      );

      // create the default free tier on each club
      const { createdEntityId: membershipTierId } =
        await membershipTierService.createDefaultFreeMembershipTier(id, tx);
      await membershipService.createLeadMembership(
        userId,
        idAsNumber(membershipTierId),
        tx
      );

      return { createdEntityId: id };
    } catch (e) {
      logger.error(e, `failed to create club from input ${stringify(input)}`);
      throw e;
    }
  }

  async function updateClub(
    id: number,
    input: UpdateClubInput
  ): Promise<MutationResult> {
    const { ...clubData } = input;

    try {
      await prisma.club.update({
        data: {
          ...clubData,
          theme: clubData.theme ?? Prisma.DbNull,
          // Convert to Date objects to satisfy Prisma DateTime type
          startDate: clubData.startDate ? new Date(clubData.startDate) : null,
          startTime: clubData.startTime
            ? new Date(`1970-01-01T${clubData.startTime}:00Z`)
            : null
        },
        where: {
          id: id
        }
      });
      logger.info(`updated club with id ${id} from input ${stringify(input)}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update club with id ${id} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function updateClubDisplayImageUrls(
    clubId: number,
    input: UpdateClubDisplayImageUrlsInput
  ): Promise<MutationResult> {
    try {
      await prisma.club.update({
        data: { displayImageUrls: input.displayImageUrls },
        where: { id: clubId }
      });
      logger.info(
        `updated club display image urls for club with clubId ${clubId} from input ${stringify(input)}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update club display image urls for club with clubId ${clubId} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  async function hasMoreThanOneActiveMembershipsOrMembershipApplications(
    clubId: number
  ) {
    try {
      const membershipCount = await prisma.membership.count({
        where: {
          membershipTier: {
            clubId: clubId
          },
          status: { in: ["ACTIVE", "PENDING"] }
        }
      });
      logger.info(
        `queried all active or pending membership count for club with clubId ${clubId} with result ${membershipCount}`
      );
      // we allow deletion if lead is the one remaining membership
      return membershipCount > 1;
    } catch (e) {
      logger.error(
        e,
        `failed to query all active or pending membership count for club with clubId ${clubId}`
      );
      throw e;
    }
  }

  async function deleteClub(id: number): Promise<MutationResult> {
    if (await hasMoreThanOneActiveMembershipsOrMembershipApplications(id)) {
      throw new Error(
        "cannot delete club if it has any active memberships or membership applications"
      );
    }

    try {
      // TODO do we want to delete connect account?

      await prisma.club.delete({
        where: { id }
      });
      logger.info(`deleted club with id ${id}`);
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(e, `failed to delete club with id ${id}`);
      throw e;
    }
  }

  async function updateClubApplicationQuestions(
    clubId: number,
    input: UpdateClubApplicationQuestionsInput
  ): Promise<MutationResult> {
    try {
      await prisma.club.update({
        data: input,
        where: {
          id: clubId
        }
      });
      logger.info(
        `updated club application questions for club with clubId ${clubId} from input ${stringify(input)}`
      );
      return NO_ID_MUTATION_RESULT;
    } catch (e) {
      logger.error(
        e,
        `failed to update club application questions for club with clubId ${clubId} from input ${stringify(input)}`
      );
      throw e;
    }
  }

  return {
    getClubByPublicId,
    getClubStatistics,
    getClub,
    createClub,
    updateClub,
    deleteClub,
    updateClubApplicationQuestions,
    updateClubDisplayImageUrls
  };
}
