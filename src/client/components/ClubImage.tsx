import { Club } from "~/server/service/types";
import {
  ImageProps,
  Image,
  StyleProp,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { storageClient } from "~/client/utils/storageClient";
import React from "react";
import { useMounted } from "@mantine/hooks";

export type ClubImageProps = {
  club: Club;
  size: StyleProp<React.CSSProperties["width"]>;
};

export default function ClubImage({ club, size }: ClubImageProps & ImageProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const mounted = useMounted();

  return (
    mounted && (
      <Image
        src={storageClient.clubProfileImageUrl(club.id)}
        fallbackSrc="/images/club-profile-fallback.png"
        h={size}
        w={size}
        alt={club.name}
        styles={{
          root: {
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            borderTopLeftRadius: "100%",
            borderTopRightRadius: "100%",
            border: `2px solid ${colorScheme === "dark" ? theme.colors.gray[3] : "black"}`
          }
        }}
      />
    )
  );
}
