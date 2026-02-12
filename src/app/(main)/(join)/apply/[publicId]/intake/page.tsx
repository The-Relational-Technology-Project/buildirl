"use client";

import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Checkbox,
  CheckboxGroup,
  Group,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Stepper,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import {
  FormQuestion,
  FormQuestions,
  FormQuestionType,
  FormResponse,
  FormResponses,
  FormResponsesSchema
} from "~/server/club/types/form";
import { assertAsString, assertAsStringArray, strictParseInt } from "~/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import PrimaryButton from "~/client/components/PrimaryButton";
import SecondaryButton from "~/client/components/SecondaryButton";
import HideablePaper from "~/client/components/HideablePaper";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { idAsBigInt, isDefaultFreeTier, membershipTier } from "~/utils/types";
import { handleDefaultMutationError } from "~/client/logger";

type ShareEmailQuestionProp = {
  shareEmail: boolean;
  setShareEmail: (shareEmail: boolean) => void;
};

function ShareEmailQuestion({
  shareEmail,
  setShareEmail
}: ShareEmailQuestionProp) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const accentColor = isDark
    ? theme.colors.lilac?.[2] ?? "#d7d0ff"
    : theme.colors.lilac?.[7] ?? "#6850b7";
  const bodyTextColor = isDark ? theme.other.dark.text : undefined;
  const mutedTextColor = isDark ? theme.other.dark.textMuted : "dimmed";
  const offTrackStyle = isDark
    ? {
        backgroundColor: theme.other.dark.surfaceHighlight,
        border: `1px solid ${theme.other.dark.borderStrong}`
      }
    : undefined;

  return (
    <Stack>
      <Text fw={500} c={bodyTextColor}>
        Share your email
      </Text>
      <Text size="sm" c={mutedTextColor}>
        This will allow club managers to reach out to you with more information
        on getting involved with the club.
      </Text>
      <Switch
        color={accentColor}
        checked={shareEmail}
        onChange={(event) => setShareEmail(event.currentTarget.checked)}
        label="Acknowledge"
        mt="md"
        styles={{
          track: {
            ...(shareEmail ? {} : (offTrackStyle ?? {}))
          }
        }}
      />
    </Stack>
  );
}

export default function IntakePage() {
  const params = useParams<{ publicId: string }>();
  const searchParams = useSearchParams();
  const membershipTierId = strictParseInt(searchParams.get("membershipTierId"));

  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  if (!isLoaded(club)) {
    return;
  }

  const defaultFreeTier = isDefaultFreeTier(
    membershipTier(club.data!, membershipTierId)
  );

  return (
    <Stack pt={"xl"} px={{ base: undefined, md: 180 }}>
      <WithLocalNavigationHeader>
        <ApplicationForm
          applicationQuestions={club.data!.applicationQuestions}
          membershipTierId={membershipTierId}
          isDefaultFreeTier={defaultFreeTier}
          clubPublicId={params.publicId}
        />
      </WithLocalNavigationHeader>
    </Stack>
  );
}

type ApplicationFormProps = {
  applicationQuestions: FormQuestions;
  membershipTierId: number;
  isDefaultFreeTier: boolean;
  clubPublicId: string;
};

