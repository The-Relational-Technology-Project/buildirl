import { Email, MutationResult } from "~/server/utils/types";
import { User } from "~/server/user/types";
import { Club } from "~/server/club/types";
import { Prisma } from "@prisma/client";

export type FollowingService = FollowingQueries & FollowingMutations;

type FollowingQueries = {
  getUserFollowedClubs(userId: number): Promise<Club[]>;
  getClubFollowers(clubId: number): Promise<ClubFollower[]>;
};

type FollowingMutations = {
  followClub(userId: number, clubId: number): Promise<MutationResult>;
  unfollowClub(userId: number, clubId: number): Promise<MutationResult>;
  // internal
  unfollowClubForMembership(
    membershipId: bigint,
    tx: Prisma.TransactionClient
  ): Promise<MutationResult>;
};

export type ClubFollower = {
  user: User;
  email: Email;
  createdAt: Date;
};
