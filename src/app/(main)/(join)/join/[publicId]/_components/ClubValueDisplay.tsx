import { useMatches, Title, Box, Grid, Stack } from "@mantine/core";
import { Club, ClubValue } from "~/server/club/types";
import { ClubValueCard } from "./ClubValueCard";

interface ClubValueDisplayProps {
  club: Club;
}

export function ClubValueDisplay({ club }: ClubValueDisplayProps) {
  const containerHeight = useMatches({ base: 200, md: 200 });
  const containerWidth = useMatches({ base: 150, md: 160 });
  const gridCols = useMatches({ base: 6, md: 4 });
  const clubValues: ClubValue[] = club.values?.items || [];

  return (
    <Box w={"100%"} mt={32} mb={64}>
      <Title order={2} pb={16} style={{ textAlign: "center" }}>
        Our Values
      </Title>
      <Grid justify="center" w={"100%"} px={16} py={8}>
        {clubValues.map((value, index) => {
          if (value) {
            return (
              <Grid.Col span={gridCols} key={index + value.title}>
                <ClubValueCard
                  key={index + value.title}
                  value={value}
                  height={containerHeight}
                  width={containerWidth}
                />
              </Grid.Col>
            );
          }
          return null;
        })}
      </Grid>
    </Box>
  );
}
