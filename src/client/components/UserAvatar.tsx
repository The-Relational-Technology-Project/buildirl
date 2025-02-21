import {
  Avatar,
  AvatarProps,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { storageClient } from "~/client/utils/storageClient";
import React from "react";
import { User } from "~/server/service/types";
import { useMounted } from "@mantine/hooks";

type UserAvatarProps = {
  user: User;
};

export default function UserAvatar({
  user,
  size,
  ...props
}: UserAvatarProps & AvatarProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const mounted = useMounted();

  return (
    mounted && (
      <Avatar
        size={size}
        style={{
          border: `2px solid ${colorScheme === "dark" ? theme.colors.gray[3] : "black"}`
        }}
        variant={"filled"}
        src={storageClient.userProfileImageUrl(user.id)}
        alt={`${user.firstName} ${user.lastName}`}
        {...props}
      />
    )
  );
}
