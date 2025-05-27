import React from "react";
import { Stack, StackProps } from "@mantine/core";
import { User } from "~/server/service/types";
import UserProfileHeader from "~/client/components/UserProfileHeader";
import UserBio from "~/client/components/UserBio";
import JoinedDate from "~/client/components/JoinedDate";

type BaseUserProfileProps = {
  user: User;
  showJoinedDate?: boolean;
  size?: "sm" | "md" | "lg";
  width?: number | string;
} & StackProps;

export default function BaseUserProfile({
  user,
  showJoinedDate = true,
  size = "md",
  width = 600,
  ...stackProps
}: BaseUserProfileProps) {
  const titleOrder = size === "sm" ? 4 : size === "lg" ? 2 : 3;
  const bioSize = size === "sm" ? "xs" : size === "lg" ? "md" : "sm";

  return (
    <Stack w={width} {...stackProps}>
      {/* Compose UserProfileHeader with optional JoinedDate */}
      <UserProfileHeader 
        user={user} 
        avatarSize={size}
        titleOrder={titleOrder}
        showClickable={true}
      >
        {showJoinedDate && <JoinedDate date={user.createdAt} />}
      </UserProfileHeader>
      
      {/* Compose UserBio for consistent bio display */}
      <UserBio 
        description={user.description}
        showDivider={true}
        showTitle={true}
        textSize={bioSize}
      />
    </Stack>
  );
} 