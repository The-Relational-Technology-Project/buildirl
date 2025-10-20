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
import {
  IconBrandInstagram,
  IconWorld,
  IconMapPin,
  IconCalendar
} from "@tabler/icons-react";
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
import { getRhythmDescription } from "./utils";
import { ClubValueDisplay } from "~/app/(main)/(join)/join/[publicId]/_components/ClubValueDisplay";
import { WhoWeAre } from "./_components/WhoWeAre";

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

  const club = api.main.clubByPublicId.useQuery({
    publicId
  });
  const userMemberships = api.main.userMemberships.useQuery();

  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  QueryError.check({
    result: userMemberships,
    fieldName: "userMemberships"
  });

  // redirect user to the welcome page if it is their first time on the join page
  // after being accepted!
  useEffect(() => {
    // cannot put this after isAllLoaded because useEffect must not be
    // conditionally instantiated
    if (!isAllLoaded([userMemberships, club])) {
      return;
    }
    // do not redirect if user is coming from the welcome page
    if (fromWelcome) {
      return;
    }
    const membership = activeMembershipForClub(
      userMemberships.data!,
      club.data!.id
    );
    if (membership !== null && !membership.isWelcomed) {
      router.push(`/apply/${publicId}/welcome`);
    }
  }, [userMemberships, club, fromWelcome]);

  // no-op; just for the effect
  return null;
}

export default function ClubJoin() {
  const mounted = useMounted();
  const shareButtonRightPosition = useMatches({ base: -12, md: 120 });
  const clubImageSize = useMatches({ base: 320, md: 400 });

  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;

  const club = api.main.clubByPublicId.useQuery({
    publicId
  });

  const isUserAuthenticated = api.main.isUserAuthenticated.useQuery();

  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });
  QueryError.check({
    result: isUserAuthenticated,
    fieldName: "isUserAuthenticated"
  });

  return (
    mounted &&
    isAllLoaded([club, isUserAuthenticated]) && (
      <>
        {isUserAuthenticated.data! && (
          <WithRedirectToWelcomePage publicId={publicId} />
        )}
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
              clubPublicId={club.data!.publicId}
              clubName={club.data!.name}
            />
          </Box>

          <ClubImage club={club.data!} size={clubImageSize} />

          <Stack align={"center"} gap={0}>
            <Title
              fz={{ base: 32, md: 45 }}
              style={{
                // TODO apply this dynamically across all headings
                fontFamily: club.data!.themeHeadingFont ?? "inherit",
                textAlign: "center"
              }}
            >
              {club.data!.name}
            </Title>

            <Stack align={"center"} gap={8} mt={4}>
              {club.data!.tagLine !== "" && (
                <Text ta={"center"} size={"lg"}>
                  {club.data!.tagLine}
                </Text>
              )}

              <LinkIcons
                websiteUrl={club.data!.websiteUrl}
                instagramHandle={club.data!.instagramHandle}
              />

              {club.data!.location && (
                <Group gap={6}>
                  <IconMapPin size={18} stroke={1.5} />
                  <Text size="sm">{club.data!.location}</Text>
                </Group>
              )}

              {club.data?.rhythm && (
                <Group gap={6}>
                  <IconCalendar size={18} stroke={1.5} />
                  <Text size="sm">
                    {getRhythmDescription(club.data.rhythm)}
                  </Text>
                </Group>
              )}
            </Stack>
          </Stack>

          <JoinButton club={club.data!} />

          <WhoWeAre description={club.data!.description} />

          {club.data!.eventCalendarUrl && (
            <SecondaryButton
              includeIcon
              onClick={() => window.open(club.data!.eventCalendarUrl!)}
              mt={"sm"}
            >
              Come to an event
            </SecondaryButton>
          )}

          <FollowToggle
            clubId={club.data!.id}
            mt={10}
            redirectTo={`/join/${publicId}`}
          />

          <ClubDisplayImageGallery club={club.data!} mt={"xs"} />

          <ContributingMembersLink club={club.data!} />

          <MemberCarousel clubId={club.data!.id} />

          <ClubValueDisplay club={club.data!} />

          <FAQs
            faqs={club.data!.faqs}
            themeHeadingFont={club.data!.themeHeadingFont}
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
  const clubStatistics = api.main.clubStatistics.useQuery({ clubId: club.id });

  QueryError.check({
    result: clubStatistics,
    fieldName: "clubStatistics"
  });

  return (
    isLoaded(clubStatistics) && (
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
          {`${clubStatistics.data!.memberCount} contributing member${clubStatistics.data!.memberCount > 1 ? "s" : ""} >`}
        </Text>
      </Stack>
    )
  );
}

type JoinButtonProps = {
  club: Club;
};

function JoinButton({ club }: JoinButtonProps) {
  const isUserAuthenticated = api.main.isUserAuthenticated.useQuery();

  QueryError.check({
    result: isUserAuthenticated,
    fieldName: "isUserAuthenticated"
  });

  if (isUserAuthenticated.data!) {
    return <AuthenticatedJoinButton club={club} />;
  }
  return <DefaultJoinButton club={club} />;
}

function AuthenticatedJoinButton({ club }: JoinButtonProps) {
  const router = useRouter();
  const userMemberships = api.main.userMemberships.useQuery();

  if (!isLoaded(userMemberships)) {
    return null;
  }

  const membership = membershipForClub(userMemberships.data!, club.id);

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
    case "DECLINED":
    case "INACTIVE":
    case "WITHDRAWN":
    // no membership
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
