import {
  Box,
  Card,
  Group,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { Club } from "~/server/club/types";

type HowCampaignWorksProps = {
  club: Club;
};

const STEPS = [
  {
    title: "Keep it alive ⚡",
    description:
      "Your membership contribution keeps the club sustainable month after month."
  },
  {
    title: "Community-powered love ❤️",
    description:
      "If enough members join and contribute, we'll have the fuel to keep going!"
  },
  {
    title: "Flexible ✨",
    description:
      "Change or cancel membership anytime. Only your first contribution is committed in the campaign."
  }
];

export function HowCampaignWorks({ club }: HowCampaignWorksProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const borderRadius = 15;
  const accentColor = "#f7b7b1";
  const cardBackground =
    colorScheme === "dark" ? theme.colors.dark![5] : "#ffffff";

  return (
    <Stack
      id="how-campaign-works"
      w="100%"
      gap="md"
      align="center"
      p="32px 24px"
      style={{
        border: "2px solid #000",
        borderRadius,
        boxShadow: "6px 6px 0px #000",
        backgroundColor:
          colorScheme === "dark"
            ? theme.colors.dark![3]
            : theme.colors.beige![1]
      }}
      mb={20}
    >
      <Title
        order={2}
        tt="uppercase"
        ta="center"
        style={{
          fontFamily: club.themeHeadingFont ?? "inherit"
        }}
      >
        How does this campaign work?
      </Title>
      <Stack gap="sm" w="100%">
        {STEPS.map((step, index) => (
          <Card
            key={step.title}
            p="md"
            style={{
              backgroundColor: cardBackground,
              border: "2px solid #000",
              borderRadius: 12
            }}
          >
            <Group align="center" gap="md" wrap="nowrap">
              <Box
                w={40}
                h={40}
                bdrs={999}
                style={{
                  backgroundColor: accentColor,
                  border: "2px solid #000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700
                }}
              >
                {index + 1}
              </Box>
              <Stack gap={4} ta="start" style={{ flex: 1 }}>
                <Text fw={700}>{step.title}</Text>
                <Text size="sm" style={{ lineHeight: 1.6 }}>
                  {step.description}
                </Text>
              </Stack>
            </Group>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
