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
  IconCalendar,
  IconUserCircle
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
import MemberCarousel from "~/app/(main)/(join)/join/[publicId]/_components/MemberCarousel";
import React, { useEffect } from "react";
import PrimaryButton from "~/client/components/PrimaryButton";
import FAQs from "./_components/FAQs";
import { useMounted } from "@mantine/hooks";
import ShareIconButton from "./_components/ShareIconButton";
import FollowToggle from "~/app/(main)/(join)/join/[publicId]/_components/FollowToggle";
import { InstagramHandle, Url } from "~/server/utils/types";
import { Club, ClubStatistics } from "~/server/club/types";
import { ClubValueDisplay } from "~/app/(main)/(join)/join/[publicId]/_components/ClubValueDisplay";
import { WhoWeAre } from "./_components/WhoWeAre";
import { HowWeHang } from "./_components/HowWeHang";
import InfoChip from "./_components/InfoChip";
import { CampaignModule } from "./_components/CampaignModule";

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

  const clubId = club.data?.id;
  const clubStatistics = api.main.clubStatistics.useQuery(
    { clubId: clubId ?? -1 },
    { enabled: !!clubId }
  );
  const shouldShowClubMemberInfo =
    !!clubStatistics.data?.memberCount && clubStatistics.data?.memberCount > 5;

  const activeCampaign = api.main.getActiveMembershipCampaign.useQuery(
    {
      clubId: club.data!.id
    },
    { enabled: !!club.data }
  );

  const campaignProgress =
    api.main.getActiveMembershipCampaignProgress.useQuery(
      {
        clubId: clubId ?? -1,
        launchDate: activeCampaign.data?.launchDate ?? new Date(0)
      },
      { enabled: !!clubId && !!activeCampaign.data?.launchDate }
    );

  QueryError.check({ result: club, fieldName: "clubByPublicId" });
  if (clubId) {
    QueryError.check({ result: clubStatistics, fieldName: "clubStatistics" });
  }

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

              <Group>
                {club.data?.location && (
                  <InfoChip>
                    <IconMapPin size={18} stroke={1} />
                    <Text size="sm">{club.data!.location}</Text>
                  </InfoChip>
                )}
                {club.data?.rhythm && (
                  <InfoChip>
                    <IconCalendar size={18} stroke={1} />
                    <Text size="sm">{club.data.rhythm.frequency}</Text>
                  </InfoChip>
                )}
                {shouldShowClubMemberInfo && (
                  <InfoChip>
                    <IconUserCircle size={18} stroke={1} />
                    <Text size="sm">
                      {clubStatistics.data?.memberCount} members
                    </Text>
                  </InfoChip>
                )}
              </Group>
            </Stack>
          </Stack>

          {activeCampaign.data && campaignProgress?.data && (
            <CampaignModule
              club={club.data!}
              activeCampaign={activeCampaign.data}
              campaignProgress={campaignProgress.data}
            />
          )}

          <JoinButton club={club.data!} />
          <ClubDisplayImageGallery club={club.data!} mt={"xs"} />

          <WhoWeAre club={club.data!} />

          <HowWeHang club={club.data!} />

          <FollowToggle
            clubId={club.data!.id}
            mt={10}
            redirectTo={`/join/${publicId}`}
          />

          <ClubValueDisplay club={club.data!} />

          {shouldShowClubMemberInfo && (
            <ContributingMembersLink
              club={club.data!}
              clubStatistics={clubStatistics.data!}
            />
          )}

          {shouldShowClubMemberInfo && (
            <MemberCarousel clubId={club.data!.id} />
          )}

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
  clubStatistics: ClubStatistics;
};

function ContributingMembersLink({
  club,
  clubStatistics
}: ContributingMembersLinkProps & GroupProps) {
  const router = useRouter();

  return (
    clubStatistics && (
      <Stack align={"center"} gap={4}>
        <Title
          order={1}
          tt="uppercase"
          style={{
            fontFamily: club.themeHeadingFont ?? "inherit",
            textAlign: "center"
          }}
        >
          Meet the club
        </Title>
        <Text
          style={{ cursor: "pointer" }}
          onClick={() => router.push(`/join/${club.publicId}/members`)}
          size={"md"}
        >
          {`${clubStatistics.memberCount} contributing member${clubStatistics.memberCount > 1 ? "s" : ""} >`}
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
