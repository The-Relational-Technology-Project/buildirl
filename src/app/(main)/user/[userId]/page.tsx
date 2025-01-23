"use client";

import {
  Title,
  Text,
  Stack,
  Avatar,
  Center,
  Group,
  Divider,
  ThemeIcon
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded, toDisplayMonth } from "~/client/utils";
import { useParams } from "next/navigation";
import React from "react";
import { IconCalendarWeek } from "@tabler/icons-react";
import createStorageClient, {
  storageClient
} from "~/client/utils/storageClient";

export default function User() {
  const params = useParams<{ userId: string }>();
  const userId = parseInt(params.userId);

  const r = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: r,
    fieldName: "userById"
  });

  return (
    isLoaded(r) && (
      <Center pt={40}>
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
              <Group gap={6}>
                <ThemeIcon
                  size={"xs"}
                  variant={"white"}
                  c={"dimmed"}
                  style={{
                    backgroundColor: "transparent"
                  }}
                >
                  <IconCalendarWeek />
                </ThemeIcon>
                <Text c={"dimmed"} size={"sm"}>
                  Joined {toDisplayMonth(r.data!.createdAt)}
                </Text>
              </Group>
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
      </Center>
    )
  );
}
