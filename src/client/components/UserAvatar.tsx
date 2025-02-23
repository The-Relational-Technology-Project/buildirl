import {
  Image,
  Box,
  useMantineColorScheme,
  BoxProps,
  MantineRadius
} from "@mantine/core";
import { storageClient } from "~/client/utils/storageClient";
import React from "react";
import { User } from "~/server/service/types";

export type UserImageProps = {
  user: User;
  radius?: MantineRadius;
};

export function UserImage({
  user,
  radius,
  ...props
}: UserImageProps & BoxProps) {
  return (
    <Box {...props}>
      <Image
        src={storageClient.userProfileImageUrl(user.id)}
        fallbackSrc={"/images/smile.jpg"}
        h={"100%"}
        w={"100%"}
        fit={"cover"}
        radius={radius ?? 0}
        alt={`${user.firstName} ${user.lastName}`}
      />
    </Box>
  );
}

type UserAvatarProps = {
  user: User;
  size: "sm" | "md" | "lg";
};

function getSizeNumber(size: "sm" | "md" | "lg") {
  if (size === "sm") return 36;
  if (size === "md") return 100;
  if (size === "lg") return 120;
  throw new Error(`Invalid size: ${size}`);
}

export default function UserAvatar({
  user,
  size,
  ...props
}: UserAvatarProps & BoxProps) {
  const { colorScheme } = useMantineColorScheme();
  const sizeNumber = getSizeNumber(size);

  return (
    <Box h={sizeNumber} w={sizeNumber} {...props}>
      <Image
        src={storageClient.userProfileImageUrl(user.id)}
        fallbackSrc={"/images/smile.jpg"}
        h={"100%"}
        w={"100%"}
        radius={"100%"}
        fit={"cover"}
        alt={`${user.firstName} ${user.lastName}`}
        style={{
          border: `${size === "sm" ? 1 : 2}px solid`
        }}
      />
    </Box>
  );
}
