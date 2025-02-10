"use client";

import { useParams } from "next/navigation";
import { findOne, strictParseInt } from "~/utils";
import { WithLocalNavigationHeader } from "~/client/components/WithLocalNavigationHeader";
import React from "react";
import {
  Box,
  Checkbox,
  Paper,
  PaperProps,
  Radio,
  Stack,
  Textarea,
  TextInput,
  Title,
  Text
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { FormQuestionType, FormResponse } from "~/server/service/types/form";

interface ApplicationResponsesSectionProps {
  userId: number;
  clubId: number;
}

function ApplicationResponsesSection({
  userId,
  clubId,
  ...props
}: ApplicationResponsesSectionProps & PaperProps) {
  const r = api.main.membershipApplicationsForClub.useQuery({ clubId });

  QueryError.check({
    result: r,
    fieldName: "membershipApplicationsForClub"
  });

  if (!isLoaded(r)) {
    return null;
  }

  const userApplication = findOne(r.data!, (m) => m.user.id === userId);

  const renderResponse = (response: FormResponse) => {
    switch (response.type) {
      case FormQuestionType.SHORT_TEXT:
        return (
          <TextInput
            label={response.question}
            value={response.response}
            readOnly
          />
        );
      case FormQuestionType.LONG_TEXT:
        return (
          <Textarea
            label={response.question}
            value={response.response}
            readOnly
          />
        );
      case FormQuestionType.SINGLE_SELECT:
        return (
          <Radio.Group label={response.question} value={response.response}>
            {response.metadata.choices.map((choice, index) => (
              <Radio key={index} value={choice} label={choice} disabled />
            ))}
          </Radio.Group>
        );
      case FormQuestionType.MULTI_SELECT:
        return (
          <Checkbox.Group label={response.question} value={response.response}>
            {response.metadata.choices.map((choice, index) => (
              <Checkbox key={index} value={choice} label={choice} disabled />
            ))}
          </Checkbox.Group>
        );
      default:
        return null;
    }
  };

  return (
    <Paper withBorder p={"lg"} {...props}>
      <Stack>
        <Title order={4}>Application Responses</Title>
        {userApplication.applicationResponses.responses.length === 0 ? (
          <Text mt={5} size={"sm"} c={"dimmed"}>
            No responses were given. This is likely because you had no intake
            questions.
          </Text>
        ) : (
          userApplication.applicationResponses.responses.map(
            (response, index) => (
              <Box key={index} mb={20}>
                {renderResponse(response)}
              </Box>
            )
          )
        )}
      </Stack>
    </Paper>
  );
}

export default function MemberApplication() {
  const params = useParams<{ userId: string; clubId: string }>();
  const userId = strictParseInt(params.userId);
  const clubId = strictParseInt(params.clubId);

  return (
    <WithLocalNavigationHeader>
      <ApplicationResponsesSection userId={userId} clubId={clubId} />
    </WithLocalNavigationHeader>
  );
}
