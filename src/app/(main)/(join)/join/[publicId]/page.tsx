"use client";

import { useParams, useRouter } from "next/navigation";
import { Stack, Title, Text, Group, Button, GroupProps } from "@mantine/core";
import { IconLink, IconBrandInstagram } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded, isLoaded } from "~/client/utils";
import { PAGE_WIDTH } from "~/client/components/HeaderBar";
import MemberCountStatistic from "~/client/components/MemberCountStatistic";
import { Club } from "~/server/service/types";
import { activeMembershipForClub, membershipForClub } from "~/utils/types";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";
import ClubDisplayImageGallery from "~/app/(main)/(join)/join/[publicId]/_components/ClubDisplayImageGallery";
import ClubImage from "~/client/components/ClubImage";
import ColorSchemeAwareOutlineButton from "~/client/components/ColorSchemeAwareOutlineButton";

export default function ClubJoin() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const router = useRouter();

  const r = api.main.clubByPublicId.useQuery({
    publicId
  });
  const m = api.main.userMemberships.useQuery();

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });
  QueryError.check({
    result: m,
    fieldName: "userMemberships"
  });

  if (!isAllLoaded([r, m])) {
    return null;
  }

  // redirect user to the welcome page if it is their first time on the join page
  // after being accepted!
  const membership = activeMembershipForClub(m.data!, r.data!.id);
  if (membership !== null && !membership.isWelcomed) {
    router.push(`/apply/${publicId}/welcome`);
    return null;
  }

  return (
    <Stack p="sm" maw={PAGE_WIDTH} align={"center"} mt={"md"}>
      <ClubImage club={r.data!} size={250} />
      <Stack align={"center"} gap={8}>
        <Title
          order={1}
          fw={400}
          style={{
            // we only want to apply this theme font family to this heading not all headings
            fontFamily: r.data!.theme?.headingFontFamily ?? "inherit"
          }}
        >
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
          {r.data!.websiteUrl && (
            <ColorSchemeAwareActionIcon
              onClick={() => window.open(`${r.data!.websiteUrl}`)}
              variant={"transparent"}
            >
              <IconLink size={"md"} />
            </ColorSchemeAwareActionIcon>
          )}

          {r.data!.instagramHandle && (
            <ColorSchemeAwareActionIcon
              onClick={() =>
                window.open(`https://instagram.com/${r.data!.instagramHandle}`)
              }
              variant={"transparent"}
            >
              <IconBrandInstagram size={"md"} />
            </ColorSchemeAwareActionIcon>
          )}
        </Group>
      </Stack>

      <JoinButton club={r.data!} />

      <ContributingMembersLink
        clubId={r.data!.id}
        clubPublicId={r.data!.publicId}
      />

      <ClubDisplayImageGallery club={r.data!} />

      {r.data!.eventCalendarUrl && (
        <ColorSchemeAwareOutlineButton
          onClick={() => window.open(r.data!.eventCalendarUrl!)}
          size="lg"
          mt={"md"}
        >
          Come to an event
        </ColorSchemeAwareOutlineButton>
      )}

      <Text mt={"lg"}>Powered by BuildIRL</Text>
    </Stack>
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

  QueryError.checkNullable({
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

function DefaultJoinButton({ club }: JoinButtonProps) {
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
