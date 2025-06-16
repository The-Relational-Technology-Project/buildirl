import { Paper, Stack, Title, Text } from "@mantine/core";

type EmailBlastPanelProps = {
  clubId: number;
};

export default function EmailBlastPanel({ clubId }: EmailBlastPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // clubId will be used when implementing the actual email blast functionality
  return (
    <Paper withBorder p="xl">
      <Stack align="center" gap="md">
        <Title order={3}>Email Blast</Title>
        <Text size="md" ta="center">
          Send emails to all active members of your club.
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Coming soon for club {clubId}...
        </Text>
      </Stack>
    </Paper>
  );
} 