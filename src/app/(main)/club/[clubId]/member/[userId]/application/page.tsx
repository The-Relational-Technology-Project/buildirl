"use client";

import { useParams, useRouter } from "next/navigation";
import { strictParseInt } from "~/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import React from "react";
import {
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Radio,
  Checkbox
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { FormQuestionType, FormResponse } from "~/server/club/types/form";
import { Membership } from "~/server/membership/types";
import UserProfile from "~/client/components/UserProfile";
import { handleDefaultMutationError } from "~/client/logger";
import { Maybe } from "~/utils/types";
import MembershipInfoCard from "~/app/(main)/club/[clubId]/member/_components/MembershipInfoCard";

function findUserMembership(
  userId: number,
  membershipApplications: Membership[],
  activeMemberships: Membership[]
): Maybe<Membership> {
  return (
    [...membershipApplications, ...activeMemberships].find(
      (mem) => mem.user.id === userId
    ) || null
  );
}

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

type PendingMembershipCardProps = {
  clubId: number;
  membership: Membership;
};

function PendingMembershipCard({
  clubId,
  membership
}: PendingMembershipCardProps) {
  const utils = api.useUtils();
  const router = useRouter();

  const approveMembershipApplication =
    api.main.approveMembershipApplication.useMutation({
      onSuccess: async () => {
        await utils.main.membershipApplicationsForClub.invalidate({ clubId });
        await utils.main.activeMembershipsForClubWithEmail.invalidate({
          clubId
        });
        await utils.main.clubStatistics.invalidate({ clubId });
        router.push(`/club/${clubId}/manage?tab=people`);
      },
      onError: handleDefaultMutationError
    });

  const declineMembershipApplication =
    api.main.declineMembershipApplication.useMutation({
      onSuccess: async () => {
        await utils.main.membershipApplicationsForClub.invalidate({ clubId });
        router.push(`/club/${clubId}/manage?tab=people`);
      },
      onError: handleDefaultMutationError
    });

  const handleApproveMembership = async () => {
    if (
      window.confirm(
        "Ready to approve this application? Don't forget to review the application intake form before approving."
      )
    ) {
      await approveMembershipApplication.mutateAsync({
        membershipId: membership.id
      });
    }
  };

  const handleDeclineMembership = async () => {
    if (
      window.confirm(
        "Are you sure you want to decline this application? This action cannot be undone."
      )
    ) {
      await declineMembershipApplication.mutateAsync({
        membershipId: membership.id
      });
    }
  };

  return (
    <Paper p="xl">
      <Stack gap="lg">
        <Title order={4} fw={500}>
          Actions
        </Title>
        <Text size="sm">
          Review this application and decide whether to approve or decline
          membership.
        </Text>
        <Group grow>
          <Button
            color="green"
            size="sm"
            onClick={handleApproveMembership}
            loading={approveMembershipApplication.isPending}
          >
            Approve
          </Button>
          <Button
            color="red"
            size="sm"
            onClick={handleDeclineMembership}
            loading={declineMembershipApplication.isPending}
          >
            Decline
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

type ActiveMembershipCardProps = {
  clubId: number;
  membership: Membership;
};

function ActiveMembershipCard({
  clubId,
  membership
}: ActiveMembershipCardProps) {
  const utils = api.useUtils();
  const router = useRouter();

  const deactivateMembership = api.main.deactivateMembership.useMutation({
    onSuccess: async () => {
      await utils.main.activeMembershipsForClubWithEmail.invalidate({ clubId });
      await utils.main.clubStatistics.invalidate({ clubId });
      router.push(`/club/${clubId}/manage?tab=people`);
    },
    onError: handleDefaultMutationError
  });

  const handleCancelMembership = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel this membership? This action cannot be undone."
      )
    ) {
      deactivateMembership.mutateAsync({
        membershipId: membership.id,
        input: { byClubOwner: true }
      });
    }
  };

  return (
    <Paper p="xl">
      <Stack gap="lg">
        <Title order={4} fw={500}>
          Actions
        </Title>
        <Text size="sm">
          This member is currently active. You can cancel their membership if
          needed.
        </Text>
        <Button
          color="red"
          size="sm"
          onClick={handleCancelMembership}
          loading={deactivateMembership.isPending}
        >
          Cancel Membership
        </Button>
      </Stack>
    </Paper>
  );
}

export default function MemberApplication() {
  const params = useParams<{ userId: string; clubId: string }>();
  const userId = strictParseInt(params.userId);
  const clubId = strictParseInt(params.clubId);

  const membershipApplicationsQuery =
    api.main.membershipApplicationsForClub.useQuery({ clubId });
  const activeMembershipsQuery =
    api.main.activeMembershipsForClubWithEmail.useQuery({ clubId });
  const userQuery = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: membershipApplicationsQuery,
    fieldName: "membershipApplicationsForClub"
  });
  QueryError.check({
    result: activeMembershipsQuery,
    fieldName: "activeMembershipsForClubWithEmail"
  });
  QueryError.check({
    result: userQuery,
    fieldName: "userById"
  });

  if (
    !isAllLoaded([
      membershipApplicationsQuery,
      activeMembershipsQuery,
      userQuery
    ])
  ) {
    return null;
  }

  const userMembership = findUserMembership(
    userId,
    membershipApplicationsQuery.data!,
    activeMembershipsQuery.data!
  );

  const pendingMembership = membershipApplicationsQuery.data!.find(
    (mem) => mem.user.id === userId
  );
  const activeMembership = activeMembershipsQuery.data!.find(
    (mem) => mem.user.id === userId
  );

  if (!userMembership) {
    return null;
  }

  return (
    <WithLocalNavigationHeader>
      {/* include this at the top so the reviewer does not miss it */}
      <Stack gap="xl" pb="xl">
        {pendingMembership && (
          <PendingMembershipCard
            clubId={clubId}
            membership={pendingMembership}
          />
        )}

        <UserProfile
          user={userQuery.data!}
          size="lg"
          variant="member"
          showClickable={false}
        />

        <MembershipInfoCard membership={userMembership} />

        <ApplicationResponsesCard membership={userMembership} />

        {activeMembership && (
          <ActiveMembershipCard clubId={clubId} membership={activeMembership} />
        )}
      </Stack>
    </WithLocalNavigationHeader>
  );
}
