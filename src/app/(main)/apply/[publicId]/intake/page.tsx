"use client";

import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Group,
  MultiSelect,
  Select,
  Stack,
  Stepper,
  Textarea,
  TextInput
} from "@mantine/core";
import {
  FormQuestion,
  FormQuestions,
  FormQuestionType,
  FormResponse,
  FormResponses,
  FormResponsesSchema
} from "~/server/service/types/form";
import { assertAsString, assertAsStringArray } from "~/utils";

export default function IntakePage() {
  // Mock data for the form questions
  const mockQuestions: FormQuestions = {
    questions: [
      {
        question: "What is your name?",
        type: FormQuestionType.SHORT_TEXT
      },
      {
        question: "Tell us about yourself",
        type: FormQuestionType.LONG_TEXT
      },
      {
        question: "What is your favorite color?",
        type: FormQuestionType.SINGLE_SELECT,
        metadata: {
          choices: ["Red", "Blue", "Green"]
        }
      },
      {
        question: "Select your hobbies",
        type: FormQuestionType.MULTI_SELECT,
        metadata: {
          choices: ["Reading", "Swimming", "Coding"]
        }
      }
    ]
  };
  return (
    <Stack pt={"xl"} px={{ base: undefined, md: 150 }}>
      <ApplicationForm applicationQuestions={mockQuestions} />
    </Stack>
  );
}

type ApplicationFormProps = {
  applicationQuestions: FormQuestions;
};

function ApplicationForm({ applicationQuestions }: ApplicationFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const { handleSubmit, register, control } = useForm<FormResponses>({
    resolver: zodResolver(FormResponsesSchema),
    defaultValues: {
      responses: applicationQuestions.questions.map((question) =>
        defaultResponse(question)
      )
    }
  });

  function defaultResponse(question: FormQuestion): FormResponse {
    switch (question.type) {
      case FormQuestionType.SHORT_TEXT:
        return {
          ...question,
          response: ""
        };
      case FormQuestionType.LONG_TEXT:
        return {
          ...question,
          response: ""
        };
      case FormQuestionType.SINGLE_SELECT:
        return {
          ...question,
          response: ""
        };
      case FormQuestionType.MULTI_SELECT:
        return {
          ...question,
          response: []
        };
      default:
        throw new Error(`unsupported question type`);
    }
  }

  const onSubmit = (data: FormResponses) => {
    console.log(data);
    // Save the responses to your backend or state management
  };

  const nextStep = () =>
    setActiveStep((current) =>
      current < applicationQuestions.questions.length - 1
        ? current + 1
        : current
    );
  const prevStep = () =>
    setActiveStep((current) => (current > 0 ? current - 1 : current));

  const renderQuestion = (question: FormQuestion, index: number) => {
    switch (question.type) {
      case FormQuestionType.SHORT_TEXT:
        return (
          <TextInput
            key={index}
            label={question.question}
            {...register(`responses.${index}.response`)}
          />
        );
      case FormQuestionType.LONG_TEXT:
        return (
          <Textarea
            key={index}
            label={question.question}
            {...register(`responses.${index}.response`)}
          />
        );
      case FormQuestionType.SINGLE_SELECT:
        return (
          <Controller
            key={index}
            name={`responses.${index}.response`}
            control={control}
            render={({ field }) => (
              <Select
                label={question.question}
                data={question.metadata?.choices || []}
                // expect only 1 string for this type
                value={
                  field.value === null ? null : assertAsString(field.value)
                }
                onChange={(value) => {
                  field.onChange(value);
                }}
              />
            )}
          />
        );
      case FormQuestionType.MULTI_SELECT:
        return (
          <Controller
            key={index}
            name={`responses.${index}.response`}
            control={control}
            render={({ field }) => (
              <MultiSelect
                label={question.question}
                data={question.metadata?.choices || []}
                // expect only list of string for this type
                value={assertAsStringArray(field.value)}
                onChange={(values) => {
                  field.onChange(values);
                }}
              />
            )}
          />
        );
      default:
        throw new Error(`unsupported question type`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stepper size="xs" color="violet" active={activeStep}>
        {applicationQuestions.questions.map((question, index) => (
          <Stepper.Step key={index}>
            <Box mt={"xl"}>{renderQuestion(question, index)}</Box>
          </Stepper.Step>
        ))}
      </Stepper>

      <Group mt="xl" justify={"center"}>
        {activeStep > 0 && (
          <Button variant="default" onClick={prevStep}>
            Back
          </Button>
        )}
        {activeStep === applicationQuestions.questions.length - 1 ? (
          <Button type="submit">Submit</Button>
        ) : (
          <Button onClick={nextStep}>Next</Button>
        )}
      </Group>
    </form>
  );
}
