import React from "react";
import { Group, Stack, Title, GroupProps, Box } from "@mantine/core";
import { useRouter } from "next/navigation";
import { User } from "~/server/service/types";
import UserAvatar from "~/client/components/UserAvatar";

type UserProfileHeaderProps = {
  user: User;
  avatarSize?: "sm" | "md" | "lg" | "xl";
  titleOrder?: 1 | 2 | 3 | 4 | 5 | 6;
  showClickable?: boolean;
  children?: React.ReactNode;
} & GroupProps;

export default function UserProfileHeader({
  user,
  avatarSize = "md",
  titleOrder = 3,
  showClickable = true,
  children,
  ...groupProps
}: UserProfileHeaderProps) {
  const router = useRouter();

  const handleUserClick = () => {
    if (showClickable) {
      router.push(`/user/${user.id}?back=true`);
    }
  };

  const avatarElement = showClickable ? (
    <Box style={{ cursor: "pointer" }} onClick={handleUserClick}>
      <UserAvatar size={avatarSize} user={user} />
    </Box>
  ) : (
    <UserAvatar size={avatarSize} user={user} />
  );

  const titleElement = (
    <Title 
      order={titleOrder} 
      fw={500}
      style={showClickable ? { cursor: "pointer" } : undefined}
      onClick={showClickable ? handleUserClick : undefined}
    >
      {user.firstName} {user.lastName}
    </Title>
  );

  return (
    <Group align="flex-start" gap="lg" {...groupProps}>
      {avatarElement}
      <Stack gap={4}>
        {titleElement}
        {children}
      </Stack>
    </Group>
  );
} 