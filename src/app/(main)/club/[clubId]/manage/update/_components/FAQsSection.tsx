import React from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import {
  Button,
  Box,
  Stack,
  TextInput,
  Textarea,
  Title,
  StackProps,
  Group,
  Divider,
  ActionIcon
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { Club } from "~/server/service/types";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";

export default function FAQsSection(props: StackProps): React.ReactElement {
  const {
    control,
    formState: { errors }
  } = useFormContext<Club>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "faqs.items"
  });

  return (
    <Stack gap={8} {...props}>
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
