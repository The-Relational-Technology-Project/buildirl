import {
  Box,
  Button,
  Flex,
  Stack,
  Text,
  TextInput,
  BoxProps
} from "@mantine/core";
import { RichTextEditor } from "@mantine/tiptap";
import { Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@mantine/tiptap";
import { Underline } from "@tiptap/extension-underline";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Subscript } from "@tiptap/extension-subscript";
import { Highlight } from "@tiptap/extension-highlight";
import { IconDeviceFloppy, IconSend, IconTrash } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { Maybe } from "~/utils/types";

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

export type EmailEditorProps = {
  subject: string;
  htmlContent: string;
  onContentChange: (
    subject: string,
    htmlContent: string,
    textContent: string
  ) => void;

  readOnly?: boolean;

  onSave?: () => void;
  onSend?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;

  saveButtonText?: string;
  saveButtonLoading?: boolean;
  sendButtonText?: string;
  sendButtonLoading?: boolean;
  sendButtonDisabled?: boolean;
  cancelButtonText?: string;
  showDeleteButton?: boolean;
  showSendButton?: boolean;
  minHeight?: number;
};

export default function EmailEditor({
  subject,
  htmlContent,
  onContentChange,
  readOnly = false,
  onSave,
  onSend,
  onDelete,
  onCancel,
  saveButtonText = "Save",
  saveButtonLoading = false,
  sendButtonText = "Save & Send",
  sendButtonLoading = false,
  sendButtonDisabled = false,
  cancelButtonText = "Cancel",
  showDeleteButton = false,
  showSendButton = false,
  minHeight = 240
}: EmailEditorProps) {
  const [internalSubject, setInternalSubject] = useState(subject);

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
    content: htmlContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onContentChange(internalSubject, editor.getHTML(), editor.getText());
    }
  });

  useEffect(() => {
    if (editor && htmlContent !== editor.getHTML()) {
      editor.commands.setContent(htmlContent);
    }
  }, [editor, htmlContent]);

  useEffect(() => {
    setInternalSubject(subject);
  }, [subject]);

  const handleSubjectChange = (newSubject: string) => {
    setInternalSubject(newSubject);
    if (editor) {
      onContentChange(newSubject, editor.getHTML(), editor.getText());
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Subject"
        placeholder="Enter email subject..."
        value={internalSubject}
        onChange={(e) => handleSubjectChange(e.target.value)}
        readOnly={readOnly}
      />

      <Box>
        <Text size="sm" fw={500} mb={4}>
          Content
        </Text>
        <RichTextEditor editor={editor}>
          {!readOnly && (
            <RichTextEditor.Toolbar>
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
          )}

          <ClickableEditorContent editor={editor} mih={minHeight} />
        </RichTextEditor>
      </Box>

      <Flex gap="md" justify="space-between">
        <Flex gap="md">
          <Button variant="light" onClick={onCancel}>
            {readOnly ? "Back to List" : cancelButtonText}
          </Button>
          {showDeleteButton && !readOnly && (
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
        </Flex>

        {!readOnly && (onSave || onSend) && (
          <Flex gap="md">
            {showSendButton && onSend && (
              <Button
                leftSection={<IconSend size={16} />}
                onClick={onSend}
                disabled={sendButtonDisabled}
                loading={sendButtonLoading}
                color="blue"
              >
                {sendButtonText}
              </Button>
            )}
            {onSave && (
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={onSave}
                loading={saveButtonLoading}
              >
                {saveButtonText}
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Stack>
  );
}
