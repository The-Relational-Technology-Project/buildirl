"use client";

import {
  Stack,
  Avatar,
  Group,
  Text,
  Title,
  Divider,
  ActionIcon
} from "@mantine/core";
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import { useParams, useRouter } from "next/navigation";
import { storageClient } from "~/client/utils/storageClient";
import { User } from "~/server/service/types";
import { QueryError } from "~/client/utils/QueryError";
import React from "react";
import { WithLocalNavigationHeader } from "~/client/components/WithLocalNavigationHeader";

export default function ClubMembers() {
  const params = useParams<{ publicId: string }>();
  const r = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });
  const router = useRouter();

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(r) && (
      <WithLocalNavigationHeader title={"Member"}>
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
  return (
    <Stack>
      <Group>
        <Avatar
          size="md"
          radius="xl"
          src={storageClient.userProfileImageUrl(member.id)}
        />
        <Text>{member.firstName}</Text>
      </Group>
      {isLastItem && <Divider />}
    </Stack>
  );
}
