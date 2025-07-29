"use client";

import { useParams } from "next/navigation";
import { Container, Stack, Title, Text } from "@mantine/core";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import EmailTemplatePanel from "../../_components/EmailTemplatePanel";

export default function AutoEmailsPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const clubIdNumber = strictParseInt(clubId);

  return (
    <WithLocalNavigationHeader navigateTo={`/club/${clubId}/manage?tab=email`}>
      <Container size="lg">
        <Stack gap="lg">
          <Stack gap="xs">
            <Title order={2}>Auto Email Templates</Title>
            <Text size="sm" c="dimmed">
              Customize automated email templates for member acceptance, rejection, and departure
            </Text>
          </Stack>

          <EmailTemplatePanel clubId={clubIdNumber} />
        </Stack>
      </Container>
    </WithLocalNavigationHeader>
  );
}