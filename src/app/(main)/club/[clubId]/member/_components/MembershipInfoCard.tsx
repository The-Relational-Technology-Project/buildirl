import React from "react";
import {
  Box,
  Group,
  Stack,
  Text,
  Title,
  SimpleGrid,
  Paper
} from "@mantine/core";
import {
  IconMail,
  IconCalendar,
  IconCoin,
  IconMenu4,
  IconUser
} from "@tabler/icons-react";
import { Membership } from "~/server/membership/types";
import { toDisplayDate, billingIntervalLabel } from "~/client/utils";
import ColorSchemeAwareThemeIcon from "~/client/components/ColorSchemeAwareThemeIcon";
import RoleBadge from "~/client/components/RoleBadge";

type MembershipInfoCardProps = {
  membership: Membership;
};

export default function MembershipInfoCard({
  membership
}: MembershipInfoCardProps) {
  return (
    <Paper p={"xl"}>
      <Stack gap="lg">
        <Title order={4} fw={500} ta="center">
          Member Information
        </Title>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Group gap="xs">
            <ColorSchemeAwareThemeIcon size="xs">
              <IconMenu4 size={18} />
            </ColorSchemeAwareThemeIcon>
            <Text size="sm" fw={500}>
              Tier:
            </Text>
            <Text size="sm">{membership.membershipTier.name}</Text>
          </Group>

          <Group gap="xs">
            <ColorSchemeAwareThemeIcon size="xs">
              <IconCoin size={18} />
            </ColorSchemeAwareThemeIcon>
            <Text size="sm" fw={500}>
              Contribution:
            </Text>
            <Text size="sm">
              {`$${membership.membershipTier.costPerBillingInterval}.00/${billingIntervalLabel(membership.membershipTier.billingInterval)}`}
            </Text>
          </Group>

          {membership.status === "ACTIVE" && (
            <Group gap="xs">
              <ColorSchemeAwareThemeIcon size="xs">
                <IconUser size={18} />
              </ColorSchemeAwareThemeIcon>
              <Text size="sm" fw={500}>
                Role:
              </Text>
              <RoleBadge role={membership.role} />
            </Group>
          )}

          {membership.status === "PENDING" && (
            <Group gap="xs">
              <ColorSchemeAwareThemeIcon size="xs">
                <IconCalendar size={18} />
              </ColorSchemeAwareThemeIcon>
              <Text size="sm" fw={500}>
                Applied:
              </Text>
              <Text size="sm">{toDisplayDate(membership.createdAt)}</Text>
            </Group>
          )}

          {membership.email && (
            <Group gap="xs">
              <ColorSchemeAwareThemeIcon size="xs">
                <IconMail size={18} />
              </ColorSchemeAwareThemeIcon>
              <Text size="sm" fw={500}>
                Email:
              </Text>
              <Box
                component="a"
                href={`mailto:${membership.email}`}
                style={{
                  color: "inherit",
                  cursor: "pointer",
                  textDecoration: "none"
                }}
              >
                <Text size="sm" style={{ wordBreak: "break-all" }}>
                  {membership.email}
                </Text>
              </Box>
            </Group>
          )}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
