import React from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Button, Group, Paper, Stack, Text, TextInput, Textarea, Title, Box, ActionIcon } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { ClubFormValues } from "../form-context";

export default function FAQSection(): React.ReactElement {
  const { control, formState: { errors } } = useFormContext<ClubFormValues>();
  
  // Direct access to the FAQ items in the form
  const { fields, append, remove } = useFieldArray({
    control,
    name: "faqs.items" // Make sure this matches the expected structure
  });

  return (
    <Stack gap={8} mt={6}>
      <Title order={6}>Frequently Asked Questions</Title>
      <Text size="sm">Add questions and answers about your club. Both questions and answers must be at least 3 characters long to be saved.</Text>
      
      {fields.length === 0 ? (
        <Text c="dimmed" ta="center">No FAQs added yet</Text>
      ) : (
        <Stack gap="md">
          {fields.map((field, index) => (
            <Paper key={field.id} p="md" withBorder shadow="xs">
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Controller
                    control={control}
                    name={`faqs.items.${index}.question`}
                    render={({ field }) => (
                      <TextInput
                        placeholder="Question"
                        error={errors.faqs?.items?.[index]?.question?.message}
                        {...field}
                        style={{ flex: 1 }}
                      />
                    )}
                  />
                  <ActionIcon
                    color="red"
                    onClick={() => remove(index)}
                    type="button"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
                
                <Controller
                  control={control}
                  name={`faqs.items.${index}.answer`}
                  render={({ field }) => (
                    <Textarea
                      placeholder="Answer"
                      minRows={3}
                      error={errors.faqs?.items?.[index]?.answer?.message}
                      {...field}
                    />
                  )}
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
      
      <Box style={{ display: 'flex', justifyContent: 'center' }} mt="md">
        <Button
          onClick={() => append({ question: "", answer: "" })}
          variant="outline"
          leftSection={<IconPlus size={16} />}
          type="button"
        >
          Add FAQ
        </Button>
      </Box>
    </Stack>
  );
} 