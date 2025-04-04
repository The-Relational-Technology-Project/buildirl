"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Stack, Title, Text, Group, GroupProps } from "@mantine/core";
import { IconBrandInstagram, IconWorld } from "@tabler/icons-react";
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
  const searchParams = useSearchParams();
  const fromWelcome = searchParams.get("fromWelcome") === "true";

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
    // do not redirect if user is coming from the welcome page
    if (fromWelcome) {
      return;
    }
    const membership = activeMembershipForClub(m.data!, r.data!.id);
    if (membership !== null && !membership.isWelcomed) {
      router.push(`/apply/${publicId}/welcome`);
    }
  }, [m, r, fromWelcome]);

  // no-op; just for the effect
  return null;
}

export default function ClubJoin() {
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
          px={{ base: 0, md: 150 }}
          // this page specifically, we want to fill up more space
          mx={-6}
          maw={PAGE_WIDTH}
          align={"center"}
          gap={"lg"}
        >
          <ClubImage club={r.data!} size={{ base: 320, md: 360 }} />

          <Stack align={"center"} gap={0} mb={8}>
            <Title
              fz={{ base: 42, md: 50 }}
              style={{
                // TODO apply this dynamically across all headings
                fontFamily: r.data!.themeHeadingFont ?? "inherit",
                textAlign: "center"
              }}
            >
              {r.data!.name}
            </Title>

            <Stack align={"center"} gap={8}>
              <Text ta={"center"} size={"lg"}>
                {r.data!.tagLine}
              </Text>

              <Text
                td={"underline"}
                style={{ cursor: "pointer", fontStyle: "underlined" }}
                onClick={() => router.push(`/join/${publicId}/about`)}
                size={"sm"}
              >
                {"Read more >"}
              </Text>

              <MemberCountStatistic clubId={r.data!.id} textSize={"md"} />

              <Group>
                {r.data!.websiteUrl && (
                  <ActionIconBox
                    onClick={() => window.open(`${r.data!.websiteUrl}`)}
                    icon={<IconWorld />}
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

          <ContributingMembersLink club={r.data!} />

          <MemberCarousel clubId={r.data!.id} owner={r.data!.owner} />

          {r.data!.eventCalendarUrl && (
            <SecondaryButton
              w={"80%"}
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
  club: Club;
};

function ContributingMembersLink({
  club
}: ContributingMembersLinkProps & GroupProps) {
  const router = useRouter();
  const r = api.main.clubStatistics.useQuery({ clubId: club.id });

  QueryError.check({
    result: r,
    fieldName: "clubStatistics"
  });

  return (
    isLoaded(r) && (
      <Stack align={"center"} gap={4}>
        <Title
          order={1}
          style={{
            fontFamily: club.themeHeadingFont ?? "inherit"
          }}
        >
          We are the club
        </Title>
        <Text
          style={{ cursor: "pointer" }}
          onClick={() => router.push(`/join/${club.publicId}/members`)}
          size={"md"}
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
    case "PENDING_INCOMPLETE":
      return (
        <PrimaryButton
          includeIcon
          onClick={() =>
            router.push(
              `/apply/${club.publicId}/payments?membershipId=${membership.id}`
            )
          }
        >
          Complete Application
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
