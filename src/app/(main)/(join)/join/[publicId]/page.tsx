"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Stack,
  Title,
  Text,
  Group,
  GroupProps,
  useMatches
} from "@mantine/core";
import { IconLink, IconBrandInstagram } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded, isLoaded } from "~/client/utils";
import { PAGE_WIDTH } from "~/client/components/HeaderBar";
import MemberCountStatistic from "~/client/components/MemberCountStatistic";
import { Club } from "~/server/service/types";
import { activeMembershipForClub, membershipForClub } from "~/utils/types";
import { ActionIconBox } from "~/client/components/ColorSchemeAwareActionIcon";
import ClubDisplayImageGallery from "~/app/(main)/(join)/join/[publicId]/_components/ClubDisplayImageGallery";
import ClubImage from "~/client/components/ClubImage";
import SecondaryButton from "~/client/components/SecondaryButton";
import MemberCarousel from "~/app/(main)/(join)/join/[publicId]/_components/MemberCarousel";
import React, { useEffect } from "react";
import PrimaryButton from "~/client/components/PrimaryButton";

type WithRedirectToWelcomePageProps = {
  publicId: string;
};

// this is extracted into subcomponent so it can be conditionally rendered
// only if user is authenticated
function WithRedirectToWelcomePage({
  publicId
}: WithRedirectToWelcomePageProps) {
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

  // redirect user to the welcome page if it is their first time on the join page
  // after being accepted!
  useEffect(() => {
    // cannot put this after isAllLoaded because useEffect must not be
    // conditionally instantiated
    if (!isAllLoaded([m, r])) {
      return;
    }
    const membership = activeMembershipForClub(m.data!, r.data!.id);
    if (membership !== null && !membership.isWelcomed) {
      router.push(`/apply/${publicId}/welcome`);
    }
  }, [m, r]);

  // no-op; just for the effect
  return null;
}

export default function ClubJoin() {
  const taglineTextSize = useMatches({ base: "sm", md: "md" });
  const aboutLinkTextSize = useMatches({ base: "xs", md: "sm" });

  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const router = useRouter();

  const r = api.main.clubByPublicId.useQuery({
    publicId
  });
  const s = api.main.isUserAuthenticated.useQuery();

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });
  QueryError.check({
    result: s,
    fieldName: "isUserAuthenticated"
  });

  return (
    isAllLoaded([r, s]) && (
      <>
        {s.data! && <WithRedirectToWelcomePage publicId={publicId} />}
        <Stack
          pt="xl"
          pb={"lg"}
          px={{ base: "sm", md: 150 }}
          maw={PAGE_WIDTH}
          align={"center"}
          gap={"lg"}
        >
          <ClubImage club={r.data!} size={{ base: 200, md: 300 }} />

          <Stack align={"center"} gap={0} mb={8}>
            <Title
              fz={{ base: 36, md: 48 }}
              style={{
                // we only want to apply this theme font family to this heading not all headings
                fontFamily: r.data!.theme?.headingFontFamily ?? "inherit"
              }}
            >
              {r.data!.name}
            </Title>

            <Stack align={"center"} gap={8}>
              <Text ta={"center"} size={taglineTextSize}>
                {r.data!.tagLine}
              </Text>

              <Text
                td={"underline"}
                style={{ cursor: "pointer", fontStyle: "underlined" }}
                onClick={() => router.push(`/join/${publicId}/about`)}
                size={aboutLinkTextSize}
              >
                {"Read more >"}
              </Text>

              <MemberCountStatistic clubId={r.data!.id} />

              <Group>
                {r.data!.websiteUrl && (
                  <ActionIconBox
                    onClick={() => window.open(`${r.data!.websiteUrl}`)}
                    icon={<IconLink />}
                    size={"lg"}
                  />
                )}

                {r.data!.instagramHandle && (
                  <ActionIconBox
                    onClick={() =>
                      window.open(
                        `https://instagram.com/${r.data!.instagramHandle}`
                      )
                    }
                    icon={<IconBrandInstagram />}
                    size={"lg"}
                  />
                )}
              </Group>
            </Stack>
          </Stack>

          <JoinButton club={r.data!} />

          <ClubDisplayImageGallery club={r.data!} mt={"xs"} />

          <ContributingMembersLink
            clubId={r.data!.id}
            clubPublicId={r.data!.publicId}
          />

          <MemberCarousel clubId={r.data!.id} owner={r.data!.owner} />

          {r.data!.eventCalendarUrl && (
            <SecondaryButton
              includeIcon
              onClick={() => window.open(r.data!.eventCalendarUrl!)}
              mt={"md"}
            >
              Come to an event
            </SecondaryButton>
          )}

          <Text mt={48}>Powered by BuildIRL</Text>
        </Stack>
      </>
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
  const memberCountTextSize = useMatches({ base: "sm", md: "md" });

  QueryError.check({
    result: r,
    fieldName: "clubStatistics"
  });

  return (
    isLoaded(r) && (
      <Stack align={"center"} gap={4}>
        <Title fz={{ base: 24, md: 30 }}>We are the club</Title>
        <Text
          style={{ cursor: "pointer" }}
          onClick={() => router.push(`/join/${clubPublicId}/members`)}
          size={memberCountTextSize}
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
      return <PrimaryButton disabled>Pending Approval...</PrimaryButton>;
    case "ACTIVE":
      return (
        <PrimaryButton
          includeIcon
          onClick={() => router.push(`/club/${club.id}/manage-membership`)}
        >
          Manage Membership
        </PrimaryButton>
      );
    // no membership, declined, or deactivated
    default:
      return (
        <PrimaryButton
          includeIcon
          onClick={() => router.push(`/join/${club.publicId}/tiers`)}
        >
          Join as Member
        </PrimaryButton>
      );
  }
}

function DefaultJoinButton({ club }: JoinButtonProps) {
  const router = useRouter();
  return (
    <PrimaryButton
      includeIcon
      onClick={() => router.push(`/join/${club.publicId}/tiers`)}
    >
      Join as Member
    </PrimaryButton>
  );
}
