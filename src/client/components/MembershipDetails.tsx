import React from "react";
import { Box, Group, Stack, Text, Title, SimpleGrid } from "@mantine/core";
import { IconMail, IconCalendar, IconCoin } from "@tabler/icons-react";
import { Membership } from "~/server/service/types";
import { toDisplayDate } from "~/client/utils";
import ColorSchemeAwareThemeIcon from "~/client/components/ColorSchemeAwareThemeIcon";

type MembershipDetailsProps = {
  membership: Membership;
  isPending: boolean;
  title?: string;
};

export default function MembershipDetails({
  membership,
  isPending,
  title = "Member Information"
}: MembershipDetailsProps) {
  return (
    <Stack gap="md">
      <Title order={4} fw={500} ta="center">{title}</Title>
      
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <Group gap="xs">
          <ColorSchemeAwareThemeIcon size="xs">
            <IconCoin size={18} />
          </ColorSchemeAwareThemeIcon>
          <Text size="sm" fw={500}>Tier:</Text>
          <Text size="sm">{membership.membershipTier.name}</Text>
        </Group>
        
        <Group gap="xs">
          <ColorSchemeAwareThemeIcon size="xs">
            <IconCoin size={18} />
          </ColorSchemeAwareThemeIcon>
          <Text size="sm" fw={500}>Contribution:</Text>
          <Text size="sm">${membership.membershipTier.costPerMonthInUSD}.00/month</Text>
        </Group>
        
        {isPending && (
          <Group gap="xs">
            <ColorSchemeAwareThemeIcon size="xs">
              <IconCalendar size={18} />
            </ColorSchemeAwareThemeIcon>
            <Text size="sm" fw={500}>Applied:</Text>
            <Text size="sm">{toDisplayDate(membership.createdAt)}</Text>
          </Group>
        )}
        
        {membership.email && (
          <Group gap="xs">
            <ColorSchemeAwareThemeIcon size="xs">
              <IconMail size={18} />
            </ColorSchemeAwareThemeIcon>
            <Text size="sm" fw={500}>Email:</Text>
            <Box 
              component="a" 
              href={`mailto:${membership.email}`} 
              style={{ color: "inherit", cursor: "pointer", textDecoration: "none" }}
            >
              <Text size="sm" style={{ wordBreak: "break-all" }}>
                {membership.email}
              </Text>
            </Box>
          </Group>
        )}
      </SimpleGrid>
    </Stack>
  );
} 