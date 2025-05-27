"use client";

import { useParams, useRouter } from "next/navigation";
import { strictParseInt } from "~/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import React from "react";
import {
  Box,
  Button,
  Grid,
  Group,
  Paper,
  PaperProps,
  Stack,
  Text,
  Title,
  Divider,
  Badge,
  useMantineTheme,
  useMantineColorScheme
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { FormQuestionType, FormResponse } from "~/server/club/types/form";
import { Membership } from "~/server/membership/types";
import { User } from "~/server/user/types";
import UserAvatar from "~/client/components/UserAvatar";
import { toDisplayDate } from "~/client/utils";
import { IconMail, IconCalendar, IconCoin } from "@tabler/icons-react";
import { handleDefaultMutationError } from "~/client/logger";
import { useMounted } from "@mantine/hooks";


function findUserMembership(
  userId: number,
  membershipApplications: Membership[],
  activeMemberships: Membership[]
): Membership | null {
  return [...membershipApplications, ...activeMemberships].find(
    (mem) => mem.user.id === userId
  ) || null;
}


function isMembershipPending(userId: number, membershipApplications: Membership[]): boolean {
  return membershipApplications.some(mem => mem.user.id === userId);
}

type MemberProfileCardProps = {
  membership: Membership;
  isPending: boolean;
  user: User;
};

function MemberProfileCard({ membership, isPending, user, ...props }: MemberProfileCardProps & PaperProps) {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  return (
    <Paper p="xl" {...props}>
      <Stack gap="lg">
        {/* Profile Header */}
        <Group align="flex-start" gap="lg">
          <Box 
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/user/${user.id}?back=true`)}
          >
            <UserAvatar size="xl" user={user} />
          </Box>
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group align="center" gap="md">
              <Title 
                order={2} 
                fw={600}
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/user/${user.id}?back=true`)}
              >
                {user.firstName} {user.lastName}
              </Title>
              <Badge 
                color={isPending ? "yellow" : "green"} 
                variant="light"
                size="lg"
              >
                {isPending ? "Pending" : "Active Member"}
              </Badge>
            </Group>
            {user.description !== "" && (
              <Text size="md" c="dimmed" lineClamp={3}>
                {user.description}
              </Text>
            )}
          </Stack>
        </Group>

        <Divider />

        {/* Member Details */}
        <Stack gap="md">
          <Title order={4} fw={500}>Member Information</Title>
          
          <Grid gutter="md">
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconCoin size={18} color={colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6]} />
                <Text size="sm" fw={500}>Tier:</Text>
              </Group>
              <Text size="md" mt={4}>{membership.membershipTier.name}</Text>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconCoin size={18} color={colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6]} />
                <Text size="sm" fw={500}>Contribution:</Text>
              </Group>
              <Text size="md" mt={4}>${membership.membershipTier.costPerMonthInUSD}.00/month</Text>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconCalendar size={18} color={colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6]} />
                <Text size="sm" fw={500}>{isPending ? "Applied:" : "Joined:"}</Text>
              </Group>
              <Text size="md" mt={4}>{toDisplayDate(membership.createdAt)}</Text>
            </Grid.Col>
            
            {membership.email && (
              <Grid.Col span={6}>
                <Group gap="xs">
                  <IconMail size={18} color={colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6]} />
                  <Text size="sm" fw={500}>Email:</Text>
                </Group>
                <Box 
                  component="a" 
                  href={`mailto:${membership.email}`} 
                  style={{ color: "inherit", cursor: "pointer", textDecoration: "none" }}
                  mt={4}
                >
                  <Text size="md" style={{ wordBreak: "break-all" }}>
                    {membership.email}
                  </Text>
                </Box>
              </Grid.Col>
            )}
          </Grid>
        </Stack>
      </Stack>
    </Paper>
  );
}

type MemberActionsCardProps = {
  clubId: number;
  pendingMembership?: Membership;
  activeMembership?: Membership;
};

