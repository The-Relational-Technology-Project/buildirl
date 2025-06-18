"use client";

import { useParams } from "next/navigation";
import { strictParseInt } from "~/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import React from "react";
import { Stack } from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { Membership } from "~/server/membership/types";
import { Maybe } from "~/utils/types";
import MembershipInfoCard from "~/app/(main)/club/[clubId]/member/_components/MembershipInfoCard";
import UserInfoCard from "~/app/(main)/club/[clubId]/member/_components/UserInfoCard";
import ApplicationResponsesCard from "~/client/components/ApplicationResponsesCard";
import ActiveMembershipActionCard from "~/app/(main)/club/[clubId]/member/_components/ActiveMembershipActionCard";
import MembershipApplicationActionCard from "~/app/(main)/club/[clubId]/member/_components/MembershipApplicationActionCard";

function findUserMembership(
  userId: number,
  membershipApplications: Membership[],
  activeMemberships: Membership[]
): Maybe<Membership> {
  return (
    [...membershipApplications, ...activeMemberships].find(
      (mem) => mem.user.id === userId
    ) || null
  );
}

export default function MemberReview() {
  const params = useParams<{ userId: string; clubId: string }>();
  const userId = strictParseInt(params.userId);
  const clubId = strictParseInt(params.clubId);

  const membershipApplications =
    api.main.membershipApplicationsForClub.useQuery({ clubId });
  const activeMemberships = api.main.activeMembershipsForClubWithEmail.useQuery(
    { clubId }
  );
  const userQuery = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: membershipApplications,
    fieldName: "membershipApplicationsForClub"
  });
  QueryError.check({
    result: activeMemberships,
    fieldName: "activeMembershipsForClubWithEmail"
  });
  QueryError.check({
    result: userQuery,
    fieldName: "userById"
  });

  if (!isAllLoaded([membershipApplications, activeMemberships, userQuery])) {
    return null;
  }

  const userMembership = findUserMembership(
    userId,
    membershipApplications.data!,
    activeMemberships.data!
  );

  const pendingMembership = membershipApplications.data!.find(
    (mem) => mem.user.id === userId
  );
  const activeMembership = activeMemberships.data!.find(
    (mem) => mem.user.id === userId
  );

  if (!userMembership) {
    return null;
  }

  return (
    <WithLocalNavigationHeader>
      {/* include this at the top so the reviewer does not miss it */}
      <Stack gap="xl" pb="xl">
        {pendingMembership && (
          <MembershipApplicationActionCard
            clubId={clubId}
            membership={pendingMembership}
          />
        )}

        <UserInfoCard user={userQuery.data!} />

        <MembershipInfoCard membership={userMembership} />

        <ApplicationResponsesCard membership={userMembership} />

        {activeMembership && (
          <ActiveMembershipActionCard
            clubId={clubId}
            membership={activeMembership}
          />
        )}
      </Stack>
    </WithLocalNavigationHeader>
  );
}
