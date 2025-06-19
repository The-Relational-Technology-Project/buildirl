import { api } from "~/trpc/react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Flex,
  Paper,
  Stack,
  Tabs,
  Text,
  Title
} from "@mantine/core";
import React, { useState } from "react";
import { EmailTemplateType } from "~/server/email/types";
import EmailBlastListPanel from "./EmailBlastListPanel";
import {
  handleDefaultMutationError,
  notifySuccess
} from "~/client/logger";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { IconTrash } from "@tabler/icons-react";
import EmailEditor from "~/client/components/EmailEditor";

type TabValue = EmailTemplateType | "EMAIL_BLAST";

type TabMetadata = {
  value: TabValue;
  label: string;
  description: string;
};

const TAB_METADATA: TabMetadata[] = [
  {
    value: "ACCEPTANCE",
    label: "Acceptance",
    description:
      "This email is sent automatically to new members after you have approved them"
  },
  {
    value: "DEPARTURE",
    label: "Departure",
    description:
      "This email is sent automatically to members after they leave the club"
  },
  {
    value: "REJECTION",
    label: "Rejection",
    description:
      "This email is sent automatically to people who's application you have declined"
  },
  {
    value: "EMAIL_BLAST",
    label: "Email Blast",
    description:
      "Send emails to all active members of your club."
  }
];

type DraftBadgeProps = {
  state: DraftState;
};

function DraftBadge({ state }: DraftBadgeProps) {
  if (state === "DRAFT") {
    return <Badge color="gray">Draft</Badge>;
  }
  // need to return empty box to keep flex orientation in parent
  // somehow Badge hidden prop does not work
  return <Box />;
}

type EmailTemplateEditorProps = {
  clubId: number;
  type: EmailTemplateType;
};

/**
 * the reason we need the third DRAFT_FINISHED state (as opposed to a simple boolean isDraft)
 * is because of the following UI display edge case:
 *
 * after the first persistence of the draft, it takes some time before the emailTemplate query
 * hydrates the new persisted non-null value. Without differentiating the finished state, if we set the
 * state back to false / NO_DRAFT, the UI will flash for a brief moment the "Create Email Template" panel
 */
type DraftState = "NO_DRAFT" | "DRAFT" | "DRAFT_FINISHED";

function EmailTemplateEditor({ clubId, type }: EmailTemplateEditorProps) {
  const [draftState, setDraftState] = useState<DraftState>("NO_DRAFT");
  // though it would simplify our state management and add client-side form validation
  // it is complex to integrate tiptap with react-hook-forms or mantine-forms. we are accepting
  // this trade-off given form validation is simple and the state management is minimal
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");

  const emailTemplate = api.email.emailTemplate.useQuery({
    clubId,
    type
  });

  QueryError.checkNullable({
    result: emailTemplate,
    fieldName: "emailTemplate"
  });

  const utils = api.useUtils();
  const setEmailTemplate = api.email.setEmailTemplate.useMutation({
    onSuccess: () => {
      utils.email.emailTemplate.invalidate({ clubId, type: type });
      notifySuccess("Success", "Email template has been updated");
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  const deleteEmailTemplate = api.email.deleteEmailTemplate.useMutation({
    onSuccess: () => {
      utils.email.emailTemplate.invalidate({ clubId, type: type });
      notifySuccess("Success", "Email template has been deleted");
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  React.useEffect(() => {
    if (!emailTemplate.data) return;
    setSubject(emailTemplate.data.subject);
    setHtmlContent(emailTemplate.data.htmlContent);
  }, [emailTemplate.data]);

  const handleContentChange = (newSubject: string, newHtmlContent: string) => {
    setSubject(newSubject);
    setHtmlContent(newHtmlContent);
  };

  const handleSave = async () => {
    if (draftState === "DRAFT") {
      const confirmed = window.confirm(
        `The email template will become live immediately after save. Confirm save?`
      );
      if (confirmed) {
        setDraftState("DRAFT_FINISHED");
        await setEmailTemplate.mutateAsync({
          id: { clubId, type: type },
          input: {
            subject,
            htmlContent,
            textContent: ""
          }
        });
      }
      return;
    }

    await setEmailTemplate.mutateAsync({
      id: { clubId, type: type },
      input: {
        subject,
        htmlContent,
        textContent: ""
      }
    });
  };

  const clearContent = () => {
    setSubject("");
    setHtmlContent("");
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this custom ${templateMetadata.label} template? This action cannot be undone.`
    );
    if (confirmed) {
      if (draftState === "DRAFT") {
        setDraftState("NO_DRAFT");
      } else {
        // we still might need to move from DRAFT_FINISHED -> NO_DRAFT
        setDraftState("NO_DRAFT");
        await deleteEmailTemplate.mutateAsync({ clubId, type: type });
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

  const templateMetadata = TAB_METADATA.find((t) => t.value === type)!;

  if (!isLoaded(emailTemplate)) {
    return;
  }

  return emailTemplate.data !== null || draftState !== "NO_DRAFT" ? (
    <Paper withBorder p="xl">
      <Stack gap={0}>
        <Flex
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          w={"100%"}
          mb={"sm"}
        >
          <DraftBadge state={draftState} />

          <ActionIcon
            c={"red"}
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
  ) : (
    <Paper withBorder p="xl">
      <Stack align="center" gap="md">
        <Title
          order={5}
          style={{ textAlign: "center" }}
        >{`Default email will be used for ${templateMetadata.label}.`}</Title>
        <Text
          size="md"
          style={{ textAlign: "center" }}
        >{`${templateMetadata.description}. You can define a custom email to be sent instead.`}</Text>
        <Button onClick={() => setDraftState("DRAFT")}>
          Edit Custom Email
        </Button>
      </Stack>
    </Paper>
  );
}

type EmailTemplatePanelProps = {
  clubId: number;
};

export default function EmailTemplatePanel({
  clubId
}: EmailTemplatePanelProps) {
  const [selectedTab, setSelectedTab] =
    useState<TabValue>("EMAIL_BLAST");

  const handleTabChange = (value: string | null) => {
    setSelectedTab(value as TabValue);
  };

  return (
    <Stack py="lg" pb="xl" gap="xs">
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        styles={{
          tab: {
            // style is only to override theme and set this borderRadius value
            borderRadius: 15
          },
          list: {
            scrollbarWidth: "none",
            overflowX: "auto",
            flexWrap: "nowrap"
          }
        }}
      >
        <Tabs.List mb="md">
          {TAB_METADATA.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      {selectedTab === "EMAIL_BLAST" ? (
        <EmailBlastListPanel clubId={clubId} />
      ) : (
        <EmailTemplateEditor
          // we need this so that each instance
          // has its own react state
          key={selectedTab}
          clubId={clubId}
          type={selectedTab}
        />
      )}
    </Stack>
  );
}