function ApplicationForm({
  applicationQuestions,
  membershipTierId,
  isDefaultFreeTier,
  clubPublicId
}: ApplicationFormProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const accentColor = isDark
    ? theme.colors.lilac?.[2] ?? "#d7d0ff"
    : theme.colors.lilac?.[7] ?? "#6850b7";
  const errorColor = isDark ? theme.colors.red[4] : theme.colors.red[7];
  const sectionBorder = isDark
    ? `1px solid ${theme.other.dark.borderStrong}`
    : "2px solid #000";
  const sectionShadow = isDark
    ? `6px 6px 0px ${theme.other.dark.shadow}`
    : "6px 6px 0px #000";
  const sectionBackground = isDark
    ? theme.other.dark.surface
    : (theme.colors.beige?.[1] ?? "#fffdf2");
  const sectionTextColor = isDark ? theme.other.dark.text : undefined;
  const sectionBorderRadius = 15;

  const [activeStep, setActiveStep] = useState(0);
  const [shareEmail, setShareEmail] = useState(false);

  const utils = api.useUtils();
  const router = useRouter();

  const submitMembershipApplication =
    api.main.submitMembershipApplication.useMutation({
      onSuccess: (r) => {
        utils.main.userMemberships.invalidate();
        router.push(
          isDefaultFreeTier
            ? `/apply/${clubPublicId}/completed`
            : `/apply/${clubPublicId}/payments?membershipId=${idAsBigInt(r.createdEntityId)}`
        );
      },
      onError: handleDefaultMutationError
    });

  // +1 for the share email question
  const totalQuestions = applicationQuestions.questions.length + 1;

  const {
    handleSubmit,
    control,
    formState: { errors, touchedFields, dirtyFields }
  } = useForm<FormResponses>({
    resolver: zodResolver(FormResponsesSchema),
    defaultValues: {
      responses: applicationQuestions.questions.map((question) =>
        defaultResponse(question)
      )
    },
    // required to ensure validation is run on first touch
    mode: "all"
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

  const isCurrentQuestionValid = () => {
    // question is valid only if validation has run after touch/change
    // and there are no errors
    const isValidated =
      touchedFields.responses?.[activeStep]?.response ||
      dirtyFields.responses?.[activeStep]?.response;
    const hasErrors = !!errors.responses?.[activeStep]?.response;
    return isValidated && !hasErrors;
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
                placeholder={"Enter your response"}
                {...field}
                rows={8}
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
                value={
                  field.value === null ? null : assertAsString(field.value)
                }
                onChange={(value) => {
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
              >
                {question.metadata?.choices.map((choice) => (
                  <Radio
                    key={choice}
                    value={choice}
                    label={choice}
                    pt={"xs"}
                    color={accentColor}
                  />
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
                    color={accentColor}
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
      <HideablePaper
        hidden={totalQuestions === 1}
        bg={sectionBackground}
        p="md"
        style={{
          border: sectionBorder,
          boxShadow: sectionShadow,
          borderRadius: sectionBorderRadius,
          color: sectionTextColor
        }}
      >
        <Stepper
          color={accentColor}
          active={activeStep + 1}
          hidden={totalQuestions === 1}
          // hacky way to get the stepper to look like a bar!
          styles={{
            separator: {
              border: "none",
              // this covers gap; but it also covers the left border by 1px
              // ¯\_(ツ)_/¯ it's what we get for being hacky/lazy to create this bar
              marginLeft: -1,
              marginRight: 0,
              height: 20
            },
            stepIcon: {
              display: "none"
            }
          }}
        >
          {applicationQuestions.questions.map((_, index) => (
            <Stepper.Step key={index} />
          ))}
          <Stepper.Step key={applicationQuestions.questions.length + 1} />
          {/* hacky but we want the stepper to not be filled on the last question */}
          <Stepper.Step key={applicationQuestions.questions.length + 2} />
        </Stepper>
      </HideablePaper>

      <Paper
        p={"xl"}
        mt={"xl"}
        style={{
          backgroundColor: sectionBackground,
          border: sectionBorder,
          boxShadow: sectionShadow,
          borderRadius: sectionBorderRadius,
          color: sectionTextColor
        }}
      >
        {activeStep < applicationQuestions.questions.length ? (
          <Stack gap={4}>
            <Title order={4} c={accentColor} mb={"md"}>
              {applicationQuestions.questions[activeStep]!.question}
            </Title>
            {renderQuestion(
              applicationQuestions.questions[activeStep]!,
              activeStep
            )}
            {errors.responses?.[activeStep]?.response && (
              <Text c={errorColor} size="sm">
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
            <SecondaryButton
              size="sm"
              w="auto"
              px={28}
              py={6}
              onClick={prevStep}
            >
              Back
            </SecondaryButton>
          )}
          {activeStep === totalQuestions - 1 ? (
            // for now, this is hardcoded assuming share email
            // is always the last question
            <PrimaryButton
              type="submit"
              size="sm"
              w="auto"
              px={28}
              py={6}
              shadowScale={0.6}
              fz={{ base: "sm", md: "md" }}
              disabled={!shareEmail}
            >
              {isDefaultFreeTier ? "Submit" : "Next"}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              size="sm"
              w="auto"
              px={28}
              py={6}
              shadowScale={0.6}
              fz={{ base: "sm", md: "md" }}
              onClick={nextStep}
              disabled={!isCurrentQuestionValid()}
            >
              Next
            </PrimaryButton>
          )}
        </Group>
      </Paper>
    </form>
  );
}
