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

  return (
    <Stack
      id="how-campaign-works"
      w="100%"
      gap={20}
      ta="center"
      p={28}
      style={{
        borderRadius: 4,
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
        style={{
          fontFamily: club.themeHeadingFont ?? "inherit"
        }}
      >
        How does this campaign work?
      </Title>
      <Stack gap="sm">
        {STEPS.map((step, index) => (
          <Card
            key={step.title}
            padding="md"
            style={{
              boxShadow: "none",
              border: "1px solid gray"
            }}
          >
            <Group align="center" gap="md">
              <Box
                w={36}
                h={36}
                bdrs={999}
                bg="gray.1"
                c="gray.7"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600
                }}
              >
                {index + 1}
              </Box>
              <Stack gap={4} ta="start" style={{ flex: 1 }}>
                <Text fw={600}>{step.title}</Text>
                <Text size="sm">{step.description}</Text>
              </Stack>
            </Group>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
