import { useMatches, Title, Grid, Stack, Text, Box } from "@mantine/core";
import { Club, ClubValue } from "~/server/club/types";
import { ClubValueCard } from "./ClubValueCard";

interface ClubValueDisplayProps {
  club: Club;
}

export function ClubValueDisplay({ club }: ClubValueDisplayProps) {
  const cardContainerHeight = useMatches({ base: 190, md: 190 });
  const containerWidth = useMatches({ base: "100%", md: "90%" });
  const clubValues: ClubValue[] = club.values?.items || [];
  const rotations = [0.5, -2.1, -2.4, 3.8, -3.2, 3.8];
  const spacingOffsets = [-4, 12, 0, 8, -2, 10];
  const baseCardSpacing = 0;
  const spacingOffsetScale = useMatches({ base: 0.6, md: 0.8 });
  const columnMarginTop = useMatches({ base: "lg", md: "sm" });
  const extraColumnPadding = useMatches({ base: 0, md: 18 });
  const columnHorizontalPadding = `calc(var(--grid-col-padding) + ${
    extraColumnPadding ?? 0
  }px)`;
  const hasOddCount = clubValues.length % 2 === 1;

  return (
    clubValues.length > 0 && (
      <Stack
        w={"100%"}
        my={16}
        px={16}
        py={28}
        align="center"
        ta={"center"}
        gap={4}
      >
        <Box
          style={{
            border: "2px solid #000",
            borderRadius: 15,
            boxShadow: "6px 6px 0px #000",
            backgroundColor: "#fff",
            padding: "10px 20px"
          }}
        >
          <Title
            order={2}
            tt="uppercase"
            ta="center"
            style={{
              fontFamily: club.themeHeadingFont ?? "inherit"
            }}
          >
            Our Values
          </Title>
        </Box>
        <Grid
          px={16}
          py={8}
          w={containerWidth}
          gutter={{ base: 48, md: 32 }}
          justify="center"
          mt={"lg"}
        >
          {clubValues.map((value, index) => {
            if (value) {
              const isSingleCardRow =
                hasOddCount && index === clubValues.length - 1;
              const spacingOffset =
                spacingOffsets[index % spacingOffsets.length] ?? 0;
              const columnStyle = {
                marginTop: baseCardSpacing + spacingOffset * spacingOffsetScale,
                paddingLeft: columnHorizontalPadding,
                paddingRight: columnHorizontalPadding,
                ...(isSingleCardRow
                  ? { marginLeft: "auto", marginRight: "auto" }
                  : {})
              };
              return (
                <Grid.Col
                  span={{ base: 12, md: 6 }}
                  key={index + value.title}
                  style={columnStyle}
                  mt={columnMarginTop}
                >
                  <ClubValueCard
                    key={index + value.title}
                    value={value}
                    height={cardContainerHeight}
                    rotation={rotations[index % rotations.length]}
                  />
                </Grid.Col>
              );
            }
            return null;
          })}
        </Grid>
      </Stack>
    )
  );
}
