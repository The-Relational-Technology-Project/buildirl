import { Avatar, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { storageClient } from "~/client/utils/storageClient";
import { JoinedDate } from "~/client/components/JoinedDate";
import React from "react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";

type UserProfileProps = {
  userId: number;
};

export function UserProfile({ userId }: UserProfileProps) {
  const r = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: r,
    fieldName: "userById"
  });

  return (
    isLoaded(r) && (
      <Stack w={600}>
        <Group align={"flex-start"} gap={"lg"}>
          <Avatar
            size={100}
            radius={90}
            src={storageClient.userProfileImageUrl(r.data!.id)}
          />
          <Stack gap={4}>
            <Title order={3} fw={500} pt={10}>
              {r.data!.firstName} {r.data!.lastName}
            </Title>
            <JoinedDate date={r.data!.createdAt} />
          </Stack>
        </Group>
        {r.data!.description !== "" && (
          <>
            <Divider my={"md"} />
            <Title order={4}>Bio</Title>
            <Text size={"sm"} c={"dimmed"}>
              {r.data!.description}
            </Text>
          </>
        )}
      </Stack>
    )
  );
}
