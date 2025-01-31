"use client";

import {
  Title,
  Text,
  Stack,
  Avatar,
  Center,
  Group,
  Divider
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";
import { storageClient } from "~/client/utils/storageClient";
import { WithLocalNavigationHeader } from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import { JoinedDate } from "~/client/components/JoinedDate";

export default function User() {
  const params = useParams<{ userId: string }>();
  const userId = strictParseInt(params.userId);
  const searchParams = useSearchParams();
  const isLocalNavBarHidden = searchParams.get("back") !== "true";

  const r = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: r,
    fieldName: "userById"
  });

  return (
    isLoaded(r) && (
      <WithLocalNavigationHeader hidden={isLocalNavBarHidden}>
        <Center>
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
        </Center>
      </WithLocalNavigationHeader>
    )
  );
}
