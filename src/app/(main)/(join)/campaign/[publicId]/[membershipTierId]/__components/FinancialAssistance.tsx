// !! PROTOTYPE

"use client";

import {
  Container,
  Stack,
  Title,
  Text,
  Anchor,
  Group,
  ThemeIcon
} from "@mantine/core";
import { IconHeart } from "@tabler/icons-react";
import SectionCard from "./SectionCard";

export default function FinancialAssistance() {
  return (
    <Container size="lg" py={{ base: 16, md: 32 }}>
      <SectionCard>
        <Stack gap="lg" ta="center" align="center">
          <Group gap="sm" justify="center">
            <ThemeIcon
              size="lg"
              radius="xl"
              variant="transparent"
              color="lilac"
            >
              <IconHeart size={20} />
            </ThemeIcon>
            <Title order={2} fz={{ base: 20, md: 24 }}>
              Need financial assistance?
            </Title>
          </Group>

          <Text
            fz={{ base: "sm", md: "md" }}
            c="dark.3"
            maw={600}
            style={{ lineHeight: 1.6 }}
          >
            We don’t want finances to keep you from joining. Reach out, and
            we’ll find other ways for you to contribute!
          </Text>

          <Anchor
            href="mailto:team@buildirl.com"
            fz={{ base: "sm", md: "md" }}
            fw={500}
            style={{
              color: "#7A3EDA",
              textDecoration: "none",
              transition: "all 0.2s ease",
              "&:hover": {
                textDecoration: "underline"
              }
            }}
          >
            Email us at team@buildirl.com
          </Anchor>
        </Stack>
      </SectionCard>
    </Container>
  );
}
