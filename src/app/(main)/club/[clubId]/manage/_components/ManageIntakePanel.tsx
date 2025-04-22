import React from "react";
import {
  useForm,
  Controller,
  useFieldArray,
  FieldErrors,
  useFormContext,
  FormProvider
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
  Card
} from "@mantine/core";
import { IconPlus, IconX, IconDeviceFloppy } from "@tabler/icons-react";
import {
  FormQuestionType,
  FormQuestionsSchema,
  FormQuestions
} from "~/server/service/types/form";
import { Club } from "~/server/service/types";
import { api } from "~/trpc/react";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";

const QUESTION_TYPES = [
  { value: FormQuestionType.SHORT_TEXT, label: "Short Text" },
  { value: FormQuestionType.LONG_TEXT, label: "Long Text" },
  { value: FormQuestionType.SINGLE_SELECT, label: "Single Select" },
  { value: FormQuestionType.MULTI_SELECT, label: "Multi Select" }
];

type ManageIntakePanelProps = {
  club: Club;
};

export default function ManageIntakePanel({ club }: ManageIntakePanelProps) {
  const utils = api.useUtils();

  const updateClubApplicationQuestions =
    api.main.updateClubApplicationQuestions.useMutation({
      onSuccess: () => {
        utils.main.club.invalidate({ id: club.id });
        utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
        utils.main.userOwnedClubs.invalidate();
      }
    });

  const methods = useForm<FormQuestions>({
    resolver: zodResolver(FormQuestionsSchema),
    defaultValues: club.applicationQuestions,
    mode: "onBlur"
  });

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions"
  });

  const onSubmit = async (questions: FormQuestions) => {
    await updateClubApplicationQuestions.mutateAsync({
      clubId: club.id,
      input: { applicationQuestions: questions }
    });
  };

  return (
    <Box py={"xl"}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            {fields.map((field, index) => (
              <QuestionPanel
                key={field.id}
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
              w={150}
              style={{ alignSelf: "center" }}
            >
              Add Question
            </Button>

            <Button
              type="submit"
              disabled={Object.keys(errors).length > 0}
              loading={updateClubApplicationQuestions.isPending}
              leftSection={<IconDeviceFloppy size={16} />}
              w={150}
              style={{ alignSelf: "center" }}
            >
              Save
            </Button>
          </Stack>
        </form>
      </FormProvider>
    </Box>
  );
}

type QuestionPanelProps = {
  index: number;
  onDelete: () => void;
  errors: FieldErrors<FormQuestions>;
};

function QuestionPanel({ index, onDelete, errors }: QuestionPanelProps) {
  const { watch, setValue, control, clearErrors } =
    useFormContext<FormQuestions>();
  const questionType = watch(`questions.${index}.type`);

  const resetMetadataOnTypeChange = (newType: FormQuestionType) => {
    if (questionType !== newType) {
      setValue(`questions.${index}.metadata`, defaultMetadata(newType));
    }
  };

  function defaultMetadata(type: FormQuestionType) {
    switch (type) {
      case FormQuestionType.SHORT_TEXT:
        return undefined;
      case FormQuestionType.LONG_TEXT:
        return undefined;
      case FormQuestionType.SINGLE_SELECT:
        return { choices: [""] };
      case FormQuestionType.MULTI_SELECT:
        return { choices: [""] };
      default:
        throw new Error(`unsupported question type`);
    }
  }

  return (
    <Card pt={"sm"} pb="md" px="md">
      <ColorSchemeAwareActionIcon
        onClick={onDelete}
        style={{ alignSelf: "flex-end" }}
      >
        <IconX size={16} />
      </ColorSchemeAwareActionIcon>
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
              onBlur={field.onBlur}
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
              error={
                //@ts-expect-error too much to get the typing of these complex error objects right ¯\_(ツ)_/¯
                errors.questions?.[index]?.type?.message
              }
              {...field}
              onChange={(value) => {
                resetMetadataOnTypeChange(value as FormQuestionType);
                field.onChange(value);
              }}
              onBlur={field.onBlur}
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
                    <Stack gap={"xs"} mb="xs" key={choiceIndex}>
                      <Group gap={2}>
                        <TextInput
                          value={choice}
                          onChange={(e) => {
                            const updatedChoices = [...field.value];
                            updatedChoices[choiceIndex] = e.target.value;
                            field.onChange(updatedChoices);
                          }}
                          onBlur={field.onBlur}
                          placeholder={`Choice ${choiceIndex + 1}`}
                        />
                        <ColorSchemeAwareActionIcon
                          onClick={() => {
                            const updatedChoices = field.value.filter(
                              (_, i) => i !== choiceIndex
                            );
                            field.onChange(updatedChoices);
                            // clear error for the deleted choice if any
                            clearErrors(
                              `questions.${index}.metadata.choices.${choiceIndex}`
                            );
                          }}
                        >
                          <IconX size={16} />
                        </ColorSchemeAwareActionIcon>
                      </Group>
                      {
                        // @ts-expect-error
                        errors.questions?.[index]?.metadata?.choices?.[
                          choiceIndex
                        ] && (
                          <Text c="red" size="sm">
                            {
                              // @ts-expect-error
                              errors.questions?.[index]?.metadata?.choices?.[
                                choiceIndex
                              ]?.message
                            }
                          </Text>
                        )
                      }
                    </Stack>
                  ))}
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      field.onChange([...(field.value || []), ""]);
                    }}
                    mt={"xs"}
                  >
                    Add Choice
                  </Button>
                  {
                    // @ts-expect-error
                    errors.questions?.[index]?.metadata?.choices && (
                      <Text c="red" size="sm" mt="xs">
                        {
                          // @ts-expect-error 
                          errors.questions?.[index]?.metadata?.choices?.message
                        }
                      </Text>
                    )
                  }
                </Box>
              );
            }}
          />
        )}
      </Stack>
    </Card>
  );
}
