"use client";

import { Stack, Title, Text, Center } from "@mantine/core";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ClubImage from "~/client/components/ClubImage";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import SecondaryButton from "~/client/components/SecondaryButton";
import { ReturnToCampaignSection } from "~/app/(main)/(join)/apply/[publicId]/completed/__components/ReturnToCampaignSection";
import { CAMPAIGN_CONFIGURATIONS } from "~/app/(main)/(join)/campaign/[publicId]/config";

export default function ApplicationCompleted() {
  const params = useParams<{ publicId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTierChange = searchParams.get("flow") === "tier-change";

  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });
  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  // !! PROTOTYPE
  if (
    CAMPAIGN_CONFIGURATIONS.find((c) => c.clubPublicId === params.publicId) !==
    undefined
  ) {
    return <ReturnToCampaignSection club={club.data!} />;
  }
  const pageContent = {
    title: isTierChange ? "TIER CHANGE SUCCESSFUL!" : "THANK YOU FOR APPLYING!",
    message: isTierChange
      ? "Your membership tier has been updated. You'll receive an email confirmation shortly."
      : "Your application is being reviewed. You'll receive an email with an update soon.",
    buttonText: isTierChange ? "View Membership" : "Return Home",
    buttonUrl: isTierChange 
      ? `/club/${club.data?.id}/manage-membership` 
      : `/join/${params.publicId}/`,
    showApplicationNote: !isTierChange
  };

  return (
    isLoaded(club) && (
      <Center pt={80} px={{ base: undefined, md: 200 }}>
        <Stack align="center" gap={"lg"}>
          <Title order={1} ta={"center"}>
            {pageContent.title}
          </Title>
          <Text ta={"center"} size={"lg"}>
            {pageContent.message}
          </Text>

          <ClubImage club={club.data!} size={240} />

          <SecondaryButton
            mt={"lg"}
            onClick={() => {
              router.push(pageContent.buttonUrl);
            }}
          >
            {pageContent.buttonText}
          </SecondaryButton>

          {pageContent.showApplicationNote && (
            <Text ta={"center"} size={"sm"}>
              If you wish to withdraw your application, you can manage your
              application from the club page.
            </Text>
          )}
        </Stack>
      </Center>
    )
  );
}
