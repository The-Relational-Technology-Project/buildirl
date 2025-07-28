"use client";

import { useParams } from "next/navigation";
import { Tabs, Container, Stack, Title, Text } from "@mantine/core";
import { IconMail, IconTemplate } from "@tabler/icons-react";
import { strictParseInt } from "~/utils";
import EmailBlastListPanel from "../_components/EmailBlastListPanel";
import EmailTemplatePanel from "../_components/EmailTemplatePanel";

export default function CommunicationPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const clubIdNumber = strictParseInt(clubId);

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={2}>Communication</Title>
          <Text size="sm" c="dimmed">
            Manage email blasts and automated email templates for your club
          </Text>
        </Stack>

        <Tabs defaultValue="email-blasts" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="email-blasts" leftSection={<IconMail size={16} />}>
              Email Blasts
            </Tabs.Tab>
            <Tabs.Tab value="auto-emails" leftSection={<IconTemplate size={16} />}>
              Auto Emails
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="email-blasts" pt="lg">
            <EmailBlastListPanel clubId={clubIdNumber} />
          </Tabs.Panel>

          <Tabs.Panel value="auto-emails" pt="lg">
            <EmailTemplatePanel clubId={clubIdNumber} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}