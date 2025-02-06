"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Stepper,
  Group,
  TextInput,
  Textarea,
  Select,
  MultiSelect
} from "@mantine/core";
import { z } from "zod";
import {
  FormQuestionsSchema,
  FormQuestionType,
  FormResponses,
  FormResponsesSchema
} from "~/server/service/types/form";

// Mock data for the form questions
const formQuestions: z.infer<typeof FormQuestionsSchema> = [
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
];

export default function FormPage() {
  const [activeStep, setActiveStep] = useState(0);
  const methods = useForm<FormResponses>({
    resolver: zodResolver(FormResponsesSchema)
  });

  const { handleSubmit, register } = methods;

  const onSubmit = (data: FormResponses) => {
    console.log(data);
    // Save the responses to your backend or state management
  };

  const nextStep = () =>
    setActiveStep((current) =>
      current < formQuestions.length - 1 ? current + 1 : current
    );
  const prevStep = () =>
    setActiveStep((current) => (current > 0 ? current - 1 : current));

  const renderQuestion = (
    question: z.infer<typeof FormQuestionsSchema>[number],
    index: number
  ) => {
    switch (question.type) {
      case FormQuestionType.SHORT_TEXT:
        return (
          <TextInput
            key={index}
            label={question.question}
            {...register(`${index}.response`)}
          />
        );
      case FormQuestionType.LONG_TEXT:
        return (
          <Textarea
            key={index}
            label={question.question}
            {...register(`${index}.response`)}
          />
        );
      case FormQuestionType.SINGLE_SELECT:
        return (
          <Select
            key={index}
            label={question.question}
            data={question.metadata?.choices || []}
            {...register(`${index}.response`)}
          />
        );
      case FormQuestionType.MULTI_SELECT:
        return (
          <MultiSelect
            key={index}
            label={question.question}
            data={question.metadata?.choices || []}
            {...register(`${index}.response`)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stepper active={activeStep}>
          {formQuestions.map((question, index) => (
            <Stepper.Step key={index} label={`Question ${index + 1}`}>
              {renderQuestion(question, index)}
            </Stepper.Step>
          ))}
        </Stepper>

        <Group mt="xl">
          <Button variant="default" onClick={prevStep}>
            Back
          </Button>
          {activeStep === formQuestions.length - 1 ? (
            <Button type="submit">Submit</Button>
          ) : (
            <Button onClick={nextStep}>Next</Button>
          )}
        </Group>
      </form>
    </FormProvider>
  );
}
