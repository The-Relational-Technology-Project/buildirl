import { Club } from "~/server/club/types";
import { ImageProps, Image, Box } from "@mantine/core";
import { storageClient } from "~/client/utils/storageClient";
import React from "react";

export type DefaultClubImageProps = {
  size: number;
};

export function DefaultClubImage({ size }: DefaultClubImageProps) {
  return (
    <Box w={size} h={size * 0.75}>
      <Image
        h={"100%"}
        w={"100%"}
        src={"/images/good-club.png"}
        fit={"cover"}
        alt={"club image"}
        style={{
          borderBottomLeftRadius: "10%",
          borderBottomRightRadius: "10%",
          // max radius
          borderTopLeftRadius: 1000,
          borderTopRightRadius: 1000,
          border: "1px solid",
          boxShadow: "6px 6px 0px #000"
        }}
      ></Image>
    </Box>
  );
}

export type ClubImageProps = {
  club: Club;
  size: number;
};

export default function ClubImage({ club, size }: ClubImageProps & ImageProps) {
  return (
    <Box
      h={size * 0.75}
      w={size}
      style={{
        // prevents image from shrinking
        flexShrink: 0
      }}
      mb={8}
    >
      <Image
        src={storageClient.clubProfileImageUrl(club.id)}
        fallbackSrc="/images/good-club.png"
        h={"100%"}
        w={"100%"}
        fit={"cover"}
        alt={club.name}
        styles={{
          root: {
            // defined as percentage so shape is maintained during scaling
            borderBottomLeftRadius: "10%",
            borderBottomRightRadius: "10%",
            // max radius
            borderTopLeftRadius: 1000,
            borderTopRightRadius: 1000,
            border: "1px solid",
            boxShadow: "6px 6px 0px #000"
          }
        }}
      />
    </Box>
  );
}
