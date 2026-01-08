"use client";

import {
  Flex,
  Group,
  Text,
  ThemeIcon,
  Menu,
  Box,
  useMantineTheme,
  useMantineColorScheme,
  BoxProps,
  alpha,
  Image
} from "@mantine/core";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { IconHome, TablerIcon } from "@tabler/icons-react";
import { createComponentClient } from "~/utils/supabase/auth/client";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { useMounted } from "@mantine/hooks";
import UserAvatar from "~/client/components/UserAvatar";
import posthog from "posthog-js";

export const HEADER_BAR_HEIGHT = 50;
export const PAGE_WIDTH = 1300;

type NavigationLinkProps = {
  label: string;
  Icon: TablerIcon;
  navigateTo: string;
};

function NavigationLink({ label, navigateTo, Icon }: NavigationLinkProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const mounted = useMounted();

  const currentPath = usePathname();
  const isActive = currentPath === navigateTo;

  return (
    mounted && (
      <Group mr={"xxs"}>
        <Link href={navigateTo} style={{ textDecoration: "none" }}>
          <Box
            px="sm"
            py="xs"
            style={{
              borderRadius: theme.radius.sm,
              backgroundColor: isActive
                ? colorScheme === "dark"
                  ? alpha(theme.colors.blue[6], 0.2)
                  : alpha(theme.colors.blue[6], 0.1)
                : colorScheme === "dark"
                  ? alpha(theme.colors.dark[4], 0.3)
                  : alpha(theme.colors.gray[1], 0.8),
              transition: "all 150ms ease",
              cursor: "pointer"
            }}
          >
            <Group style={{ gap: 6 }}>
              <ThemeIcon
                size={"xs"}
                variant={"transparent"}
                c={
                  isActive
                    ? colorScheme === "dark"
                      ? theme.colors.blue[4]
                      : theme.colors.blue[6]
                    : colorScheme === "dark"
                      ? theme.colors.dark[1]
                      : theme.colors.gray[7]
                }
              >
                <Icon />
              </ThemeIcon>
              <Text
                c={
                  isActive
                    ? colorScheme === "dark"
                      ? theme.colors.blue[4]
                      : theme.colors.blue[6]
                    : colorScheme === "dark"
                      ? theme.colors.dark[1]
                      : theme.colors.gray[7]
                }
                size={"sm"}
                fw={500}
              >
                {label}
              </Text>
            </Group>
          </Box>
        </Link>
      </Group>
    )
  );
}

function ProfileMenu({ ...props }: BoxProps) {
  const router = useRouter();
  const user = api.main.user.useQuery();

  QueryError.check({
    result: user,
    fieldName: "user"
  });

  const supabase = createComponentClient();
  return (
    isLoaded(user) && (
      <Box {...props}>
        <Menu position="bottom-end" shadow="md">
          <Menu.Target>
            <UserAvatar
              user={user.data!}
              size={"sm"}
              style={{
                cursor: "pointer"
              }}
            />
          </Menu.Target>

          <Menu.Dropdown>
            <Text
              size={"sm"}
              px={"sm"}
              fw={500}
              onClick={() => router.push(`/user/${user.data!.id}`)}
              style={{ cursor: "pointer" }}
            >{`${user.data!.firstName} ${user.data!.lastName}`}</Text>
            <Menu.Divider />
            <Menu.Item
              onClick={() => {
                router.push(`/user/${user.data!.id}`);
              }}
            >
              View profile
            </Menu.Item>
            <Menu.Item onClick={() => router.push("/settings")}>
              Settings
            </Menu.Item>
            <Menu.Item
              onClick={async () => {
                await supabase.auth.signOut();
                posthog.reset();
                router.refresh();
              }}
            >
              Sign out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    )
  );
}

type HeaderBarProps = {
  isAuthenticated: boolean;
};

export default function HeaderBar({ isAuthenticated }: HeaderBarProps) {
  const { colorScheme } = useMantineColorScheme();
  // this is required to avoid hydration error because the components are
  // rendered conditionally on colorScheme
  const mounted = useMounted();

  return (
    mounted && (
      <Flex
        h={HEADER_BAR_HEIGHT}
        align={"center"}
        justify={"center"}
        w={"100vw"}
        style={{
          position: "fixed",
          top: 0,
          zIndex: 999,
          backgroundColor:
            colorScheme === "dark"
              ? alpha("#000000", 0.4)
              : alpha("#FFFFFF", 0.6)
        }}
      >
        <Group
          justify="space-between"
          w={{ base: "100%", md: PAGE_WIDTH }}
          px={{ base: "md", md: 0 }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <Image
              src="/images/buildirl_full_logo.png"
              alt="buildIRL"
              h={{ base: 28, sm: 32 }}
              w="auto"
            />
          </Link>
          {isAuthenticated && (
            <NavigationLink
              Icon={IconHome}
              label={"My Clubs"}
              navigateTo={"/"}
            />
          )}
        </Group>
        {isAuthenticated && (
          <ProfileMenu
            pos={"fixed"}
            style={{ position: "absolute", right: 10 }}
          />
        )}
      </Flex>
    )
  );
}
