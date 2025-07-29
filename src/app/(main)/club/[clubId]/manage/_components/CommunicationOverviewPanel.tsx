"use client";

import { api } from "~/trpc/react";
import {
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Badge,
  Box,
  Flex
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { EmailTemplateType } from "~/server/email/types";
import { isLoaded } from "~/client/utils";

type CommunicationOverviewPanelProps = {
  clubId: number;
};

const EMAIL_TEMPLATE_TYPES: EmailTemplateType[] = ["ACCEPTANCE", "DEPARTURE", "REJECTION"];

const TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  ACCEPTANCE: "Acceptance",
  DEPARTURE: "Departure", 
  REJECTION: "Rejection"
};

function AutoEmailTemplatesSection({ clubId }: { clubId: number }) {
  const router = useRouter();

  const templateQueries = EMAIL_TEMPLATE_TYPES.map(type => 
    api.email.emailTemplate.useQuery({ clubId, type })
  );

  const allLoaded = templateQueries.every(query => isLoaded(query));

  if (!allLoaded) {
    return null;
  }

  const handleEditTemplate = (type: EmailTemplateType) => {
    router.push(`/club/${clubId}/manage/communication/auto-emails/${type.toLowerCase()}`);
  };

  return (
    <Paper withBorder p="lg">
      <Stack gap="md">
        <Box>
          <Title order={3}>Auto Email Templates</Title>
          <Text size="sm" c="dimmed">
            Customize automated emails sent to members
          </Text>
        </Box>

        <Stack gap="xs">
          {EMAIL_TEMPLATE_TYPES.map((type, index) => {
            const query = templateQueries[index];
            const hasCustomTemplate = query?.data !== null;
            
            return (
              <Flex key={type} justify="space-between" align="center">
                <Flex align="center" gap="xs">
                  <Text size="sm">{TEMPLATE_LABELS[type]}</Text>
                  <Badge 
                    color={hasCustomTemplate ? "blue" : "gray"}
                    variant="light"
                    size="xs"
                  >
                    {hasCustomTemplate ? "Custom" : "Default"}
                  </Badge>
                </Flex>
                <Button 
                  size="xs"
                  variant="light"
                  onClick={() => handleEditTemplate(type)}
                >
                  Edit
                </Button>
              </Flex>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}

function EmailBlastsSection({ clubId }: { clubId: number }) {
  const router = useRouter();

  const handleManageEmailBlasts = () => {
    router.push(`/club/${clubId}/manage/communication/email-blasts`);
  };

  return (
    <Paper withBorder p="lg">
      <Stack gap="md" justify="space-between">
        <Box>
          <Title order={3}>Email Blasts</Title>
          <Text size="sm" c="dimmed">
            Send emails to all active members
          </Text>
        </Box>

        <Button 
          variant="outline" 
          onClick={handleManageEmailBlasts}
          fullWidth
        >
          Manage Email Blasts
        </Button>
      </Stack>
    </Paper>
  );
}

export default function CommunicationOverviewPanel({ clubId }: CommunicationOverviewPanelProps) {
  return (
    <Stack gap="lg" py="lg">
      <AutoEmailTemplatesSection clubId={clubId} />
      <EmailBlastsSection clubId={clubId} />
    </Stack>
  );
}