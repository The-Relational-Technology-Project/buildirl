import { Text, Title } from "@mantine/core";
import { ReadMoreBox } from "./ReadMoreBox";
import { Club } from "~/server/club/types";

type WhoWeAreProps = {
  club: Club;
};

export function WhoWeAre({ club }: WhoWeAreProps) {
  const description = club.description;
  const borderRadius = 15;

  return (
    description.length > 0 && (
      <ReadMoreBox
        maxLines={3}
        header={
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
        }
        style={{
          width: "100%",
          border: "2px solid #000",
          borderRadius,
          boxShadow: "6px 6px 0px #000"
        }}
      >
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
