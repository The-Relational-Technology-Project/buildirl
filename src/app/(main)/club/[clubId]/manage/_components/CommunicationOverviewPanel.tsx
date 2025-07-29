"use client";

import { api } from "~/trpc/react";
import {
  SimpleGrid,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Badge,
  Table,
  Group,
  Box,
  Flex
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { EmailTemplateType } from "~/server/email/types";
import { isLoaded, toDisplayDate } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";

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
    return <Text>Loading...</Text>;
  }

  const handleEditTemplate = (type: EmailTemplateType) => {
    router.push(`/club/${clubId}/manage/communication/auto-emails/${type}`);
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

  const emailBlasts = api.email.emailBlasts.useQuery({ clubId });

  QueryError.checkNullable({
    result: emailBlasts,
    fieldName: "emailBlasts"
  });

  const handleCreateNew = () => {
    router.push(`/club/${clubId}/manage/communication/email-blasts/new`);
  };

  const handleViewAll = () => {
    router.push(`/club/${clubId}/manage/communication`);
  };

  if (!isLoaded(emailBlasts)) {
    return <Text>Loading...</Text>;
  }

  const recentBlasts = emailBlasts.data?.slice(0, 3) || [];

  return (
    <Paper withBorder p="lg">
      <Stack gap="md">
        <Box>
          <Title order={3}>Email Blasts</Title>
          <Text size="sm" c="dimmed">
            Send emails to all active members
          </Text>
        </Box>

        {recentBlasts.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Subject</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recentBlasts.map((blast) => (
                <Table.Tr key={blast.id.toString()}>
                  <Table.Td>
                    <Text size="sm" truncate>
                      {blast.subject || <i>Untitled</i>}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={blast.status === "SENT" ? "green" : "gray"}
                      variant="light"
                      size="xs"
                    >
                      {blast.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {toDisplayDate(new Date(blast.updatedAt))}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text size="sm" c="dimmed" ta="center">
            No email blasts yet
          </Text>
        )}

        <Group grow>
          <Button onClick={handleCreateNew}>
            Create New Blast
          </Button>
          <Button variant="outline" onClick={handleViewAll}>
            View All Blasts
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

export default function CommunicationOverviewPanel({ clubId }: CommunicationOverviewPanelProps) {
  return (
    <Stack gap="lg" py="lg">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <AutoEmailTemplatesSection clubId={clubId} />
        <EmailBlastsSection clubId={clubId} />
      </SimpleGrid>
    </Stack>
  );
}