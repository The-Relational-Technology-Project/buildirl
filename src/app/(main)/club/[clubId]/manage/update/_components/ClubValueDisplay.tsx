import {
  Button,
  Center,
  Group,
  ScrollArea,
  Stack,
  Text,
  useMatches
} from "@mantine/core";
import { Club, ClubValue } from "~/server/club/types";
import IconPlus from "@tabler/icons-react/dist/esm/icons/IconPlus";

interface ClubValueDisplayProps {
  club: Club;
}

export function ClubValueDisplay({ club }: ClubValueDisplayProps) {
  const containerHeight = useMatches({ base: 160, md: 250 });
  const containerWidth = useMatches({ base: 120, md: 200 });
  const clubValues: ClubValue[] = club.values?.items || [];

  return (
    <ScrollArea type="never" h={containerHeight + 10}>
      <Group gap={16}>
        {clubValues.map((value, index) => {
          if (value) {
            return (
              <ClubValueCard
                key={index + value.title}
                value={value}
                height={containerHeight}
                width={containerWidth}
              />
            );
          }
          return null;
        })}
        <ClubValueCard
          key={"plus"}
          value={undefined}
          height={containerHeight}
          width={containerWidth}
        />
      </Group>
    </ScrollArea>
  );
}

function ClubValueCard({
  value,
  height,
  width
}: {
  value?: ClubValue;
  height: number;
  width: number;
}) {
  const titleTextSize = useMatches({ base: "sm", md: "lg" });
  const descriptionTextSize = useMatches({ base: "xs", md: "sm" });

  if (!value) {
    return (
      <Center
        w={width}
        h={height}
        style={{
          position: "relative",
          border: "1px dashed grey"
        }}
      >
        <Button component="label" variant="transparent">
          {/* TODO: Add onPress implementation */}
          <IconPlus size={24} />
        </Button>
      </Center>
    );
  }

  return (
    <Stack
      w={width}
      h={height}
      style={{
        position: "relative",
        border: "1px solid black",
        "&:hover": {
          border: "2px solid black"
        },
        paddingTop: "3rem"
      }}
    >
      <Stack gap={4} align="center" justify="start">
        {/* TODO: Add icon from value object */}
        <IconPlus size={24} />
        <Stack
          flex={1}
          align="center"
          justify="center"
          gap={8}
          style={{
            padding: "1rem"
          }}
        >
          <Text size={titleTextSize} tt="uppercase">
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
