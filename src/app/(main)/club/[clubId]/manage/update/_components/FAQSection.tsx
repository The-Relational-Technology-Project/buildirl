import React from "react";
import { useForm } from "@mantine/form";
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Box
} from "@mantine/core";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { FAQSchema, FAQ } from "~/server/service/types";
import { safeValidateSchema } from "~/utils/zod";

// Import the context from form-context
import { useClubFormContext } from "../form-context";

/**
 * FAQSection component for managing club FAQs
 * Uses form context instead of props for better maintainability
 */

export default function FAQSection(): React.ReactElement {
  const form = useClubFormContext();
  
  // Track which FAQ item is being edited (null means adding new)
  const [editingState, setEditingState] = React.useState<{
    isEditing: boolean;
    index: number | null;
  }>({
    isEditing: false,
    index: null
  });
  
  // Form for the FAQ being edited - using the exported FAQ type
  const faqForm = useForm<FAQ>({
    initialValues: {
      question: "",
      answer: ""
    },
    // Use the same schema validation approach as the parent form
    validate: (values) => {
      // Create a temp FAQ object to validate against the schema
      const result = safeValidateSchema(FAQSchema, values);
      if (result) {
        // Return validation errors in the format Mantine expects
        return {
          question: result.includes("Question") ? result : null,
          answer: result.includes("Answer") ? result : null
        };
      }
      return {}; 
    }
  });
  
  // Get the current FAQs from the main form
  const getItems = (): FAQ[] => form.values.faqs.items || [];
  
  const handleAddFAQ = () => {
    faqForm.reset();
    setEditingState({ isEditing: true, index: null });
  };
  
  const handleEditFAQ = (index: number) => {
    const faq = getItems()[index];
    if (!faq) return;
    
    faqForm.setValues({
      question: faq.question,
      answer: faq.answer
    });
    
    setEditingState({ isEditing: true, index });
  };
  
  const handleSaveFAQ = () => {
    const validation = faqForm.validate();
    if (!validation.hasErrors) {
      const newFAQ: FAQ = {
        question: faqForm.values.question,
        answer: faqForm.values.answer
      };
      
      // Update the main form state using immutable update pattern
      const updatedItems = [...getItems()];
      if (editingState.index !== null) {
        updatedItems[editingState.index] = newFAQ;
      } else {
        updatedItems.push(newFAQ);
      }
      
      // Update form state
      form.setFieldValue('faqs.items', updatedItems);
      
      // Show notification
      notifications.show({
        title: 'FAQ Updated',
        message: 'Changes will be saved when you save the club',
        color: 'blue'
      });
      
      // Close edit mode
      setEditingState({ isEditing: false, index: null });
    }
  };
  
  const handleCancelFAQ = () => {
    setEditingState({ isEditing: false, index: null });
    faqForm.reset();
  };
  
  const handleDeleteFAQ = (index: number) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      // Remove locally from the main form using immutable update pattern
      const updatedItems = [...getItems()];
      updatedItems.splice(index, 1);
      
      // Update form state
      form.setFieldValue('faqs.items', updatedItems);
      
      // Show notification
      notifications.show({
        title: 'FAQ Deleted',
        message: 'Changes will be saved when you save the club',
        color: 'blue'
      });
    }
  };

  return (
    <Stack 
      gap={8} 
      mt={6}
    >
      <Title order={6}>Frequently Asked Questions</Title>
      <Text size="sm">Add questions and answers that potential members might have about your club.</Text>
      <Text size="xs" c="dimmed" mb="xs">
        Changes to FAQs will be saved when you submit the entire form using the Save button at the bottom.
      </Text>
      
      {getItems().length === 0 && !editingState.isEditing ? (
        <Text c="dimmed" ta="center" mb="md">No FAQs added yet</Text>
      ) : (
        <Stack gap="md">
          {getItems().map((faq, index) => (
            <Paper key={index} p="md" withBorder shadow="xs">
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Text fw={700} size="md">{faq.question}</Text>
                  <Group gap="xs">
                    <ActionIcon 
                      onClick={() => handleEditFAQ(index)}
                      size="sm"
                      disabled={editingState.isEditing}
                      type="button"
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      onClick={() => handleDeleteFAQ(index)}
                      color="red" 
                      size="sm"
                      disabled={editingState.isEditing}
                      type="button"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
                <Text c="dimmed">{faq.answer}</Text>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
      
      {editingState.isEditing ? (
        <Paper p="md" withBorder>
          <div>
            <Stack>
              <TextInput
                label="Question"
                placeholder="What is your club about?"
                required
                {...faqForm.getInputProps("question")}
              />
              <Textarea
                label="Answer"
                placeholder="Our club is about..."
                minRows={4}
                autosize
                maxRows={30}
                required
                {...faqForm.getInputProps("answer")}
              />
              <Group justify="flex-end">
                <Button 
                  variant="outline" 
                  onClick={handleCancelFAQ}
                  type="button"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveFAQ}
                  type="button"
                >
                  {editingState.index !== null ? "Update" : "Add"} FAQ
                </Button>
              </Group>
            </Stack>
          </div>
        </Paper>
      ) : (
        <Box style={{ display: 'flex', justifyContent: 'center' }} mt="md">
          <Button 
            onClick={handleAddFAQ}
            variant="outline"
            leftSection={<IconPlus size={16} />}
            type="button"
          >
            Add FAQ
          </Button>
        </Box>
      )}
    </Stack>
  );
} 