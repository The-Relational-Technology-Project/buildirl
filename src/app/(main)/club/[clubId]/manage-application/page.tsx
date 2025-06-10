"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import React from "react";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { membershipForClub } from "~/utils/types";
import { handleDefaultMutationError } from "~/client/logger";
import { strictParseInt } from "~/utils";
import MembershipInfoCard from "~/app/(main)/club/[clubId]/member/_components/MembershipInfoCard";
import { 
  Button, 
  Stack, 
  Title, 
  Paper, 
  Text,
  Box,
  TextInput,
  Textarea,
  Radio,
  Checkbox
} from "@mantine/core";
import { FormQuestionType, FormResponse } from "~/server/club/types/form";
import { Membership } from "~/server/membership/types";

//TODO Pull out ApplicationResponsesCard from src/club/[clubId]/member/[userId]/application/page.tsx
// and create a generalized component. 
type ApplicationResponsesCardProps = {
  membership: Membership;
};

function ApplicationResponsesCard({
  membership
}: ApplicationResponsesCardProps) {
  const renderResponse = (response: FormResponse) => {
    switch (response.type) {
      case FormQuestionType.SHORT_TEXT:
        return (
          <TextInput
            label={response.question}
            value={response.response}
            disabled
            readOnly
          />
        );
      case FormQuestionType.LONG_TEXT:
        return (
          <Textarea
            label={response.question}
            value={response.response}
            disabled
            readOnly
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
                  disabled
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
                  disabled
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

function WithdrawApplicationSection({ membership }: { membership: Membership }) {
  const router = useRouter();
  const utils = api.useUtils();
  
  const withdrawMembership = api.main.withdrawMembershipApplication.useMutation({
    onSuccess: async () => {
      await utils.main.userMemberships.invalidate();
      router.push(`/join/${membership.club.publicId}`);
    },
    onError: handleDefaultMutationError
  });

  const handleWithdraw = () => {
    if (
      window.confirm(
        "Are you sure you want to withdraw your application? This action cannot be undone and you will need to submit a new application if you wish to join the club.."
      )
    ) {
      withdrawMembership.mutate({ membershipId: membership.id });
    }
  };

  return (
    <Paper p={"xl"}>
      <Stack gap="lg">
        <Title order={4} fw={500}>
          Actions
        </Title>
        <Text size="sm">
          If you no longer wish to join this club, you can withdraw your application below.
        </Text>
        <Button
          color="red"
          size="sm"
          onClick={handleWithdraw}
          loading={withdrawMembership.isPending}
        >
          Withdraw
        </Button>
      </Stack>
    </Paper>
  );
}

export default function ManageApplication() {
  const params = useParams<{ clubId: string }>();
  const clubId = strictParseInt(params.clubId);

  const userMemberships = api.main.userMemberships.useQuery();

  QueryError.check({
    result: userMemberships,
    fieldName: "userMemberships"
  });

  if (!isLoaded(userMemberships)) {
    return null;
  }

  const membership = membershipForClub(userMemberships.data!, clubId);

  if (!membership || (membership.status !== "PENDING" && membership.status !== "PENDING_INCOMPLETE")) {
    const clubPublicId = membership?.club.publicId || "";
    return (
      <WithLocalNavigationHeader navigateTo={`/join/${clubPublicId}`}>
        <Stack align="center" py="xl">
          <Title order={3}>No Pending Application</Title>
          <Text>You don&apos;t have a pending application for this club.</Text>
        </Stack>
      </WithLocalNavigationHeader>
    );
  }

  const club = membership.club;

  return (
    <WithLocalNavigationHeader navigateTo={`/join/${club.publicId}`}>
      <Stack gap="xl" pb="xl">
        <Title order={2} ta="center">
          Manage Your {club.name} Application
        </Title>

        <MembershipInfoCard membership={membership} />

        <ApplicationResponsesCard membership={membership} />

        <WithdrawApplicationSection membership={membership} />
      </Stack>
    </WithLocalNavigationHeader>
  );
} 