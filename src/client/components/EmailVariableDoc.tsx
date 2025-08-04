import { Stack, Text, Paper, Code, Collapse, Button, Group } from "@mantine/core";
import { IconInfoCircle, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { useState } from "react";

export type EmailVariable = {
  name: string;
  description: string;
  required?: boolean;
};

export type EmailVariableDocProps = {
  variables: EmailVariable[];
  title?: string;
  subtitle?: string;
  defaultExpanded?: boolean;
};

export default function EmailVariableDoc({
  variables,
  title = "Available Variables",
  subtitle = "You can use these variables in your email subject and content. They will be automatically replaced with actual values when the email is sent.",
  defaultExpanded = false
}: EmailVariableDocProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Paper withBorder p="md" bg="gray.0">
      <Stack gap="sm">
        <Group gap="xs">
          <IconInfoCircle size={16} color="var(--mantine-color-dark-4)" />
          <Button
            variant="transparent"
            size="compact-sm"
            p={0}
            c="dark"
            onClick={() => setExpanded(!expanded)}
            rightSection={
              expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
            }
          >
            <Text fw={600} size="md">
              {title}
            </Text>
          </Button>
        </Group>

        <Collapse in={expanded}>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {subtitle}
            </Text>

            <Stack gap="xs">
              {variables.map((variable) => (
                <Group key={variable.name} gap="sm" align="flex-start">
                  <Code>
                    {`{{${variable.name}}}`}
                  </Code>
                  <Text size="sm" flex={1}>
                    {variable.description}
                    {variable.required === false && (
                      <Text component="span" size="xs" c="dimmed" ml="xs">
                        (optional)
                      </Text>
                    )}
                  </Text>
                </Group>
              ))}
            </Stack>

            <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
              {`Example: "Welcome to {{clubName}}, {{memberFirstName}}!" becomes "Welcome to Tech Book Club, John!"`}
            </Text>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}