function MemberActionsCard({ clubId, pendingMembership, activeMembership, ...props }: MemberActionsCardProps & PaperProps) {
  const utils = api.useUtils();
  const router = useRouter();

  const approveMembershipApplication =
    api.main.approveMembershipApplication.useMutation({
      onSuccess: async () => {
        await utils.main.membershipApplicationsForClub.invalidate({ clubId });
        await utils.main.activeMembershipsForClubWithEmail.invalidate({ clubId });
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

  const deactivateMembership = api.main.deactivateMembership.useMutation({
    onSuccess: async () => {
      await utils.main.activeMembershipsForClubWithEmail.invalidate({ clubId });
      await utils.main.clubStatistics.invalidate({ clubId });
      router.push(`/club/${clubId}/manage?tab=people`);
    },
    onError: handleDefaultMutationError
  });

  const handleApproveMembership = () => {
    if (!pendingMembership) return;
    if (
      window.confirm(
        "Ready to approve this application? Don't forget to review the application intake form before approving."
      )
    ) {
      approveMembershipApplication.mutateAsync({
        membershipId: pendingMembership.id
      });
    }
  };

  const handleDeclineMembership = () => {
    if (!pendingMembership) return;
    if (
      window.confirm(
        "Are you sure you want to decline this application? This action cannot be undone."
      )
    ) {
      declineMembershipApplication.mutateAsync({
        membershipId: pendingMembership.id
      });
    }
  };

  const handleCancelMembership = () => {
    if (!activeMembership) return;
    if (
      window.confirm(
        "Are you sure you want to cancel this membership? This action cannot be undone."
      )
    ) {
      deactivateMembership.mutateAsync({
        membershipId: activeMembership.id,
        input: { byClubOwner: true }
      });
    }
  };

  if (!pendingMembership && !activeMembership) {
    return null;
  }

  return (
    <Paper p="xl" {...props}>
      <Stack gap="lg">
        <Title order={4} fw={500}>Actions</Title>
        
        {pendingMembership && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Review this application and decide whether to approve or decline membership.
            </Text>
            <Stack gap="md">
              <Button
                color="green"
                size="lg"
                fullWidth
                onClick={handleApproveMembership}
                loading={approveMembershipApplication.isPending}
              >
                Approve
              </Button>
              <Button
                color="red"
                variant="outline"
                size="lg"
                fullWidth
                onClick={handleDeclineMembership}
                loading={declineMembershipApplication.isPending}
              >
                Decline
              </Button>
            </Stack>
          </Stack>
        )}

        {activeMembership && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              This member is currently active. You can cancel their membership if needed.
            </Text>
            <Button
              color="red"
              size="lg"
              variant="outline"
              fullWidth
              onClick={handleCancelMembership}
              loading={deactivateMembership.isPending}
            >
              Cancel Membership
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

type ApplicationResponsesCardProps = {
  membership: Membership;
};

function ApplicationResponsesCard({
  membership,
  ...props
}: ApplicationResponsesCardProps & PaperProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const renderResponse = (response: FormResponse) => {
    const responseBoxStyle = {
      backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0],
      border: "1px solid",
      borderColor: colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]
    };

    switch (response.type) {
      case FormQuestionType.SHORT_TEXT:
        return (
          <Box>
            <Text size="sm" fw={500} mb="xs">{response.question}</Text>
            <Text size="sm" p="sm" style={responseBoxStyle}>
              {response.response}
            </Text>
          </Box>
        );
      case FormQuestionType.LONG_TEXT:
        return (
          <Box>
            <Text size="sm" fw={500} mb="xs">{response.question}</Text>
            <Text size="sm" p="sm" style={{ ...responseBoxStyle, whiteSpace: "pre-wrap" }}>
              {response.response}
            </Text>
          </Box>
        );
      case FormQuestionType.SINGLE_SELECT:
        return (
          <Box>
            <Text size="sm" fw={500} mb="xs">{response.question}</Text>
            <Text size="sm" p="sm" style={responseBoxStyle}>
              {response.response}
            </Text>
          </Box>
        );
      case FormQuestionType.MULTI_SELECT:
        return (
          <Box>
            <Text size="sm" fw={500} mb="xs">{response.question}</Text>
            <Text size="sm" p="sm" style={responseBoxStyle}>
              {Array.isArray(response.response) ? response.response.join(", ") : response.response}
            </Text>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Paper p="xl" {...props}>
      <Stack gap="lg">
        <Title order={4} fw={500}>Application Q&A</Title>

        {membership.applicationResponses.responses.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No application questions were answered. This likely means there were no intake questions configured.
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

export default function MemberApplication() {
  const params = useParams<{ userId: string; clubId: string }>();
  const userId = strictParseInt(params.userId);
  const clubId = strictParseInt(params.clubId);
  const mounted = useMounted();

  const membershipApplicationsQuery = api.main.membershipApplicationsForClub.useQuery({ clubId });
  const activeMembershipsQuery = api.main.activeMembershipsForClubWithEmail.useQuery({ clubId });
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

  if (!isAllLoaded([membershipApplicationsQuery, activeMembershipsQuery, userQuery])) {
    return null;
  }

  const userMembership = findUserMembership(
    userId,
    membershipApplicationsQuery.data!,
    activeMembershipsQuery.data!
  );

  const isPending = isMembershipPending(userId, membershipApplicationsQuery.data!);
  
  const pendingMembership = membershipApplicationsQuery.data!.find((mem) => mem.user.id === userId);
  const activeMembership = activeMembershipsQuery.data!.find((mem) => mem.user.id === userId);

  if (!userMembership) {
    return (
      mounted && (
        <WithLocalNavigationHeader>
          <Stack align="center" gap="lg" py="xl">
            <Text size="lg" c="dimmed" ta="center">
              No membership found for this user.
            </Text>
          </Stack>
        </WithLocalNavigationHeader>
      )
    );
  }

  return (
    mounted && (
      <WithLocalNavigationHeader>
        <Grid gutter="lg">
          {/* Left Column - Profile & Actions */}
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Stack gap="lg">
              <MemberProfileCard 
                membership={userMembership}
                isPending={isPending}
                user={userQuery.data!}
              />
              <MemberActionsCard 
                clubId={clubId} 
                pendingMembership={pendingMembership}
                activeMembership={activeMembership}
              />
            </Stack>
          </Grid.Col>

          {/* Right Column - Application Q&A */}
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <ApplicationResponsesCard 
              membership={userMembership}
            />
          </Grid.Col>
        </Grid>
      </WithLocalNavigationHeader>
    )
  );
}
