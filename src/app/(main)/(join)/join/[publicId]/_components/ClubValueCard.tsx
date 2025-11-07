/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Stack,
  useMatches,
  Text,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { Icon } from "tabler-dynamic-icon";
import { ClubValue } from "~/server/club/types";

export function ClubValueCard({
  value,
  height
}: {
  value: ClubValue;
  height: number;
}) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const iconColor = colorScheme === "dark" ? "#d0b6ffff" : "#7240d2";

  const titleTextSize = useMatches({ base: "sm", md: "sm" });
  const descriptionTextSize = useMatches({ base: "xs", md: "xs" });

  return (
    <Stack
      h={height}
      style={{
        position: "relative",
        border: "1px solid black",
        borderRadius: 4,
        "&:hover": {
          border: "2px solid black"
        },
        paddingTop: "0.75rem",
        cursor: "pointer",
        backgroundColor:
          colorScheme === "dark" ? theme.colors.dark![6] : "white"
      }}
    >
      <Stack gap={4} align="center" justify="start">
        <Stack
          flex={1}
          align="center"
          justify="center"
          gap={8}
          style={{
            padding: "12px"
          }}
        >
          {/* Use the 'cls' prop for Icon returned from mantine-icon-picker and as required by tabler-dynamic-icon */}
          <Icon cls={value.icon as any} size={32} color={iconColor} />
          <Text
            size={titleTextSize}
            tt="uppercase"
            fw={600}
            pt={4}
            ff={"work sans"}
            ta={"center"}
          >
            {value.title}
          </Text>
          <Text size={descriptionTextSize} ta="center" ff={"work sans"}>
            {value.description}
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
