/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack, useMatches, Text } from "@mantine/core";
import { Icon } from "tabler-dynamic-icon";
import { ClubValue } from "~/server/club/types";

export function ClubValueCard({
  value,
  height,
  width
}: {
  value: ClubValue;
  height: number;
  width: number;
}) {
  const titleTextSize = useMatches({ base: "sm", md: "sm" });
  const descriptionTextSize = useMatches({ base: "xs", md: "xs" });

  return (
    <Stack
      w={width}
      h={height}
      style={{
        marginRight: 4,
        position: "relative",
        border: "1px solid black",
        "&:hover": {
          border: "2px solid black"
        },
        paddingTop: "1rem",
        boxShadow: "2px 2px 0px",
        cursor: "pointer",
        backgroundColor: "white"
      }}
    >
      <Stack gap={4} align="center" justify="start">
        <Stack
          flex={1}
          align="center"
          justify="center"
          gap={8}
          style={{
            padding: "14px"
          }}
        >
          {/* Use the 'cls' prop for Icon returned from mantine-icon-picker and as required by tabler-dynamic-icon */}
          <Icon cls={value.icon as any} size={36} color={"#7240d2"} />
          <Text size={titleTextSize} tt="uppercase" fw={600}>
            {value.title}
          </Text>
          <Text size={descriptionTextSize} ta="center">
            {value.description}
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
