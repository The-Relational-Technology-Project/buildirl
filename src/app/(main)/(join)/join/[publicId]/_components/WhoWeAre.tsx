import { Text, Title } from "@mantine/core";
import { ReadMoreBox } from "./ReadMoreBox";
import { Club } from "~/server/club/types";

type WhoWeAreProps = {
  club: Club;
};

export function WhoWeAre({ club }: WhoWeAreProps) {
  const description = club.description;
  const borderRadius = "0px 8px 0px 8px";

  return (
    description.length > 0 && (
      <ReadMoreBox
        style={{
          width: "100%",
          border: "2px solid #000",
          borderRadius,
          boxShadow: "6px 6px 0px #000"
        }}
      >
        <Title
          order={2}
          mb={"xs"}
          tt="uppercase"
          ta="center"
          style={{
            fontFamily: club.themeHeadingFont ?? "inherit"
          }}
        >
          Who We Are
        </Title>
        <Text
          size={"sm"}
          mb={{ base: "sm", md: "lg" }}
          style={{ whiteSpace: "pre-line" }}
          ta="center"
          fs="italic"
        >
          ✨ Our people, our vibes, our world ✨
        </Text>
        <Text
          size={"md"}
          mb={{ base: "sm", md: "lg" }}
          style={{ whiteSpace: "pre-line", letterSpacing: "-0.15px" }}
        >
          {description}
        </Text>
      </ReadMoreBox>
    )
  );
}
