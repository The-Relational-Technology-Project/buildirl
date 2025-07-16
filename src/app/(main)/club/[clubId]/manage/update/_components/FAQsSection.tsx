import React from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import {
  Button,
  Box,
  Stack,
  TextInput,
  Textarea,
  Title,
  Group,
  Divider
} from "@mantine/core";
import { IconPlus, IconX, IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import { Club } from "~/server/club/types";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";

export default function FAQsSection() {
  const {
    control,
    formState: { errors }
  } = useFormContext<Club>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "faqs.items"
  });

  const moveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  return (
    <Stack gap={8}>
      <Title order={6} ta="left">
        Frequently Asked Questions
      </Title>

      {fields.length > 0 && (
        <Stack gap="md" w="100%">
          {fields.map((field, index) => (
            <React.Fragment key={field.id}>
              {index > 0 && <Divider my="xs" />}
              <Box>
                <Group justify="flex-end" mb={8}>
                  <ColorSchemeAwareActionIcon 
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                  >
                    <IconChevronUp size={16} />
                  </ColorSchemeAwareActionIcon>
                  
                  <ColorSchemeAwareActionIcon 
                    onClick={() => moveDown(index)}
                    disabled={index === fields.length - 1}
                  >
                    <IconChevronDown size={16} />
                  </ColorSchemeAwareActionIcon>
                  
                  <ColorSchemeAwareActionIcon onClick={() => remove(index)}>
                    <IconX size={16} />
                  </ColorSchemeAwareActionIcon>
                </Group>

                <Stack gap="xs">
                  <Controller
                    control={control}
                    name={`faqs.items.${index}.question`}
                    render={({ field }) => (
                      <TextInput
                        placeholder="Question"
                        error={errors.faqs?.items?.[index]?.question?.message}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name={`faqs.items.${index}.answer`}
                    render={({ field }) => (
                      <Textarea
                        placeholder="Answer"
                        minRows={5}
                        error={errors.faqs?.items?.[index]?.answer?.message}
                        {...field}
                      />
                    )}
                  />
                </Stack>
              </Box>
            </React.Fragment>
          ))}
        </Stack>
      )}

      <Button
        onClick={() => append({ question: "", answer: "" })}
        leftSection={<IconPlus size={16} />}
        type="button"
        mt="md"
        w={150}
        mx="auto"
      >
        Add FAQ
      </Button>
    </Stack>
  );
}
