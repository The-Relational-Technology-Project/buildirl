import { Box, Image } from "@mantine/core";
import React from "react";
import { DefaultClubImageProps } from "~/client/components/ClubImage";

type ImageProps = {
  size: number;
};

export function FitCheckImage({ size }: ImageProps) {
  return (
    <Box w={size} h={size}>
      <Image
        h={"100%"}
        w={"100%"}
        src={"/images/let-see-if-we-are-fit-image.svg"}
        fit={"contain"}
        alt={"let's see if we're a fit image"}
      />
    </Box>
  );
}

export function WelcomeImage({ size }: DefaultClubImageProps) {
  return (
    <Box w={size} h={size}>
      <Image
        h={"100%"}
        w={"100%"}
        src={"/images/welcome-hi.svg"}
        fit={"contain"}
        alt={"welcome image"}
        style={{
          borderRadius: 10
        }}
      ></Image>
    </Box>
  );
}
