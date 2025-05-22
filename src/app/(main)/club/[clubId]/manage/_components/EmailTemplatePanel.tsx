import { api } from "~/trpc/react";
import {
  ActionIcon,
  Box,
  BoxProps,
  Button,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { RichTextEditor } from "@mantine/tiptap";
import { Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@mantine/tiptap";
import React, { useState } from "react";
import { EmailTemplateType } from "~/server/email/types";
import { Underline } from "@tiptap/extension-underline";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Subscript } from "@tiptap/extension-subscript";
import { Highlight } from "@tiptap/extension-highlight";
import {
  handleDefaultMutationError,
  notifyError,
  notifySuccess
} from "~/client/logger";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { Maybe } from "~/utils/types";

type EmailTemplateMetadata = {
  value: EmailTemplateType;
  label: string;
  description: string;
};

const TEMPLATE_METADATA: EmailTemplateMetadata[] = [
  {
    value: "ACCEPTANCE",
    label: "Acceptance",
    description:
      "This email is sent automatically to new members after you have approved them."
  },
  {
    value: "DEPARTURE",
    label: "Departure",
    description:
      "This email is sent automatically to members after they leave the club."
  },
  {
    value: "REJECTION",
    label: "Rejection",
    description:
      "This email is sent automatically to people who's application you have declined."
  }
];

type ClickableEditorContentProps = {
  editor: Maybe<Editor>;
};

function ClickableEditorContent({
  editor,
  ...props
}: ClickableEditorContentProps & BoxProps) {
  const handleClick = () => {
    if (editor && !editor.isFocused) {
      editor.commands.focus("end");
    }
  };
  return <RichTextEditor.Content {...props} onClick={handleClick} />;
}

type EmailTemplateEditorProps = {
  clubId: number;
  type: EmailTemplateType;
};

function EmailTemplateEditor({ clubId, type }: EmailTemplateEditorProps) {
  // though it would simplify our state management and add client-side form validation
  // it is complex to integrate tiptap with react-hook-forms or mantine-forms. we are accepting
  // this trade-off given form validation is simple and the state management is minimal

  const [subject, setSubject] = useState("");

  const emailTemplate = api.email.emailTemplate.useQuery({
    clubId,
    type: type
  });

  QueryError.checkNullable({
    result: emailTemplate,
    fieldName: "emailTemplate"
  });

  const utils = api.useContext();
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      Subscript,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] })
    ],
    content: emailTemplate.data?.htmlContent || ""
  });

  React.useEffect(() => {
    if (!editor) return;
    if (!emailTemplate.data) return;
    editor.commands.setContent(emailTemplate.data.htmlContent);
    setSubject(emailTemplate.data.subject);
  }, [editor, emailTemplate.data]);

  const handleSave = async () => {
    if (!editor) {
      notifyError("Editor was not available during save; this is unexpected.");
      return;
    }

    await setEmailTemplate.mutateAsync({
      id: { clubId, type: type },
      input: {
        subject,
        htmlContent: editor.getHTML(),
        textContent: editor.getText()
      }
    });
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this custom ${templateMetadata.label} template? This action cannot be undone.`
    );
    if (confirmed) {
      await deleteEmailTemplate.mutateAsync({ clubId, type: type });
    }
  };

  const handleAdd = async () => {
    await setEmailTemplate.mutateAsync({
      id: { clubId, type: type },
      input: {
        subject: "",
        htmlContent: "",
        textContent: ""
      }
    });
  };

  const templateMetadata = TEMPLATE_METADATA.find((t) => t.value === type)!;

  if (!isLoaded(emailTemplate)) {
    return;
  }

  return emailTemplate.data !== null ? (
    <Paper withBorder p="xl">
      <Stack gap={0}>
        <ActionIcon
          c={"red"}
          onClick={handleDelete}
          loading={deleteEmailTemplate.isPending}
          style={{ alignSelf: "flex-end" }}
        >
          <IconTrash size={20} />
        </ActionIcon>
        <Stack gap={"xs"}>
          <Text size={"sm"} fw={500}>
            Email Subject
          </Text>
          <TextInput
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            mb="sm"
          />

          <Text size="sm" fw={500}>
            Email Content
          </Text>
          <RichTextEditor editor={editor}>
            <RichTextEditor.Toolbar sticky stickyOffset={0}>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Bold />
                <RichTextEditor.Italic />
                <RichTextEditor.Underline />
                <RichTextEditor.Strikethrough />
                <RichTextEditor.ClearFormatting />
                <RichTextEditor.Highlight />
                <RichTextEditor.Code />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.H1 />
                <RichTextEditor.H2 />
                <RichTextEditor.H3 />
                <RichTextEditor.H4 />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Blockquote />
                <RichTextEditor.Hr />
                <RichTextEditor.BulletList />
                <RichTextEditor.OrderedList />
                <RichTextEditor.Subscript />
                <RichTextEditor.Superscript />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Link />
                <RichTextEditor.Unlink />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.AlignLeft />
                <RichTextEditor.AlignCenter />
                <RichTextEditor.AlignJustify />
                <RichTextEditor.AlignRight />
              </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>

            <ClickableEditorContent editor={editor} mih={240} />
          </RichTextEditor>

          <Box style={{ alignSelf: "center" }} mt={"sm"}>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
              loading={setEmailTemplate.isPending}
            >
              Save Template
            </Button>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  ) : (
    <Paper withBorder p="xl">
      <Stack align="center" gap="md">
        <Title order={5}>
          {`No custom email template defined for ${templateMetadata.label}`}
        </Title>
        <Text size="md">{`${templateMetadata.description}`}</Text>
        <Text size="md">{}</Text>
        <Button onClick={handleAdd} loading={setEmailTemplate.isPending}>
          Create Email Template
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
  const [selectedType, setSelectedType] =
    useState<EmailTemplateType>("ACCEPTANCE");

  return (
    <Stack py="lg" pb="xl" gap="xs">
      <Tabs
        value={selectedType}
        onChange={(v) => setSelectedType(v as EmailTemplateType)}
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
          {TEMPLATE_METADATA.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <EmailTemplateEditor clubId={clubId} type={selectedType} />
    </Stack>
  );
}
