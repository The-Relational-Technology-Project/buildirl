"use client";

import { Center, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import UserAvatar from "~/client/components/UserAvatar";
import UserSocialLinks from "~/client/components/UserSocialLinks";

type UserProfileProps = {
  userId: number;
};

function UserProfile({ userId }: UserProfileProps) {
  const user = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: user,
    fieldName: "userById"
  });

  return (
    isLoaded(user) && (
      <Stack w={600}>
        <Group align={"flex-start"} gap={"lg"}>
          <UserAvatar size={"md"} user={user.data!} />
          <Stack gap={4}>
            <Title order={3} fw={500} pt={10}>
              {user.data!.firstName} {user.data!.lastName}
            </Title>
            <UserSocialLinks socials={user.data!.socials} />
          </Stack>
        </Group>
        {user.data!.description !== "" && (
          <>
            <Divider my={"md"} />
            <Title order={4}>Bio</Title>
            <Text size={"sm"}>{user.data!.description}</Text>
          </>
        )}
      </Stack>
    )
  );
}

export default function User() {
  const params = useParams<{ userId: string }>();
  const userId = strictParseInt(params.userId);
  const searchParams = useSearchParams();
  const isLocalNavBarHidden = searchParams.get("back") !== "true";

  return (
    <WithLocalNavigationHeader hidden={isLocalNavBarHidden}>
      <Center>
        <UserProfile userId={userId} />
      </Center>
    </WithLocalNavigationHeader>
  );
}
