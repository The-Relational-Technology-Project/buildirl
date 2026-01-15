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

interface ClubValueDisplayProps {
  club: Club;
}

export function ClubValueDisplay({ club }: ClubValueDisplayProps) {
  const clubValues: ClubValue[] = club.values?.items || [];
  const displayValues = clubValues.slice(0, 6);
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

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
          bg={
            colorScheme === "dark"
              ? theme.colors.dark![3]
              : theme.colors.beige![1]
          }
          style={{
            border: "2px solid #000",
            borderRadius: 18,
            boxShadow: "6px 6px 0px #000"
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
                span={{ base: 4, sm: 4 }}
                key={`${value.title}-${index}`}
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Stack align="center" gap={6} maw={200}>
                  <Icon cls={value.icon as IconsCls} size={28} color="#000" />
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
