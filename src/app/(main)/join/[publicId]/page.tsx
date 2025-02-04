"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Image,
  ActionIcon,
  GroupProps
} from "@mantine/core";
import { IconLink, IconBrandInstagram } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { PAGE_WIDTH } from "~/client/components/HeaderBar";
import { storageClient } from "~/client/utils/storageClient";
import { MemberCountStatistic } from "~/client/components/MemberCountStatistic";
import { Club } from "~/server/service/types";
import { membershipForClub } from "~/utils/types";
import { isUserAuthenticated } from "~/client/utils/auth";

export default function ClubJoin() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const router = useRouter();

  const r = api.main.clubByPublicId.useQuery({
    publicId
  });
  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(r) && (
      <Stack p="sm" maw={PAGE_WIDTH} align={"center"} mt={"md"}>
        <Image
          src={storageClient.clubProfileImageUrl(r.data!.id)}
          fallbackSrc="/club-profile-fallback.png"
          h={250}
          w={250}
          radius={"md"}
          alt={r.data!.name}
        />
        <Stack align={"center"} gap={8}>
          <Title order={1} fw={400}>
            {r.data!.name}
          </Title>

          <MemberCountStatistic clubId={r.data!.id} />

          <Text ta={"center"}>{r.data!.tagLine}</Text>

          <Text
            td={"underline"}
            style={{ cursor: "pointer", fontStyle: "underlined" }}
            onClick={() => router.push(`/join/${publicId}/about`)}
            size="sm"
          >
            {"Read more >"}
          </Text>

          <Group>
            {r.data!.websiteURL && (
              <ActionIcon
                onClick={() => window.open(`${r.data!.websiteURL}`)}
                variant={"white"}
                color={"black"}
              >
                <IconLink size={"md"} />
              </ActionIcon>
            )}

            {r.data!.instagramHandle && (
              <ActionIcon
                onClick={() =>
                  window.open(
                    `https://instagram.com/${r.data!.instagramHandle}`
                  )
                }
                variant={"white"}
                color={"black"}
              >
                <IconBrandInstagram size={"md"} />
              </ActionIcon>
            )}
          </Group>
        </Stack>

        <JoinButton club={r.data!} />

        <ContributingMembersLink
          clubId={r.data!.id}
          clubPublicId={r.data!.publicId}
        />

        {r.data!.eventCalendarURL && (
          <Button
            variant={"outline"}
            onClick={() => window.open(r.data!.eventCalendarURL!)}
            size="md"
            mt={"md"}
          >
            Come to an event
          </Button>
        )}

        <Text mt={"lg"}>Powered by BuildIRL</Text>
      </Stack>
    )
  );
}

type ContributingMembersLinkProps = {
  clubId: number;
  clubPublicId: string;
};

function ContributingMembersLink({
  clubId,
  clubPublicId
}: ContributingMembersLinkProps & GroupProps) {
  const router = useRouter();
  const r = api.main.clubStatistics.useQuery({ clubId: clubId });

  QueryError.check({
    result: r,
    fieldName: "clubStatistics"
  });

  return (
    isLoaded(r) && (
      <Stack align={"center"} gap={"xs"}>
        <Title fw={400} order={2}>
          We are the club
        </Title>
        <Text
          style={{ cursor: "pointer" }}
          onClick={() => router.push(`/join/${clubPublicId}/members`)}
          size="sm"
        >
          {`${r.data!.memberCount} contributing member${r.data!.memberCount > 1 ? "s" : ""} >`}
        </Text>
      </Stack>
    )
  );
}

type JoinButtonProps = {
  club: Club;
};

function JoinButton({ ...props }: JoinButtonProps) {
  const r = api.main.isUserAuthenticated.useQuery();

  QueryError.check({
    result: r,
    fieldName: "isUserAuthenticated"
  });

  if (r.data!) {
    return <AuthenticatedJoinButton {...props} />;
  }
  return <DefaultJoinButton {...props} />;
}

function AuthenticatedJoinButton({ club }: JoinButtonProps) {
  const router = useRouter();
  const r = api.main.userMemberships.useQuery();

  if (!isLoaded(r)) {
    return null;
  }

  const membership = membershipForClub(r.data!, club.id);

  switch (membership?.status) {
    case "PENDING":
      return (
        <Button
          variant={"filled"}
          color={"violet"}
          radius={90}
          onClick={() => router.push(`/apply/${club.publicId}/completed`)}
          size="lg"
        >
          Pending Approval
        </Button>
      );
    case "ACTIVE":
      return (
        <Button
          variant={"filled"}
          color={"violet"}
          radius={90}
          onClick={() => router.push(`/club/${club.id}/manage-membership`)}
          size="lg"
        >
          Manage Membership
        </Button>
      );
    // no membership, declined, or deactivated
    default:
      return (
        <Button
          variant={"filled"}
          color={"violet"}
          radius={90}
          onClick={() => router.push(`/join/${club.publicId}/tiers`)}
          size="lg"
        >
          Join as Member
        </Button>
      );
  }
}

export function DefaultJoinButton({ club }: JoinButtonProps) {
  const router = useRouter();
  return (
    <Button
      variant={"filled"}
      color={"violet"}
      radius={90}
      onClick={() => router.push(`/join/${club.publicId}/tiers`)}
      size="lg"
    >
      Join as Member
    </Button>
  );
}
