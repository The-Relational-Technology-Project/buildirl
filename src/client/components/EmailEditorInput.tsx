import { Box, Stack, Text, TextInput, BoxProps } from "@mantine/core";
import { RichTextEditor } from "@mantine/tiptap";
import { Editor } from "@tiptap/react";
import { useEffect } from "react";
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

export type EmailEditorInputProps = {
  editor: Editor;
  subject: string;
  htmlContent: string;
  onContentChange: (
    subject: string,
    htmlContent: string,
    textContent: string
  ) => void;

  readOnly?: boolean;
};

export default function EmailEditorInput({
  editor,
  subject,
  htmlContent,
  onContentChange,
  readOnly = false
}: EmailEditorInputProps) {
  useEffect(() => {
    if (editor && htmlContent !== editor.getHTML()) {
      editor.commands.setContent(htmlContent);
    }
  }, [editor, htmlContent]);

  const handleSubjectChange = (newSubject: string) => {
    if (editor) {
      onContentChange(newSubject, editor.getHTML(), editor.getText());
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Subject"
        placeholder="Enter email subject..."
        value={subject}
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

          <ClickableEditorContent editor={editor} mih={240} />
        </RichTextEditor>
      </Box>
    </Stack>
  );
}
