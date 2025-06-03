import React from "react";
import { Stack, Text, Title, Paper, Flex } from "@mantine/core";
import { User } from "~/server/user/types";
import UserAvatar from "~/client/components/UserAvatar";
import { useRouter } from "next/navigation";

type UserInfoCardProps = {
  user: User;
};

export default function UserInfoCard({ user }: UserInfoCardProps) {
  const router = useRouter();
  return (
    <Paper p="xl">
      <Stack align={"center"}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "center", md: "flex-start" }}
          gap="lg"
          onClick={() => router.push(`/user/${user.id}?back=true`)}
          style={{ cursor: "pointer" }}
        >
          <UserAvatar size={"md"} user={user} />
          <Title order={3} fw={500}>
            {user.firstName} {user.lastName}
          </Title>
        </Flex>
        <Text size={"sm"}>{user.description}</Text>
      </Stack>
    </Paper>
  );
}
