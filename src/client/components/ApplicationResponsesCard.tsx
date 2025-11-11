import React from "react";
import {
  Box,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Radio,
  Checkbox
} from "@mantine/core";
import { FormQuestionType, FormResponse } from "~/server/club/types/form";
import { Membership } from "~/server/membership/types";

type ApplicationResponsesCardProps = {
  membership: Membership;
};

export default function ApplicationResponsesCard({
  membership
}: ApplicationResponsesCardProps) {
  const grayedStyles = {
    input: {
      backgroundColor: "var(--mantine-color-gray-1)",
      color: "var(--mantine-color-gray109)",
      cursor: "not-allowed",
      "&:focus": {
        borderColor: "var(--mantine-color-gray-4)"
      }
    }
  };

  const renderResponse = (response: FormResponse) => {
    switch (response.type) {
      case FormQuestionType.SHORT_TEXT:
        return (
          <TextInput
            label={response.question}
            value={response.response}
            styles={grayedStyles}
            readOnly
          />
        );
      case FormQuestionType.LONG_TEXT:
        return (
          <Textarea
            label={response.question}
            value={response.response}
            styles={grayedStyles}
            readOnly
            disabled
            autosize
          />
        );
      case FormQuestionType.SINGLE_SELECT:
        return (
          <Box>
            <Radio.Group label={response.question} value={response.response}>
              {response.metadata?.choices?.map((choice, index) => (
                <Radio
                  key={index}
                  value={choice}
                  label={choice}
                  pt="xs"
                  style={grayedStyles}
                />
              ))}
            </Radio.Group>
          </Box>
        );
      case FormQuestionType.MULTI_SELECT:
        return (
          <Box>
            <Checkbox.Group label={response.question} value={response.response}>
              {response.metadata.choices.map((choice, index) => (
                <Checkbox
                  key={index}
                  value={choice}
                  label={choice}
                  pt={"xs"}
                  styles={grayedStyles}
                />
              ))}
            </Checkbox.Group>
          </Box>
        );
      default:
        throw new Error(`unsupported type`);
    }
  };

  return (
    <Paper p={"xl"}>
      <Stack gap="lg">
        <Title order={4} fw={500}>
          Application Q&A
        </Title>

        {membership.applicationResponses.responses.length === 0 ? (
          <Text size="sm" ta="center" py="xl">
            No responses were given. This is likely because you had no intake
            questions.
          </Text>
        ) : (
          <Stack gap="lg">
            {membership.applicationResponses.responses.map(
              (response: FormResponse, index: number) => (
                <Box key={index}>{renderResponse(response)}</Box>
              )
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
