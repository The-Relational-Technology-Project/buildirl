import { Club } from "~/server/service/types";
import { ImageProps, Image, StyleProp } from "@mantine/core";
import { storageClient } from "~/client/utils/storageClient";
import React from "react";

export type ClubImageProps = {
  club: Club;
  size: StyleProp<React.CSSProperties["width"]>;
};

export default function ClubImage({ club, size }: ClubImageProps & ImageProps) {
  return (
    <Image
      src={storageClient.clubProfileImageUrl(club.id)}
      fallbackSrc="/images/club-profile-fallback.png"
      h={size}
      w={size}
      radius={"md"}
      alt={club.name}
    />
  );
}
