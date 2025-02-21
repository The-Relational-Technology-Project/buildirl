"use client";

import { Stack, Group, Text, Divider } from "@mantine/core";
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import { useParams, useRouter } from "next/navigation";
import { User } from "~/server/service/types";
import { QueryError } from "~/client/utils/QueryError";
import React from "react";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import UserAvatar from "~/client/components/UserAvatar";

export default function ClubMembers() {
  const params = useParams<{ publicId: string }>();
  const r = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(r) && (
      <WithLocalNavigationHeader>
        <MemberList clubId={r.data!.id} owner={r.data!.owner} />
      </WithLocalNavigationHeader>
    )
  );
}

type MemberListProps = {
  clubId: number;
  owner: User;
};

function MemberList({ clubId, owner }: MemberListProps) {
  const r = api.main.activeMembershipsForClub.useQuery({
    clubId: clubId
  });

  QueryError.check({
    result: r,
    fieldName: "activeMembershipsForClub"
  });

  if (!isLoaded(r)) {
    return null;
  }

  const allMembers = [owner, ...r.data!.map((m) => m.user)];

  return (
    <Stack>
      {allMembers.map((m, i) => (
        <MemberListItem
          key={m.id}
          member={m}
          isLastItem={i < allMembers.length - 1}
        />
      ))}
    </Stack>
  );
}

type MemberListItemProps = {
  member: User;
  isLastItem: boolean;
};

function MemberListItem({ member, isLastItem }: MemberListItemProps) {
  const router = useRouter();
  return (
    <Stack
      onClick={() => router.push(`/user/${member.id}?back=true`)}
      style={{ cursor: "pointer" }}
    >
      <Group>
        <UserAvatar size="md" user={member} />
        <Text>{member.firstName}</Text>
      </Group>
      {isLastItem && <Divider />}
    </Stack>
  );
}
