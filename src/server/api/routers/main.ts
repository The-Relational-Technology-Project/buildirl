import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  securedProcedure,
  securedProcedureWithAbilityFor
} from "~/server/api/trpc";
import {
  CreateClubInputSchema,
  CreateMembershipTierInputSchema,
  CreateUserInputSchema,
  DeactivateMembershipInputSchema,
  SubmitMembershipApplicationInputSchema,
  UpdateClubApplicationQuestionsInputSchema,
  UpdateClubDisplayImageUrlsInputSchema,
  UpdateClubFAQsInputSchema,
  UpdateClubInputSchema,
  UpdateMembershipTierInputSchema,
  UpdateUserInputSchema
} from "~/server/service/types";
import { subject } from "@casl/ability";
import { TRPCError } from "@trpc/server";

export const mainRouter = createTRPCRouter({
  user: securedProcedure.query(({ ctx }) => {
    return ctx.service.main.getUser(ctx.user.userId);
  }),

  isUserAuthenticated: publicProcedure.query(({ ctx }) => {
    return ctx.user != null;
  }),

  userOwnedClubs: securedProcedure.query(({ ctx }) => {
    return ctx.service.main.getUserOwnedClubs(ctx.user.userId);
  }),

  userMemberships: securedProcedure.query(({ ctx }) => {
    return ctx.service.main.getUserMemberships(ctx.user.userId);
  }),

  clubByPublicId: publicProcedure
    .input(z.object({ publicId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.service.main.getClubByPublicId(input.publicId);
    }),

  activeMembershipsForClub: publicProcedure
    .input(
      z.object({
        clubId: z.number()
      })
    )
    .query(({ ctx, input }) => {
      return ctx.service.main.getActiveMembershipsForClub(input.clubId, false);
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
      return ctx.service.main.getActiveMembershipsForClub(input.clubId, true);
    }),

  membershipApplicationsForClub: securedProcedureWithAbilityFor("Club")
    .input(z.object({ clubId: z.number() }))
    .query(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.main.getMembershipApplicationsForClub(input.clubId);
    }),

  clubStatistics: publicProcedure
    .input(z.object({ clubId: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.service.main.getClubStatistics(input.clubId);
    }),

  userById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.service.main.getUser(input.id);
    }),

  club: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.service.main.getClub(input.id);
    }),

  createUser: securedProcedure
    .input(CreateUserInputSchema)
    .mutation(({ ctx, input }) => {
      if (!ctx.user.authEmail) {
        throw new Error("email is required on auth user to create user");
      }
      return ctx.service.main.createUser(
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
      return ctx.service.main.updateUser(input.id, input.input);
    }),

  createClub: securedProcedure
    .input(CreateClubInputSchema)
    .mutation(({ ctx, input }) => {
      return ctx.service.main.createClub(input, ctx.user.userId);
    }),

  updateClub: securedProcedureWithAbilityFor("Club")
    .input(z.object({ id: z.number(), input: UpdateClubInputSchema }))
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.id }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.main.updateClub(input.id, input.input);
    }),

  deleteClub: securedProcedureWithAbilityFor("Club")
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.id }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.main.deleteClub(input.id);
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
      return ctx.service.main.updateClubApplicationQuestions(
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
      return ctx.service.main.updateClubDisplayImageUrls(
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
      return ctx.service.main.createMembershipTier(input.clubId, input.input);
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
      return ctx.service.main.updateMembershipTier(input.id, input.input);
    }),

  deleteMembershipTier: securedProcedureWithAbilityFor("MembershipTier")
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can("manage", subject("MembershipTier", { id: input.id }))
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.main.deleteMembershipTier(input.id);
    }),

  publishMembershipTier: securedProcedureWithAbilityFor("MembershipTier")
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can("manage", subject("MembershipTier", { id: input.id }))
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.main.publishMembershipTier(input.id);
    }),

  unpublishMembershipTier: securedProcedureWithAbilityFor("MembershipTier")
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      if (
        !ctx.ability.can("manage", subject("MembershipTier", { id: input.id }))
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.main.unpublishMembershipTier(input.id);
    }),

  submitMembershipApplication: securedProcedure
    .input(
      z.object({
        membershipTierId: z.number(),
        input: SubmitMembershipApplicationInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.service.main.submitMembershipApplication(
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
      return ctx.service.main.approveMembershipApplication(input.membershipId);
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
      return ctx.service.main.declineMembershipApplication(input.membershipId);
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
      return ctx.service.main.deactivateMembership(
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
      return ctx.service.main.setMembershipAsWelcomed(input.membershipId);
    }),

  updateClubFAQs: securedProcedureWithAbilityFor("Club")
    .input(
      z.object({
        clubId: z.number(),
        input: UpdateClubFAQsInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.ability.can("manage", subject("Club", { id: input.clubId }))) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.service.main.updateClubFAQs(
        input.clubId,
        input.input
      );
    })
});
