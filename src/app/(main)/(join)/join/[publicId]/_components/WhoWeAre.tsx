import { Text, Title } from "@mantine/core";
import { ReadMoreBox } from "./ReadMoreBox";

type WhoWeAreProps = {
  description: string;
};

export function WhoWeAre({ description }: WhoWeAreProps) {
  return (
    description.length > 0 && (
      <ReadMoreBox maxLines={10} style={{ width: "100%" }}>
        <Title
          order={2}
          mb={{ base: "xs", md: "sm" }}
          tt="uppercase"
          ta="center"
          style={{
            fontFamily: "'Unbounded', sans-serif",
            letterSpacing: "0.5px"
          }}
        >
          Who We Are
        </Title>
        <Text
          size={"sm"}
          mb={{ base: "sm", md: "lg" }}
          style={{ whiteSpace: "pre-line" }}
          ta="center"
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
