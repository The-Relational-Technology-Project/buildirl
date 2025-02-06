"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
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
  FormQuestion,
  FormQuestionsSchema,
  FormQuestionType,
  FormResponses,
  FormResponsesSchema
} from "~/server/service/types/form";

// Mock data for the form questions
const formQuestions: z.infer<typeof FormQuestionsSchema> = {
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

export default function IntakePage() {
  const [activeStep, setActiveStep] = useState(0);
  const { handleSubmit, register } = useForm<FormResponses>({
    resolver: zodResolver(FormResponsesSchema)
  });

  const onSubmit = (data: FormResponses) => {
    console.log(data);
    // Save the responses to your backend or state management
  };

  const nextStep = () =>
    setActiveStep((current) =>
      current < formQuestions.questions.length - 1 ? current + 1 : current
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
          <Select
            key={index}
            label={question.question}
            data={question.metadata?.choices || []}
            {...register(`responses.${index}.response`)}
          />
        );
      case FormQuestionType.MULTI_SELECT:
        return (
          <MultiSelect
            key={index}
            label={question.question}
            data={question.metadata?.choices || []}
            {...register(`responses.${index}.response`)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stepper active={activeStep}>
        {formQuestions.questions.map((question, index) => (
          <Stepper.Step key={index} label={`Question ${index + 1}`}>
            {renderQuestion(question, index)}
          </Stepper.Step>
        ))}
      </Stepper>

      <Group mt="xl">
        <Button variant="default" onClick={prevStep}>
          Back
        </Button>
        {activeStep === formQuestions.questions.length - 1 ? (
          <Button type="submit">Submit</Button>
        ) : (
          <Button onClick={nextStep}>Next</Button>
        )}
      </Group>
    </form>
  );
}
