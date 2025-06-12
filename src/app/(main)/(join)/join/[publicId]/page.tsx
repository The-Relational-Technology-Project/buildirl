"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Stack,
  Title,
  Text,
  Group,
  GroupProps,
  Box,
  useMatches
} from "@mantine/core";
import { IconBrandInstagram, IconWorld, IconMapPin } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded, isLoaded } from "~/client/utils";
import { PAGE_WIDTH } from "~/client/components/HeaderBar";
import {
  activeMembershipForClub,
  Maybe,
  membershipForClub
} from "~/utils/types";
import { ActionIconBox } from "~/client/components/ColorSchemeAwareActionIcon";
import ClubDisplayImageGallery from "~/app/(main)/(join)/join/[publicId]/_components/ClubDisplayImageGallery";
import ClubImage from "~/client/components/ClubImage";
import SecondaryButton from "~/client/components/SecondaryButton";
import MemberCarousel from "~/app/(main)/(join)/join/[publicId]/_components/MemberCarousel";
import React, { useEffect } from "react";
import PrimaryButton from "~/client/components/PrimaryButton";
import FAQs from "./_components/FAQs";
import { useMounted } from "@mantine/hooks";
import ShareIconButton from "./_components/ShareIconButton";
import FollowToggle from "~/app/(main)/(join)/join/[publicId]/_components/FollowToggle";
import { InstagramHandle, Url } from "~/server/utils/types";
import { Club } from "~/server/club/types";

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
  const mounted = useMounted();
  const shareButtonRightPosition = useMatches({ base: -12, md: 120 });
  const clubImageSize = useMatches({ base: 320, md: 400 });

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
    mounted &&
    isAllLoaded([r, s]) && (
      <>
        {s.data! && <WithRedirectToWelcomePage publicId={publicId} />}
        <Stack
          pt={50}
          pb={"lg"}
          px={{ base: 0, md: 150 }}
          // this page specifically, we want to fill up more space
          mx={-6}
          maw={PAGE_WIDTH}
          align={"center"}
          gap={"lg"}
        >
          <Box
            style={{
              position: "absolute",
              top: 20,
              right: shareButtonRightPosition
            }}
          >
            <ShareIconButton
              clubPublicId={r.data!.publicId}
              clubName={r.data!.name}
            />
          </Box>

          <ClubImage club={r.data!} size={clubImageSize} />

          <Stack align={"center"} gap={0}>
            <Title
              fz={{ base: 32, md: 45 }}
              style={{
                // TODO apply this dynamically across all headings
                fontFamily: r.data!.themeHeadingFont ?? "inherit",
                textAlign: "center"
              }}
            >
              {r.data!.name}
            </Title>

            <Stack align={"center"} gap={8} mt={4}>
              {r.data!.tagLine !== "" && (
                <Text ta={"center"} size={"lg"}>
                  {r.data!.tagLine}
                </Text>
              )}

              <Text
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/join/${publicId}/about`)}
                size={"sm"}
              >
                {"About >"}
              </Text>

              <LinkIcons
                websiteUrl={r.data!.websiteUrl}
                instagramHandle={r.data!.instagramHandle}
              />

              {r.data!.location && (
                <Group gap={6}>
                  <IconMapPin size={18} stroke={1.5} />
                  <Text size="sm">{r.data!.location}</Text>
                </Group>
              )}
            </Stack>
          </Stack>

          <JoinButton club={r.data!} />

          {r.data!.eventCalendarUrl && (
            <SecondaryButton
              includeIcon
              onClick={() => window.open(r.data!.eventCalendarUrl!)}
              mt={"sm"}
            >
              Come to an event
            </SecondaryButton>
          )}

          <FollowToggle
            clubId={r.data!.id}
            mt={10}
            redirectTo={`/join/${publicId}`}
          />

          <ClubDisplayImageGallery club={r.data!} mt={"xs"} />

          <ContributingMembersLink club={r.data!} />

          <MemberCarousel clubId={r.data!.id} />

          <FAQs
            faqs={r.data!.faqs}
            themeHeadingFont={r.data!.themeHeadingFont}
            mt={"lg"}
          />

          <Text mt={48}>Powered by BuildIRL</Text>
        </Stack>
      </>
    )
  );
}

type LinkIconProps = {
  websiteUrl: Maybe<Url>;
  instagramHandle: Maybe<InstagramHandle>;
};

function LinkIcons({ websiteUrl, instagramHandle }: LinkIconProps) {
  if (!websiteUrl && !instagramHandle) {
    return null;
  }

  return (
    <Group mt={"xs"} mb={8}>
      {websiteUrl && (
        <ActionIconBox
          onClick={() => window.open(`${websiteUrl}`)}
          icon={<IconWorld />}
          size={"lg"}
        />
      )}

      {instagramHandle && (
        <ActionIconBox
          onClick={() =>
            window.open(`https://instagram.com/${instagramHandle}`)
          }
          icon={<IconBrandInstagram />}
          size={"lg"}
        />
      )}
    </Group>
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
            fontFamily: club.themeHeadingFont ?? "inherit",
            textAlign: "center"
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

function JoinButton({ club }: JoinButtonProps) {
  const r = api.main.isUserAuthenticated.useQuery();

  QueryError.check({
    result: r,
    fieldName: "isUserAuthenticated"
  });

  // TODO! this is BuildIRL club in prod! this is a hack - remove this after the
  //  launch of BuildIRL club
  if (club.id === 77) {
    return <PrimaryButton disabled>Coming soon!</PrimaryButton>;
  }

  if (r.data!) {
    return <AuthenticatedJoinButton club={club} />;
  }
  return <DefaultJoinButton club={club} />;
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
        <PrimaryButton
          includeIcon
          onClick={() => router.push(`/club/${club.id}/manage-application`)}
        >
          Manage Application
        </PrimaryButton>
      );
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
    // no membership, declined, deactivated, or withdrawn
    case "WITHDRAWN":
    default:
      return (
        <PrimaryButton
          includeIcon
          onClick={() => router.push(`/join/${club.publicId}/tiers`)}
        >
          Join as a member
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
      Join as a member
    </PrimaryButton>
  );
}
