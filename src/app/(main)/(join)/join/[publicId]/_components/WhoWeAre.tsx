import {
  Text,
  Title,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { ReadMoreBox } from "./ReadMoreBox";
import { Club } from "~/server/club/types";

type WhoWeAreProps = {
  club: Club;
};

export function WhoWeAre({ club }: WhoWeAreProps) {
  const description = club.description;
  const borderRadius = 15;
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const sectionTextColor = isDark ? theme.other.dark.text : theme.other.dark.ink;
  const sectionDescriptionColor = isDark
    ? theme.other.dark.textMuted
    : theme.other.dark.ink;
  const sectionBorder = isDark
    ? `1px solid ${theme.other.dark.borderStrong}`
    : "2px solid #000";
  const sectionShadow = isDark
    ? `6px 6px 0px ${theme.other.dark.shadow}`
    : "6px 6px 0px #000";

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
            c={sectionTextColor}
            style={{
              fontFamily: club.themeHeadingFont ?? "inherit"
            }}
          >
            Who We Are
          </Title>
        }
        style={{
          width: "100%",
          border: sectionBorder,
          borderRadius,
          boxShadow: sectionShadow
        }}
      >
        <Text
          size={"md"}
          c={sectionDescriptionColor}
          mb={{ base: "sm", md: "lg" }}
          style={{ whiteSpace: "pre-line", letterSpacing: "-0.15px" }}
        >
          {description}
        </Text>
      </ReadMoreBox>
    )
  );
}
