"use client";

import {
  Stack,
  Group,
  Text,
  Divider,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import { useParams, useRouter } from "next/navigation";
import { User } from "~/server/user/types";
import { QueryError } from "~/client/utils/QueryError";
import React from "react";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import UserAvatar from "~/client/components/UserAvatar";

export default function ClubMembers() {
  const params = useParams<{ publicId: string }>();
  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(club) && (
      <WithLocalNavigationHeader>
        <MemberList clubId={club.data!.id} />
      </WithLocalNavigationHeader>
    )
  );
}

type MemberListProps = {
  clubId: number;
};

function MemberList({ clubId }: MemberListProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const activeMembershipsForClub = api.main.activeMembershipsForClub.useQuery({
    clubId: clubId
  });

  QueryError.check({
    result: activeMembershipsForClub,
    fieldName: "activeMembershipsForClub"
  });

  if (!isLoaded(activeMembershipsForClub)) {
    return null;
  }

  const allMembers = activeMembershipsForClub.data!.map((r) => r.user);

  return (
    <Stack
      px={{ base: 0, md: "xl" }}
      bg={{
        backgroundColor:
          colorScheme === "dark" ? theme.colors.dark![3] : "white"
      }}
      bdrs={4}
      p={28}
    >
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
        <UserAvatar size={"sm"} user={member} />
        <Text>{member.firstName}</Text>
      </Group>
      {isLastItem && <Divider />}
    </Stack>
  );
}
