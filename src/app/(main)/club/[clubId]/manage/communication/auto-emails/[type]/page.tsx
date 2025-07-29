"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Container, Stack, Title, Text, Paper, Flex, ActionIcon, Badge, Box, Button } from "@mantine/core";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import { EmailTemplateType } from "~/server/email/types";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";
import EmailEditor from "~/client/components/EmailEditor";
import { IconTrash } from "@tabler/icons-react";

const VALID_TEMPLATE_TYPES: EmailTemplateType[] = ["ACCEPTANCE", "DEPARTURE", "REJECTION"];

const TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  ACCEPTANCE: "Acceptance",
  DEPARTURE: "Departure", 
  REJECTION: "Rejection"
};

const TEMPLATE_DESCRIPTIONS: Record<EmailTemplateType, string> = {
  ACCEPTANCE: "This email is sent automatically to new members after you have approved them",
  DEPARTURE: "This email is sent automatically to members after they leave the club",
  REJECTION: "This email is sent automatically to people whose application you have declined"
};

type DraftState = "NO_DRAFT" | "DRAFT" | "DRAFT_FINISHED";

function DraftBadge({ state }: { state: DraftState }) {
  if (state === "DRAFT") {
    return <Badge color="gray">Draft</Badge>;
  }
  return <Box />;
}

function validateTemplateType(type: string): EmailTemplateType {
  const uppercaseType = type.toUpperCase();
  if (VALID_TEMPLATE_TYPES.includes(uppercaseType as EmailTemplateType)) {
    return uppercaseType as EmailTemplateType;
  }
  throw new Error(`Invalid template type: ${type}`);
}

function EmailTemplateEditorContent() {
  const params = useParams<{ clubId: string; type: string }>();
  const clubId = strictParseInt(params.clubId);
  
  // Validate template type following codebase patterns
  const templateType = validateTemplateType(params.type);
  
  const [draftState, setDraftState] = useState<DraftState>("NO_DRAFT");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");

  const emailTemplate = api.email.emailTemplate.useQuery({
    clubId,
    type: templateType
  });

  QueryError.checkNullable({
    result: emailTemplate,
    fieldName: "emailTemplate"
  });

  const utils = api.useUtils();
  const setEmailTemplate = api.email.setEmailTemplate.useMutation({
    onSuccess: () => {
      utils.email.emailTemplate.invalidate({ clubId, type: templateType });
      notifySuccess("Success", "Email template has been updated");
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  const deleteEmailTemplate = api.email.deleteEmailTemplate.useMutation({
    onSuccess: () => {
      utils.email.emailTemplate.invalidate({ clubId, type: templateType });
      notifySuccess("Success", "Email template has been deleted");
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  useEffect(() => {
    if (!emailTemplate.data) return;
    setSubject(emailTemplate.data.subject);
    setHtmlContent(emailTemplate.data.htmlContent);
    setTextContent(emailTemplate.data.textContent);
  }, [emailTemplate.data]);

  const handleContentChange = (
    newSubject: string,
    newHtmlContent: string,
    newTextContent: string
  ) => {
    setSubject(newSubject);
    setHtmlContent(newHtmlContent);
    setTextContent(newTextContent);
  };

  const handleSave = async () => {
    if (draftState === "DRAFT") {
      const confirmed = window.confirm(
        `The email template will become live immediately after save. Confirm save?`
      );
      if (confirmed) {
        setDraftState("DRAFT_FINISHED");
        await setEmailTemplate.mutateAsync({
          id: { clubId, type: templateType },
          input: {
            subject,
            htmlContent,
            textContent
          }
        });
      }
      return;
    }

    await setEmailTemplate.mutateAsync({
      id: { clubId, type: templateType },
      input: {
        subject,
        htmlContent,
        textContent
      }
    });
  };

  const clearContent = () => {
    setSubject("");
    setHtmlContent("");
    setTextContent("");
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this custom ${TEMPLATE_LABELS[templateType]} template? This action cannot be undone.`
    );
    if (confirmed) {
      if (draftState === "DRAFT") {
        setDraftState("NO_DRAFT");
      } else {
        setDraftState("NO_DRAFT");
        await deleteEmailTemplate.mutateAsync({ clubId, type: templateType });
      }
      clearContent();
    }
  };

  const handleCancel = () => {
    if (draftState === "DRAFT") {
      setDraftState("NO_DRAFT");
      clearContent();
    }
  };

  if (!isLoaded(emailTemplate)) {
    return <Text>Loading...</Text>;
  }

  const hasTemplate = emailTemplate.data !== null || draftState !== "NO_DRAFT";

  if (!hasTemplate) {
    return (
      <Container size="lg">
        <Stack gap="lg">
          <Stack gap="xs">
            <Title order={2}>{TEMPLATE_LABELS[templateType]} Email Template</Title>
            <Text size="sm" c="dimmed">
              {TEMPLATE_DESCRIPTIONS[templateType]}
            </Text>
          </Stack>

          <Paper withBorder p="xl">
            <Stack align="center" gap="md">
              <Title order={5} style={{ textAlign: "center" }}>
                Using default {TEMPLATE_LABELS[templateType].toLowerCase()} email
              </Title>
              <Text size="md" style={{ textAlign: "center" }}>
                You can define a custom email to be sent instead.
              </Text>
              <Button onClick={() => setDraftState("DRAFT")}>
                Edit Custom Email
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={2}>{TEMPLATE_LABELS[templateType]} Email Template</Title>
          <Text size="sm" c="dimmed">
            {TEMPLATE_DESCRIPTIONS[templateType]}
          </Text>
        </Stack>

        <Paper withBorder p="xl">
          <Stack gap={0}>
            <Flex
              direction="row"
              justify="space-between"
              align="center"
              w="100%"
              mb="sm"
            >
              <DraftBadge state={draftState} />
              
              <ActionIcon
                c="red"
                onClick={handleDelete}
                loading={deleteEmailTemplate.isPending}
              >
                <IconTrash size={20} />
              </ActionIcon>
            </Flex>
            
            <EmailEditor
              subject={subject}
              htmlContent={htmlContent}
              onContentChange={handleContentChange}
              onSave={handleSave}
              onCancel={handleCancel}
              saveButtonText="Save Template"
              saveButtonLoading={setEmailTemplate.isPending}
              minHeight={240}
            />
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

export default function EmailTemplateEditorPage() {
  const { clubId } = useParams<{ clubId: string }>();

  return (
    <WithLocalNavigationHeader navigateTo={`/club/${clubId}/manage?tab=email`}>
      <EmailTemplateEditorContent />
    </WithLocalNavigationHeader>
  );
}