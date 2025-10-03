// !! PROTOTYPE

"use client";

import {
  Container,
  Stack,
  Title,
  Text,
  Button,
  Group,
  ThemeIcon
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import SectionCard from "./SectionCard";
import { CampaignConfiguration } from "~/app/(main)/(join)/campaign/[publicId]/config";

type FindOutMoreProps = {
  campaignConfiguration: CampaignConfiguration;
};

export default function FindOutMore({
  campaignConfiguration
}: FindOutMoreProps) {
  return (
    <Container size="lg" py={{ base: 16, md: 32 }}>
      <SectionCard>
        <Stack gap="lg" ta="center" align="center">
          <Group gap="sm" justify="center">
            <Title order={2} fz={{ base: 20, md: 24 }}>
              Not sure? Find out more about us
            </Title>
          </Group>

          <Button
            component="a"
            href={campaignConfiguration.clubWebsite}
            target="_blank"
            rel="noopener noreferrer"
            size="md"
            radius="md"
            variant="outline"
            style={{
              borderColor: "#7A3EDA",
              color: "#7A3EDA",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#7A3EDA",
                color: "white"
              }
            }}
          >
            Visit our website
          </Button>
        </Stack>
      </SectionCard>
    </Container>
  );
}
