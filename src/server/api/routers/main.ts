import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  securedProcedure,
  securedProcedureWithAbilityFor
} from "~/server/api/trpc";
import { subject } from "@casl/ability";
import { TRPCError } from "@trpc/server";
import {
  CreateUserInputSchema,
  UpdateUserInputSchema
} from "~/server/user/types";
import {
  CreateClubInputSchema,
  UpdateClubApplicationQuestionsInputSchema,
  UpdateClubDisplayImageUrlsInputSchema,
  UpdateClubInputSchema
} from "~/server/club/types";
import {
  CreateMembershipTierInputSchema,
  UpdateMembershipTierInputSchema
} from "~/server/membershipTier/types";
import {
  DeactivateMembershipInputSchema,
  SubmitMembershipApplicationInputSchema
} from "~/server/membership/types";

export const mainRouter = createTRPCRouter({
  user: securedProcedure.query(({ ctx }) => {
    return ctx.service.user.getUser(ctx.user.userId);
  }),

  isUserAuthenticated: publicProcedure.query(({ ctx }) => {
    return ctx.user != null;
  }),

  userMemberships: securedProcedure.query(({ ctx }) => {
    return ctx.service.membership.getUserMemberships(ctx.user.userId);
  }),

  clubByPublicId: publicProcedure
    .input(z.object({ publicId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.service.club.getClubByPublicId(input.publicId);
    }),

  activeMembershipsForClub: publicProcedure
    .input(
      z.object({
        clubId: z.number()
      })
    )
    .query(({ ctx, input }) => {
      return ctx.service.membership.getActiveMembershipsForClub(
        input.clubId,
        false
      );
    }),

  activeMembershipsForClubWithEmail: securedProcedureWithAbilityFor("Club")
    .input(
      z.object({
        clubId: z.number()
      })
    )
    .query(({ ctx, input }) => {
      // only club managers can read emails
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membership.getActiveMembershipsForClub(
        input.clubId,
        true
      );
    }),

  membershipApplicationsForClub: securedProcedureWithAbilityFor("Club")
    .input(z.object({ clubId: z.number() }))
    .query(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membership.getMembershipApplicationsForClub(
        input.clubId
      );
    }),

  clubStatistics: publicProcedure
    .input(z.object({ clubId: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.service.club.getClubStatistics(input.clubId);
    }),

  userById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.service.user.getUser(input.id);
    }),

  club: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.service.club.getClub(input.id);
    }),

  createUser: securedProcedure
    .input(CreateUserInputSchema)
    .mutation(({ ctx, input }) => {
      if (!ctx.user.authEmail) {
        throw new Error("email is required on auth user to create user");
      }
      return ctx.service.user.createUser(
        input,
        ctx.user.authUserId,
        ctx.user.authEmail
      );
    }),

  updateUser: securedProcedureWithAbilityFor("User")
    .input(z.object({ id: z.number(), input: UpdateUserInputSchema }))
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("User", { id: input.id }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.user.updateUser(input.id, input.input);
    }),

  createClub: securedProcedure
    .input(CreateClubInputSchema)
    .mutation(({ ctx, input }) => {
      return ctx.service.club.createClub(input, ctx.user.userId);
    }),

  updateClub: securedProcedureWithAbilityFor("Club")
    .input(z.object({ id: z.number(), input: UpdateClubInputSchema }))
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.id }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.club.updateClub(input.id, input.input);
    }),

  deleteClub: securedProcedureWithAbilityFor("Club")
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.id }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.club.deleteClub(input.id);
    }),

  updateClubApplicationQuestions: securedProcedureWithAbilityFor("Club")
    .input(
      z.object({
        clubId: z.number(),
        input: UpdateClubApplicationQuestionsInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.club.updateClubApplicationQuestions(
        input.clubId,
        input.input
      );
    }),

  updateClubDisplayImageUrls: securedProcedureWithAbilityFor("Club")
    .input(
      z.object({
        clubId: z.number(),
        input: UpdateClubDisplayImageUrlsInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.club.updateClubDisplayImageUrls(
        input.clubId,
        input.input
      );
    }),

  createMembershipTier: securedProcedureWithAbilityFor("Club")
    .input(
      z.object({ clubId: z.number(), input: CreateMembershipTierInputSchema })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membershipTier.createMembershipTier(
        input.clubId,
        input.input
      );
    }),

  updateMembershipTier: securedProcedureWithAbilityFor("MembershipTier")
    .input(
      z.object({
        id: z.number(),
        input: UpdateMembershipTierInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can("manage", subject("MembershipTier", { id: input.id }))
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membershipTier.updateMembershipTier(
        input.id,
        input.input
      );
    }),

  deleteMembershipTier: securedProcedureWithAbilityFor("MembershipTier")
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can("manage", subject("MembershipTier", { id: input.id }))
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membershipTier.deleteMembershipTier(input.id);
    }),

  publishMembershipTier: securedProcedureWithAbilityFor("MembershipTier")
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can("manage", subject("MembershipTier", { id: input.id }))
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membershipTier.publishMembershipTier(input.id);
    }),

  unpublishMembershipTier: securedProcedureWithAbilityFor("MembershipTier")
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can("manage", subject("MembershipTier", { id: input.id }))
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membershipTier.unpublishMembershipTier(input.id);
    }),

  submitMembershipApplication: securedProcedure
    .input(
      z.object({
        membershipTierId: z.number(),
        input: SubmitMembershipApplicationInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.service.membership.submitMembershipApplication(
        input.membershipTierId,
        input.input,
        ctx.user.userId
      );
    }),

  approveMembershipApplication: securedProcedureWithAbilityFor("Membership")
    .input(z.object({ membershipId: z.bigint() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can(
          "manage",
          subject("Membership", { id: input.membershipId })
        )
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membership.approveMembershipApplication(
        input.membershipId
      );
    }),

  declineMembershipApplication: securedProcedureWithAbilityFor("Membership")
    .input(z.object({ membershipId: z.bigint() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can(
          "manage",
          subject("Membership", { id: input.membershipId })
        )
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membership.declineMembershipApplication(
        input.membershipId
      );
    }),

  withdrawMembershipApplication: securedProcedureWithAbilityFor("Membership")
    .input(z.object({ membershipId: z.bigint() }))
    .mutation(async ({ ctx, input }) => {
      if (
        !ctx.ability.can(
          "manage",
          subject("Membership", { id: input.membershipId })
        )
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membership.withdrawMembershipApplication(
        input.membershipId
      );
    }),

  deactivateMembership: securedProcedureWithAbilityFor("Membership")
    .input(
      z.object({
        membershipId: z.bigint(),
        input: DeactivateMembershipInputSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (
        !ctx.ability.can(
          "manage",
          subject("Membership", { id: input.membershipId })
        )
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membership.deactivateMembership(
        input.membershipId,
        input.input
      );
    }),

  setMembershipAsWelcomed: securedProcedureWithAbilityFor("Membership")
    .input(z.object({ membershipId: z.bigint() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can(
          "manage",
          subject("Membership", { id: input.membershipId })
        )
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.membership.setMembershipAsWelcomed(input.membershipId);
    }),

  clubFollowers: securedProcedureWithAbilityFor("Club")
    .input(z.object({ clubId: z.number() }))
    .query(({ ctx, input }) => {
      // only club managers can read emails
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.following.getClubFollowers(input.clubId);
    }),

  userFollowedClubs: securedProcedure.query(({ ctx }) => {
    return ctx.service.following.getUserFollowedClubs(ctx.user.userId);
  }),

  followClub: securedProcedure
    .input(z.object({ clubId: z.number() }))
    .mutation(({ ctx, input }) => {
      return ctx.service.following.followClub(ctx.user.userId, input.clubId);
    }),

  unfollowClub: securedProcedure
    .input(z.object({ clubId: z.number() }))
    .mutation(({ ctx, input }) => {
      return ctx.service.following.unfollowClub(ctx.user.userId, input.clubId);
    }),

  setMembershipAsLead: securedProcedureWithAbilityFor("Membership")
    .input(z.object({ membershipId: z.bigint() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can(
          "admin",
          subject("Membership", { id: input.membershipId })
        )
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.role.setMembershipAsLead(input.membershipId);
    }),

  clearMembershipRole: securedProcedureWithAbilityFor("Membership")
    .input(z.object({ membershipId: z.bigint() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can(
          "admin",
          subject("Membership", { id: input.membershipId })
        )
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.role.clearMembershipRole(input.membershipId);
    })
});
