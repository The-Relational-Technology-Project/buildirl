import React from "react";
import {
  Box,
  Checkbox,
  Radio,
  Stack,
  Textarea,
  TextInput
} from "@mantine/core";
import { FormQuestionType, FormResponse } from "~/server/service/types/form";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { findOne } from "~/utils";

interface ApplicationResponsesSectionProps {
  userId: number;
  clubId: number;
}

export function ApplicationResponsesSection({
  userId,
  clubId
}: ApplicationResponsesSectionProps) {
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
    <Stack>
      {userApplication.applicationResponses.responses.map((response, index) => (
        <Box key={index} mb={20}>
          {renderResponse(response)}
        </Box>
      ))}
    </Stack>
  );
}
