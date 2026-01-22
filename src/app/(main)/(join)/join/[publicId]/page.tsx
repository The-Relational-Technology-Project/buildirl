"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Stack, Title, Text, Group, Box, useMatches } from "@mantine/core";
import {
  IconBrandInstagram,
  IconWorld,
  IconMapPin,
  IconCalendar,
  IconUserCircle
} from "@tabler/icons-react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { HEADER_BAR_HEIGHT, PAGE_WIDTH } from "~/client/components/HeaderBar";
import { activeMembershipForClub, Maybe } from "~/utils/types";
import { ActionIconBox } from "~/client/components/ColorSchemeAwareActionIcon";
import ClubDisplayImageGallery from "~/app/(main)/(join)/join/[publicId]/_components/ClubDisplayImageGallery";
import ClubImage from "~/client/components/ClubImage";
import ClubMembers from "~/app/(main)/(join)/join/[publicId]/_components/ClubMembers";
import React, { useEffect, useLayoutEffect, useState } from "react";
import FAQs from "./_components/FAQs";
import { useElementSize, useMounted } from "@mantine/hooks";
import ShareIconButton from "./_components/ShareIconButton";
import FollowToggle from "~/app/(main)/(join)/join/[publicId]/_components/FollowToggle";
import { InstagramHandle, Url } from "~/server/utils/types";
import { ClubValueDisplay } from "~/app/(main)/(join)/join/[publicId]/_components/ClubValueDisplay";
import { WhoWeAre } from "./_components/WhoWeAre";
import { HowWeHang } from "./_components/HowWeHang";
import InfoChip from "./_components/InfoChip";
import { CampaignModule } from "./_components/CampaignModule";
import { JoinButton } from "./_components/JoinButton";

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
  const contentDirection = useMatches({
    base: "column",
    md: "row"
  }) as React.CSSProperties["flexDirection"];
  const contentGap = useMatches({ base: 32, md: 80 });
  const leftColumnWidth = useMatches({ base: "100%", md: 420 });
  const leftAlign = useMatches({ base: "center", md: "flex-start" });
  const contentAlign = useMatches({
    base: "stretch",
    md: "stretch"
  }) as React.CSSProperties["alignItems"];
  const isDesktop = useMatches({ base: false, md: true });
  const { ref: leftColumnRef, width: leftColumnWidthMeasured } =
    useElementSize<HTMLDivElement>();
  const { ref: stickyContentRef, height: stickyContentHeight } =
    useElementSize<HTMLDivElement>();
  const [leftColumnLeft, setLeftColumnLeft] = useState(0);

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

  useLayoutEffect(() => {
    if (!isDesktop || !leftColumnRef.current) {
      return;
    }
    const rect = leftColumnRef.current.getBoundingClientRect();
    setLeftColumnLeft(rect.left);
  }, [isDesktop, leftColumnWidthMeasured]);

  const clubHeaderDetails = (
    <>
      <Title
        fz={{ base: 32, md: 45 }}
        style={{
          // TODO apply this dynamically across all headings
          fontFamily: club.data!.themeHeadingFont ?? "inherit",
          textAlign: isDesktop ? "left" : "center",
          width: "100%"
        }}
      >
        {club.data!.name}
      </Title>

      <Stack align={isDesktop ? "flex-start" : "center"} gap={8} w="100%">
        {club.data!.tagLine !== "" && (
          <Text ta={isDesktop ? "left" : "center"} size={"lg"}>
            {club.data!.tagLine}
          </Text>
        )}

        <Group justify="center" align="center" gap={16} mb={16} mt={8}>
          <Group
            justify={isDesktop ? "flex-start" : "center"}
            align="center"
            gap={8}
          >
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
          <LinkIcons
            websiteUrl={club.data!.websiteUrl}
            instagramHandle={club.data!.instagramHandle}
          />
        </Group>
      </Stack>
    </>
  );

  return (
    mounted &&
    isAllLoaded([club, isUserAuthenticated]) && (
      <>
        {isUserAuthenticated.data! && (
          <WithRedirectToWelcomePage publicId={publicId} />
        )}
        <Stack
          pt={50}
          pb={{ base: 120, md: "lg" }}
          px={{ base: 0, md: 120 }}
          // this page specifically, we want to fill up more space
          mx={{ base: 0, md: -6 }}
          maw={{ base: PAGE_WIDTH, md: "100%" }}
          align={"center"}
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

          <Box
            style={{
              display: "flex",
              flexDirection: contentDirection,
              gap: contentGap,
              width: "100%",
              alignItems: contentAlign,
              justifyContent: "center"
            }}
          >
            <Stack
              ref={leftColumnRef as React.RefObject<HTMLDivElement>}
              style={{
                width: leftColumnWidth,
                flexShrink: 0,
                alignItems: leftAlign
              }}
            >
              {isDesktop ? (
                <>
                  <Box h={stickyContentHeight} />
                  <Box
                    style={{
                      position: "fixed",
                      top: HEADER_BAR_HEIGHT + 20,
                      left: leftColumnLeft,
                      width: leftColumnWidthMeasured || leftColumnWidth,
                      zIndex: 1
                    }}
                  >
                    <Stack
                      align={leftAlign}
                      w="100%"
                      ref={stickyContentRef as React.RefObject<HTMLDivElement>}
                    >
                      <ClubImage club={club.data!} size={clubImageSize} />
                      <JoinButton club={club.data!} />
                      {shouldShowClubMemberInfo && (
                        <ClubMembers
                          club={club.data!}
                          clubStatistics={clubStatistics.data!}
                        />
                      )}
                    </Stack>
                  </Box>
                </>
              ) : (
                <>
                  <ClubImage club={club.data!} size={clubImageSize} />
                  <Stack align="center" w="100%" gap={"0"}>
                    {clubHeaderDetails}

                    {shouldShowClubMemberInfo && (
                      <ClubMembers
                        club={club.data!}
                        clubStatistics={clubStatistics.data!}
                      />
                    )}
                  </Stack>
                </>
              )}

              {!isDesktop && activeCampaign.data && campaignProgress?.data && (
                <CampaignModule
                  club={club.data!}
                  activeCampaign={activeCampaign.data}
                  campaignProgress={campaignProgress.data}
                />
              )}
            </Stack>

            <Stack
              style={{
                flex: 1,
                minWidth: 0,
                width: "100%",
                overflow: "visible"
              }}
            >
              {isDesktop && (
                <Stack align="flex-start" w="100%" mt={81}>
                  {clubHeaderDetails}
                </Stack>
              )}
              {isDesktop && activeCampaign.data && campaignProgress?.data && (
                <CampaignModule
                  club={club.data!}
                  activeCampaign={activeCampaign.data}
                  campaignProgress={campaignProgress.data}
                />
              )}
              <WhoWeAre club={club.data!} />

              <ClubDisplayImageGallery club={club.data!} mb={"sm"} />

              <HowWeHang club={club.data!} />

              <FollowToggle
                clubId={club.data!.id}
                mt={10}
                redirectTo={`/join/${publicId}`}
              />

              <ClubValueDisplay club={club.data!} />

              <FAQs
                faqs={club.data!.faqs}
                themeHeadingFont={club.data!.themeHeadingFont}
              />

              <Text mt={48}>Powered by BuildIRL</Text>
            </Stack>
          </Box>
        </Stack>
        {!isDesktop && (
          <Box
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 3,
              display: "flex",
              justifyContent: "center",
              padding: "12px 16px calc(24px + env(safe-area-inset-bottom))"
            }}
          >
            <JoinButton club={club.data!} />
          </Box>
        )}
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
    <Group align="center">
      {websiteUrl && (
        <ActionIconBox
          onClick={() => window.open(`${websiteUrl}`)}
          icon={<IconWorld />}
          size={"lg"}
          variant="infochip"
        />
      )}

      {instagramHandle && (
        <ActionIconBox
          onClick={() =>
            window.open(`https://instagram.com/${instagramHandle}`)
          }
          icon={<IconBrandInstagram />}
          size={"lg"}
          variant="infochip"
        />
      )}
    </Group>
  );
}
