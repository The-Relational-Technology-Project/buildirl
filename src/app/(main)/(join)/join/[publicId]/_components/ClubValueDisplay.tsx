import {
  Title,
  Grid,
  Stack,
  Box,
  Text,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { Club, ClubValue } from "~/server/club/types";
import { Icon, type IconsCls } from "tabler-dynamic-icon";
import { resolveAccentColor } from "~/client/utils/color";

interface ClubValueDisplayProps {
  club: Club;
}

export function ClubValueDisplay({ club }: ClubValueDisplayProps) {
  const clubValues: ClubValue[] = club.values?.items || [];
  const displayValues = clubValues.slice(0, 6);
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const sectionTextColor = theme.other.dark.text;
  const accentColor = resolveAccentColor(club.accentColor);
  const sectionBorder = isDark
    ? `1px solid ${theme.other.dark.borderStrong}`
    : "2px solid #000";
  const sectionShadow = isDark
    ? `6px 6px 0px ${theme.other.dark.shadow}`
    : "6px 6px 0px #000";

  return (
    clubValues.length > 0 && (
      <Box w="100%" my={24}>
        <Stack
          w="100%"
          px={{ base: 20, sm: 28 }}
          py={{ base: 24, sm: 36 }}
          align="center"
          ta="center"
          gap={36}
          bg={isDark ? theme.other.dark.surface : theme.colors.beige![1]}
          style={{
            border: sectionBorder,
            borderRadius: 18,
            boxShadow: sectionShadow,
            color: isDark ? sectionTextColor : undefined
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
          <Grid
            w="100%"
            gutter={{ base: 24, sm: 32 }}
            justify="center"
            px={16}
            py={8}
          >
            {displayValues.map((value, index) => (
              <Grid.Col
                span={{ base: 6, sm: 4 }}
                key={`${value.title}-${index}`}
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Stack align="center" gap={6} maw={200}>
                  <Box
                    w={44}
                    h={44}
                    style={{
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 999,
                      border: "2px dashed",
                      borderColor: accentColor
                    }}
                  >
                    <Icon
                      cls={value.icon as IconsCls}
                      size={28}
                      color="currentColor"
                    />
                  </Box>
                  <Text size="sm" tt="uppercase" fw={600} ta="center">
                    {value.title}
                  </Text>
                  <Text size="xs" ta="center">
                    {value.description}
                  </Text>
                </Stack>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      </Box>
    )
  );
}
