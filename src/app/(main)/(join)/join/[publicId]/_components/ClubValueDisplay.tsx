import { useMatches, Title, Grid, Stack, Text } from "@mantine/core";
import { Club, ClubValue } from "~/server/club/types";
import { ClubValueCard } from "./ClubValueCard";

interface ClubValueDisplayProps {
  club: Club;
}

export function ClubValueDisplay({ club }: ClubValueDisplayProps) {
  const cardContainerHeight = useMatches({ base: 190, md: 190 });
  const containerWidth = useMatches({ base: "100%", md: "80%" });
  const gridCols = useMatches({ base: 6, md: 4 });
  const clubValues: ClubValue[] = club.values?.items || [];

  return (
    <Stack
      w={"100%"}
      m={16}
      align="center"
      style={{
        border: "1.5px solid #000000",
        borderRadius: 4,
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "16px",
        paddingBottom: "16px",
        alignItems: "center",
        fontFamily: club.themeHeadingFont ?? "inherit"
      }}
    >
      <Title order={2} tt={"uppercase"} style={{ textAlign: "center" }}>
        Our Vibe Check ✨
      </Title>
      <Text>The values that make our community special</Text>
      <Grid px={16} py={8} w={containerWidth} gutter="sm">
        {clubValues.map((value, index) => {
          if (value) {
            return (
              <Grid.Col span={gridCols} key={index + value.title}>
                <ClubValueCard
                  key={index + value.title}
                  value={value}
                  height={cardContainerHeight}
                />
              </Grid.Col>
            );
          }
          return null;
        })}
      </Grid>
    </Stack>
  );
}
