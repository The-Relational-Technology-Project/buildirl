import React from "react";
import { Stack, Text, Title, Divider, StackProps, Paper, Group, Box } from "@mantine/core";
import { useRouter } from "next/navigation";
import { User } from "~/server/user/types";
import UserAvatar from "~/client/components/UserAvatar";

type UserProfileProps = {
  user: User;
  size?: "sm" | "md" | "lg";
  width?: number | string;
  variant?: "default" | "member";
  showClickable?: boolean;
  children?: React.ReactNode;
} & StackProps;

export default function UserProfile({
  user,
  size = "md",
  width = 600,
  variant = "default",
  showClickable = true,
  children,
  ...stackProps
}: UserProfileProps) {
  const router = useRouter();

  // Size-based configurations
  const avatarSize = size;
  const titleOrder = size === "sm" ? 4 : size === "lg" ? 2 : 3;
  const bioSize = size === "sm" ? "xs" : size === "lg" ? "md" : "sm";

  // Bio configuration based on variant
  const showBioTitle = variant === "default";
  const showBioDivider = true;

  const handleUserClick = () => {
    if (showClickable) {
      router.push(`/user/${user.id}?back=true`);
    }
  };

  // Avatar element with optional click handler
  const avatarElement = showClickable ? (
    <Box style={{ cursor: "pointer" }} onClick={handleUserClick}>
      <UserAvatar size={avatarSize} user={user} />
    </Box>
  ) : (
    <UserAvatar size={avatarSize} user={user} />
  );

  // Title element with optional click handler
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

  // Profile header content (absorbed from UserProfileHeader)
  const profileHeader = (
    <Group align="flex-start" gap="lg">
      {avatarElement}
      <Stack gap={4}>
        {titleElement}
        {children}
      </Stack>
    </Group>
  );

  // Bio content (absorbed from UserBio)
  const bioContent = user.description && user.description.trim() !== "" && (
    <>
      {showBioDivider && <Divider my="md" />}
      <Stack gap="xs">
        {showBioTitle && <Title order={4}>Bio</Title>}
        <Text size={bioSize} style={{ whiteSpace: "pre-wrap" }}>
          {user.description}
        </Text>
      </Stack>
    </>
  );

  // Content wrapper based on variant
  const content = (
    <Stack 
      w={variant === "default" ? width : undefined} 
      align={variant === "member" ? "center" : undefined}
      {...stackProps}
    >
      {profileHeader}
      {bioContent}
    </Stack>
  );

  // Apply Paper wrapper for member variant
  if (variant === "member") {
    return (
      <Paper p="xl">
        {content}
      </Paper>
    );
  }

  return content;
} 