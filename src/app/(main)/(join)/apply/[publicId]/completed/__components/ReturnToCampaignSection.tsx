// !! PROTOTYPE

import {
  Center,
  Stack,
  Text,
  Title,
  TextInput,
  Button,
  Group,
  Box
} from "@mantine/core";
import ClubImage from "~/client/components/ClubImage";
import SecondaryButton from "~/client/components/SecondaryButton";
import { useRouter } from "next/navigation";
import { Club } from "~/server/club/types";
import { useState } from "react";
import { api } from "~/trpc/react";
import { notifySuccess, notifyError } from "~/client/logger";

type ReturnToCampaignSectionProps = {
  club: Club;
};

export function ReturnToCampaignSection({
  club
}: ReturnToCampaignSectionProps) {
  const router = useRouter();
  const [emails, setEmails] = useState<string[]>(["", "", "", "", ""]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const submitReferrals = api.main.submitReferralEmails.useMutation({
    onSuccess: () => {
      notifySuccess("Success", "Your referrals have been submitted.");
      setEmails(["", "", "", "", ""]);
      setHasSubmitted(true);
    },
    onError: () => {
      notifyError(
        "Failed to submit referrals. Make sure all emails are valid. Please try again. "
      );
    }
  });

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = () => {
    const validEmails = emails.filter((email) => email.trim() !== "");
    if (validEmails.length === 0) {
      notifyError("Please enter at least one email address");
      return;
    }
    submitReferrals.mutate({ emails: validEmails });
  };

  const hasValidEmails = emails.some((email) => email.trim() !== "");

  return (
    <Center pt={80} px={{ base: undefined, md: 200 }}>
      <Stack align="center" gap={"lg"} maw={600} w="100%">
        <Title order={1} ta={"center"}>
          THANK YOU FOR YOUR SUPPORT!
        </Title>
        <Text ta={"center"} size={"lg"}>
          You&apos;ll will receive a notification at the end of the campaign.
          You will only be charged if the campaign is successful.
        </Text>

        <ClubImage club={club} size={240} />

        <Box w="100%" mt="xl">
          <Stack gap="md">
            <Title order={3} ta="center">
              Know someone who&apos;d love to join?
            </Title>
            <Text ta="center" size="sm" c="dimmed">
              Share up to 5 email addresses and we&apos;ll send them a personal
              invite
            </Text>

            {emails.map((email, index) => (
              <TextInput
                key={index}
                placeholder={`Email ${index + 1} (optional)`}
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                type="email"
              />
            ))}

            <Group justify="center" mt="md">
              <Button
                onClick={handleSubmit}
                loading={submitReferrals.isPending}
                disabled={!hasValidEmails}
              >
                Send Invites
              </Button>
            </Group>

            {hasSubmitted && (
              <Text ta="center" c="green" size="sm">
                Thank you! We&apos;ll reach out to your referrals soon.
              </Text>
            )}
          </Stack>
        </Box>

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
