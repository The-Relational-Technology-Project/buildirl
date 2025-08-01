"use client";

import { Stack, Title, Text, Center } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import ClubImage from "~/client/components/ClubImage";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import SecondaryButton from "~/client/components/SecondaryButton";
import { ReturnToCampaignSection } from "~/app/(main)/(join)/apply/[publicId]/completed/__components/ReturnToCampaignSection";

export default function ApplicationCompleted() {
  const params = useParams<{ publicId: string }>();
  const router = useRouter();

  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });
  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  // !! PROTOTYPE
  if (isLoaded(club) && club.data!.id === 77) {
    return <ReturnToCampaignSection club={club.data!} />;
  }

  return (
    isLoaded(club) && (
      <Center pt={80} px={{ base: undefined, md: 200 }}>
        <Stack align="center" gap={"lg"}>
          <Title order={1} ta={"center"}>
            THANK YOU FOR APPLYING!
          </Title>
          <Text ta={"center"} size={"lg"}>
            Your application is being reviewed. You’ll receive an email with an
            update soon.
          </Text>

          <ClubImage club={club.data!} size={240} />

          <SecondaryButton
            mt={"lg"}
            onClick={() => {
              router.push(`/join/${params.publicId}/`);
            }}
          >
            Return Home
          </SecondaryButton>

          <Text ta={"center"} size={"sm"}>
            If you wish to withdraw your application, you can manage your
            application from the club page.
          </Text>
        </Stack>
      </Center>
    )
  );
}
