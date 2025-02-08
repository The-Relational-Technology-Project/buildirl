"use client";

import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Group,
  Radio,
  RadioGroup,
  Stack,
  Stepper,
  Text,
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
import { assertAsString, assertAsStringArray, strictParseInt } from "~/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";

export default function IntakePage() {
  const params = useParams<{ publicId: string }>();
  const searchParams = useSearchParams();
  const membershipTierId = strictParseInt(searchParams.get("membershipTierId"));

  const r = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(r) && (
      <Stack pt={"xl"} px={{ base: undefined, md: 150 }}>
        <ApplicationForm
          applicationQuestions={r.data!.applicationQuestions}
          membershipTierId={membershipTierId}
          clubPublicId={params.publicId}
        />
      </Stack>
    )
  );
}

type ApplicationFormProps = {
  applicationQuestions: FormQuestions;
  membershipTierId: number;
  clubPublicId: string;
};

function ApplicationForm({
  applicationQuestions,
  membershipTierId,
  clubPublicId
}: ApplicationFormProps) {
  const [activeStep, setActiveStep] = useState(0);

  const utils = api.useUtils();
  const router = useRouter();

  const submitMembershipApplication =
    api.main.submitMembershipApplication.useMutation({
      onSuccess: () => {
        utils.main.userMemberships.invalidate();
        router.push(`/apply/${clubPublicId}/completed`);
      }
    });

  const {
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<FormResponses>({
    resolver: zodResolver(FormResponsesSchema),
    defaultValues: {
      responses: applicationQuestions.questions.map((question) =>
        defaultResponse(question)
      )
    },
    mode: "onBlur"
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

  const onSubmit = async (responses: FormResponses) => {
    await submitMembershipApplication.mutateAsync({
      membershipTierId: membershipTierId,
      input: { applicationResponses: responses }
    });
  };

  const nextStep = () =>
    setActiveStep((current) =>
      current < applicationQuestions.questions.length - 1
        ? current + 1
        : current
    );
  const prevStep = () =>
    setActiveStep((current) => (current > 0 ? current - 1 : current));

  const isCurrentStepValid = () => {
    return !errors.responses?.[activeStep]?.response;
  };

  const renderQuestion = (question: FormQuestion, index: number) => {
    switch (question.type) {
      case FormQuestionType.SHORT_TEXT:
        return (
          <Controller
            name={`responses.${index}.response`}
            control={control}
            render={({ field }) => (
              <TextInput
                key={index}
                label={question.question}
                placeholder={"Enter your response"}
                error={errors.responses?.[index]?.response?.message}
                {...field}
                onBlur={field.onBlur}
              />
            )}
          />
        );
      case FormQuestionType.LONG_TEXT:
        return (
          <Controller
            name={`responses.${index}.response`}
            control={control}
            render={({ field }) => (
              <Textarea
                key={index}
                label={question.question}
                placeholder={"Enter your response"}
                {...field}
                onBlur={field.onBlur}
              />
            )}
          />
        );
      case FormQuestionType.SINGLE_SELECT:
        return (
          <Controller
            key={index}
            name={`responses.${index}.response`}
            control={control}
            render={({ field }) => (
              <RadioGroup
                label={question.question}
                value={
                  field.value === null ? null : assertAsString(field.value)
                }
                onChange={(value) => {
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
              >
                {question.metadata?.choices.map((choice) => (
                  <Radio key={choice} value={choice} label={choice} pt={"xs"} />
                ))}
              </RadioGroup>
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
              <CheckboxGroup
                label={question.question}
                value={assertAsStringArray(field.value)}
                onChange={(values) => {
                  field.onChange(values);
                }}
                onBlur={field.onBlur}
              >
                {question.metadata?.choices.map((choice) => (
                  <Checkbox
                    key={choice}
                    value={choice}
                    label={choice}
                    pt={"xs"}
                  />
                ))}
              </CheckboxGroup>
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
            <Stack mt={"xl"}>
              {renderQuestion(question, index)}
              {errors.responses?.[index]?.response && (
                <Text c="red" size="sm">
                  {errors.responses?.[index]?.response?.message}
                </Text>
              )}
            </Stack>
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
          <Button type="submit" disabled={!isCurrentStepValid()}>
            Submit
          </Button>
        ) : (
          <Button onClick={nextStep} disabled={!isCurrentStepValid()}>
            Next
          </Button>
        )}
      </Group>
    </form>
  );
}
