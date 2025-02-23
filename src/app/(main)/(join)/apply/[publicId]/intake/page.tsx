"use client";

import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Center,
  Checkbox,
  CheckboxGroup,
  Flex,
  Group,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Stepper,
  Switch,
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

type ShareEmailQuestionProp = {
  shareEmail: boolean;
  setShareEmail: (shareEmail: boolean) => void;
};

function ShareEmailQuestion({
  shareEmail,
  setShareEmail
}: ShareEmailQuestionProp) {
  return (
    <Stack>
      <Text fw={500}>Share your email</Text>
      <Text size="sm">
        This will allow club managers to reach out to you with more information
        on getting involved with the club.
      </Text>
      <Switch
        checked={shareEmail}
        onChange={(event) => setShareEmail(event.currentTarget.checked)}
        label="Acknowledge"
        mt="md"
      />
    </Stack>
  );
}

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
  const [shareEmail, setShareEmail] = useState(false);

  const utils = api.useUtils();
  const router = useRouter();

  const submitMembershipApplication =
    api.main.submitMembershipApplication.useMutation({
      onSuccess: () => {
        utils.main.userMemberships.invalidate();
        router.push(`/apply/${clubPublicId}/completed`);
      }
    });

  // +1 for the share email question
  const totalQuestions = applicationQuestions.questions.length + 1;

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
      input: { applicationResponses: responses, shareEmail }
    });
  };

  const nextStep = (e: React.MouseEvent) => {
    // need to be explicit here otherwise this submits the form
    e.preventDefault();
    setActiveStep((current) =>
      current < totalQuestions - 1 ? current + 1 : current
    );
  };
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
            key={index}
            name={`responses.${index}.response`}
            control={control}
            render={({ field }) => (
              <TextInput
                key={index}
                label={question.question}
                placeholder={"Enter your response"}
                {...field}
                onBlur={field.onBlur}
              />
            )}
          />
        );
      case FormQuestionType.LONG_TEXT:
        return (
          <Controller
            key={index}
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
      <Stepper
        size="xs"
        color="violet"
        active={activeStep}
        hidden={totalQuestions === 1}
      >
        {applicationQuestions.questions.map((_, index) => (
          <Stepper.Step key={index} />
        ))}
        <Stepper.Step key={applicationQuestions.questions.length + 1} />
      </Stepper>

      <Paper p={"xl"} mt={"xl"}>
        {activeStep < applicationQuestions.questions.length ? (
          <Stack gap={4}>
            {renderQuestion(
              applicationQuestions.questions[activeStep]!,
              activeStep
            )}
            {errors.responses?.[activeStep]?.response && (
              <Text c="red" size="sm">
                {errors.responses?.[activeStep]?.response?.message}
              </Text>
            )}
          </Stack>
        ) : (
          <ShareEmailQuestion
            shareEmail={shareEmail}
            setShareEmail={setShareEmail}
          />
        )}

        <Group mt="xl" justify={"center"}>
          {activeStep > 0 && (
            <Button variant="default" onClick={prevStep}>
              Back
            </Button>
          )}
          {activeStep === totalQuestions - 1 ? (
            // for now, this is hardcoded assuming share email
            // is always the last question
            <Button type="submit" disabled={!shareEmail}>
              Submit
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!isCurrentStepValid()}>
              Next
            </Button>
          )}
        </Group>
      </Paper>
    </form>
  );
}
