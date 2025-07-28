"use client";

import { Stack, Title, Text, Center } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import ClubImage from "~/client/components/ClubImage";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import SecondaryButton from "~/client/components/SecondaryButton";

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

  // TODO! for BuildIRL campaign prototype
  if (!isLoaded(club)) {
    return null;
  }
  if (club.data!.id === 77) {
    return (
      <Center pt={80} px={{ base: undefined, md: 200 }}>
        <Stack align="center" gap={"lg"}>
          <Title order={1} ta={"center"}>
            THANK YOU FOR YOUR SUPPORT!
          </Title>
          <Text ta={"center"} size={"lg"}>
            You’ll will receive a notification at the end of the campaign. You
            will only be charged if the campaign is successful.
          </Text>

          <ClubImage club={club.data!} size={240} />

          <SecondaryButton
            mt={"lg"}
            onClick={() => {
              router.push(`/campaign/${params.publicId}/72/`);
            }}
          >
            Return to Campaign
          </SecondaryButton>
        </Stack>
      </Center>
    );
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
