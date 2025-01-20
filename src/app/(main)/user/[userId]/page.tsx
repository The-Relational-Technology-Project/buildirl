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
import { useParams } from "next/navigation";
import React from "react";

export default function User() {
  const params = useParams<{ userId: string }>();
  const userId = parseInt(params.userId);

  const r = api.main.userById.useQuery({ userId: userId });

  QueryError.check({
    result: r,
    fieldName: "user"
  });

  return (
    isLoaded(r) && (
      <Center pt={40}>
        <Stack w={600}>
          <Group align={"flex-start"} gap={"lg"}>
            <Avatar size={100} radius={90} />
            <Title order={3} fw={500} c={"gray.8"} pt={10}>
              {r.data!.firstName} {r.data!.lastName}
            </Title>
          </Group>
          {r.data!.description !== "" && (
            <>
              <Divider my={"md"} color={"gray.5"} />
              <Title order={4} c={"gray.8"}>
                Bio
              </Title>
              <Text c={"gray.8"} size={"sm"}>
                {r.data!.description}
              </Text>
            </>
          )}
        </Stack>
      </Center>
    )
  );
}
