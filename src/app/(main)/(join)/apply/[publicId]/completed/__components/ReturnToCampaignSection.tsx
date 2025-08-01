// !! PROTOTYPE

import { Center, Stack, Text, Title } from "@mantine/core";
import ClubImage from "~/client/components/ClubImage";
import SecondaryButton from "~/client/components/SecondaryButton";
import { useRouter } from "next/navigation";
import { Club } from "~/server/club/types";

type ReturnToCampaignSectionProps = {
  club: Club;
};

export function ReturnToCampaignSection({
  club
}: ReturnToCampaignSectionProps) {
  const router = useRouter();

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

        <ClubImage club={club} size={240} />

        <SecondaryButton
          mt={"lg"}
          onClick={() => {
            router.push(`/campaign/${club.publicId}/72/`);
          }}
        >
          Return to Campaign
        </SecondaryButton>
      </Stack>
    </Center>
  );
}
