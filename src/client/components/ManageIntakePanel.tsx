import React from "react";
import {
  useForm,
  Controller,
  useFieldArray,
  Control,
  FieldErrors,
  useFormContext
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  TextInput,
  Select,
  Group,
  Stack,
  Text,
  ActionIcon,
  Card
} from "@mantine/core";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import {
  FormQuestionType,
  FormQuestionsSchema,
  FormQuestion,
  FormQuestions
} from "~/server/service/types/form";

const QUESTION_TYPES = [
  { value: FormQuestionType.SHORT_TEXT, label: "Short Text" },
  { value: FormQuestionType.LONG_TEXT, label: "Long Text" },
  { value: FormQuestionType.SINGLE_SELECT, label: "Single Select" },
  { value: FormQuestionType.MULTI_SELECT, label: "Multi Select" }
];

export function ManageIntakePanel() {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormQuestions>({
    resolver: zodResolver(FormQuestionsSchema),
    defaultValues: {
      questions: new Array<FormQuestion>()
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions"
  });

  const onSubmit = (questions: FormQuestions) => {
    console.log("form questions:", questions);
  };

  return (
    <Box p="xl">
      <Text size="xl" fw={500} mb="xl">
        Define Form Questions
      </Text>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          {fields.map((field, index) => (
            <QuestionPanel
              key={field.id}
              control={control}
              index={index}
              errors={errors}
              onDelete={() => remove(index)}
            />
          ))}

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() =>
              append({
                question: "",
                type: FormQuestionType.SHORT_TEXT,
                metadata: undefined
              })
            }
          >
            Add Question
          </Button>

          <Button type="submit">Submit</Button>
        </Stack>
      </form>
    </Box>
  );
}

type QuestionPanelProps = {
  index: number;
  onDelete: () => void;
  control: Control<FormQuestions>;
  errors: FieldErrors<FormQuestions>;
};

function QuestionPanel({
  control,
  index,
  errors,
  onDelete
}: QuestionPanelProps) {
  const { watch } = useFormContext<FormQuestions>();
  const questionType = watch(`questions.${index}.type`);

  return (
    <Card withBorder p="md">
      <Stack>
        <Controller
          name={`questions.${index}.question`}
          control={control}
          render={({ field }) => (
            <TextInput
              label="Question"
              placeholder="Enter the question"
              error={errors.questions?.[index]?.question?.message}
              {...field}
            />
          )}
        />

        <Controller
          name={`questions.${index}.type`}
          control={control}
          render={({ field }) => (
            <Select
              label="Question Type"
              data={QUESTION_TYPES}
              error={errors.questions?.[index]?.metadata?.type}
              {...field}
            />
          )}
        />

        {(questionType === FormQuestionType.SINGLE_SELECT ||
          questionType === FormQuestionType.MULTI_SELECT) && (
          <Controller
            name={`questions.${index}.metadata.choices`}
            control={control}
            render={({ field }) => {
              return (
                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    Choices
                  </Text>
                  {field.value?.map((choice, choiceIndex) => (
                    <Group key={choiceIndex} mb="xs">
                      <TextInput
                        value={choice}
                        onChange={(e) => {
                          const updatedChoices = [...field.value];
                          updatedChoices[choiceIndex] = e.target.value;
                          field.onChange(updatedChoices);
                        }}
                        placeholder={`Choice ${choiceIndex + 1}`}
                      />
                      <ActionIcon
                        color="red"
                        onClick={() => {
                          const updatedChoices = field.value.filter(
                            (_, i) => i !== choiceIndex
                          );
                          field.onChange(updatedChoices);
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  ))}
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      field.onChange([...(field.value || []), ""]);
                    }}
                  >
                    Add Choice
                  </Button>
                  {errors.questions?.[index]?.metadata && (
                    <Text c="red" size="sm" mt="xs">
                      {errors.questions[index].metadata.message}
                    </Text>
                  )}
                </Box>
              );
            }}
          />
        )}

        <Group>
          <ActionIcon color="red" onClick={onDelete}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Stack>
    </Card>
  );
}
