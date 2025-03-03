import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  securedProcedure
} from "~/server/api/trpc";
import {
  CreateClubInputSchema,
  CreateMembershipTierInputSchema,
  CreateUserInputSchema,
  SubmitMembershipApplicationInputSchema,
  UpdateClubApplicationQuestionsInputSchema,
  UpdateClubDisplayImageUrlsInputSchema,
  UpdateClubInputSchema,
  UpdateMembershipTierInputSchema,
  UpdateUserInputSchema
} from "~/server/service/types";
import { subject } from "@casl/ability";

export const mainRouter = createTRPCRouter({
  user: securedProcedure.query(({ ctx }) => {
    return ctx.service.getUser(ctx.user.userId);
  }),

  isUserAuthenticated: publicProcedure.query(({ ctx }) => {
    return ctx.user != null;
  }),

  userOwnedClubs: securedProcedure.query(({ ctx }) => {
    return ctx.service.getUserOwnedClubs(ctx.user.userId);
  }),

  userMemberships: securedProcedure.query(({ ctx }) => {
    return ctx.service.getUserMemberships(ctx.user.userId);
  }),

  clubByPublicId: publicProcedure
    .input(z.object({ publicId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.service.getClubByPublicId(input.publicId);
    }),

  activeMembershipsForClub: publicProcedure
    .input(
      z.object({
        clubId: z.number()
      })
    )
    .query(({ ctx, input }) => {
      return ctx.service.getActiveMembershipsForClub(input.clubId, false);
    }),

  activeMembershipsForClubWithEmail: securedProcedure
    .input(
      z.object({
        clubId: z.number()
      })
    )
    .query(({ ctx, input }) => {
      // only club managers can read emails
      ctx.ability.can("manage", subject("Club", { id: input.clubId }));
      return ctx.service.getActiveMembershipsForClub(input.clubId, true);
    }),

  membershipApplicationsForClub: securedProcedure
    .input(z.object({ clubId: z.number() }))
    .query(({ ctx, input }) => {
      ctx.ability.can("manage", subject("Club", { id: input.clubId }));
      return ctx.service.getMembershipApplicationsForClub(input.clubId);
    }),

  clubStatistics: publicProcedure
    .input(z.object({ clubId: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.service.getClubStatistics(input.clubId);
    }),

  userById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.service.getUser(input.id);
    }),

  club: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.service.getClub(input.id);
    }),

  createUser: securedProcedure
    .input(CreateUserInputSchema)
    .mutation(({ ctx, input }) => {
      return ctx.service.createUser(
        input,
        ctx.user.authUserId,
        ctx.user.authEmail
      );
    }),

  updateUser: securedProcedure
    .input(z.object({ id: z.number(), input: UpdateUserInputSchema }))
    .mutation(({ ctx, input }) => {
      ctx.ability.can("manage", subject("User", { id: input.id }));
      return ctx.service.updateUser(input.id, input.input);
    }),

  createClub: securedProcedure
    .input(CreateClubInputSchema)
    .mutation(({ ctx, input }) => {
      return ctx.service.createClub(input, ctx.user.userId);
    }),

  updateClub: securedProcedure
    .input(z.object({ id: z.number(), input: UpdateClubInputSchema }))
    .mutation(({ ctx, input }) => {
      ctx.ability.can("manage", subject("Club", { id: input.id }));
      return ctx.service.updateClub(input.id, input.input);
    }),

  deleteClub: securedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      ctx.ability.can("manage", subject("Club", { id: input.id }));
      return ctx.service.deleteClub(input.id);
    }),

  updateClubApplicationQuestions: securedProcedure
    .input(
      z.object({
        clubId: z.number(),
        input: UpdateClubApplicationQuestionsInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      ctx.ability.can("manage", subject("Club", { id: input.clubId }));
      return ctx.service.updateClubApplicationQuestions(
        input.clubId,
        input.input
      );
    }),

  updateClubDisplayImageUrls: securedProcedure
    .input(
      z.object({
        clubId: z.number(),
        input: UpdateClubDisplayImageUrlsInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      ctx.ability.can("manage", subject("Club", { id: input.clubId }));
      return ctx.service.updateClubDisplayImageUrls(input.clubId, input.input);
    }),

  createMembershipTier: securedProcedure
    .input(
      z.object({ clubId: z.number(), input: CreateMembershipTierInputSchema })
    )
    .mutation(({ ctx, input }) => {
      ctx.ability.can("manage", subject("Club", { id: input.clubId }));
      return ctx.service.createMembershipTier(input.clubId, input.input);
    }),

  updateMembershipTier: securedProcedure
    .input(
      z.object({
        id: z.number(),
        input: UpdateMembershipTierInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      ctx.ability.can("manage", subject("MembershipTier", { id: input.id }));
      return ctx.service.updateMembershipTier(input.id, input.input);
    }),

  deleteMembershipTier: securedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      ctx.ability.can("manage", subject("MembershipTier", { id: input.id }));
      return ctx.service.deleteMembershipTier(input.id);
    }),

  publishMembershipTier: securedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      ctx.ability.can("manage", subject("MembershipTier", { id: input.id }));
      return ctx.service.publishMembershipTier(input.id);
    }),

  unpublishMembershipTier: securedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      ctx.ability.can("manage", subject("MembershipTier", { id: input.id }));
      return ctx.service.unpublishMembershipTier(input.id);
    }),

  submitMembershipApplication: securedProcedure
    .input(
      z.object({
        membershipTierId: z.number(),
        input: SubmitMembershipApplicationInputSchema
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.service.submitMembershipApplication(
        input.membershipTierId,
        input.input,
        ctx.user.userId
      );
    }),

  approveMembershipApplication: securedProcedure
    .input(z.object({ membershipId: z.bigint() }))
    .mutation(({ ctx, input }) => {
      ctx.ability.can(
        "manage",
        subject("Membership", { id: input.membershipId })
      );
      return ctx.service.approveMembershipApplication(input.membershipId);
    }),

  declineMembershipApplication: securedProcedure
    .input(z.object({ membershipId: z.bigint() }))
    .mutation(({ ctx, input }) => {
      ctx.ability.can(
        "manage",
        subject("Membership", { id: input.membershipId })
      );
      return ctx.service.declineMembershipApplication(input.membershipId);
    }),

  deactivateMembership: securedProcedure
    .input(z.object({ membershipId: z.bigint() }))
    .mutation(({ ctx, input }) => {
      ctx.ability.can(
        "manage",
        subject("Membership", { id: input.membershipId })
      );
      return ctx.service.deactivateMembership(input.membershipId);
    }),

  setMembershipAsWelcomed: securedProcedure
    .input(z.object({ membershipId: z.bigint() }))
    .mutation(({ ctx, input }) => {
      ctx.ability.can(
        "manage",
        subject("Membership", { id: input.membershipId })
      );
      return ctx.service.setMembershipAsWelcomed(input.membershipId);
    })
});
