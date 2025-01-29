"use client";

import { Stack, Avatar, Group, Text, UnstyledButton } from "@mantine/core";
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import { useParams } from "next/navigation";
import { storageClient } from "~/client/utils/storageClient";
import { User } from "~/server/service/types";
import { QueryError } from "~/client/utils/QueryError";

export default function ClubMembers() {
  const params = useParams<{ publicId: string }>();
  const r = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  return isLoaded(r) && <MemberList clubId={r.data!.id} owner={r.data!.owner} />;
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

  const allMembers = [owner, ...r.data!.map(m => m.user)];

  return (
      <Stack>
        {allMembers.map((m) => (
          <MemberListItem key={m.id.toString()} member={m} />
        ))}
      </Stack>
    )
}

type MemberListItemProps = {
  member: User;
};

function MemberListItem({ member }: MemberListItemProps) {
  return (
    <Group>
      <Avatar
        size="md"
        radius="xl"
        src={storageClient.userProfileImageUrl(member.id)}
      />
      <Text>{member.firstName}</Text>
    </Group>
  );
}
