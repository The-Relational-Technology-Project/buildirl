"use client";

import {
  Flex,
  Group,
  Text,
  ThemeIcon,
  Image,
  Menu,
  Box,
  useMantineTheme,
  useMantineColorScheme,
  BoxProps,
  ImageProps
} from "@mantine/core";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { IconBrandSafari, IconHome, TablerIcon } from "@tabler/icons-react";
import { createComponentClient } from "~/utils/supabase/auth/client";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { useMounted } from "@mantine/hooks";
import UserAvatar from "~/client/components/UserAvatar";

export const HEADER_BAR_HEIGHT = 50;
export const PAGE_WIDTH = 800;

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

  return (
    mounted && (
      <Group mr={"xxs"}>
        <Link href={navigateTo} style={{ textDecoration: "none" }}>
          <Group style={{ gap: 4 }}>
            <ThemeIcon
              size={"xs"}
              variant={"transparent"}
              c={
                currentPath === navigateTo
                  ? colorScheme === "dark"
                    ? theme.colors.dark[1]
                    : "black"
                  : "dimmed"
              }
            >
              <Icon />
            </ThemeIcon>
            <Text
              c={
                currentPath === navigateTo
                  ? colorScheme === "dark"
                    ? theme.colors.dark[1]
                    : "black"
                  : "dimmed"
              }
              size={"sm"}
              fw={500}
            >
              {label}
            </Text>
          </Group>
        </Link>
      </Group>
    )
  );
}

function LogoIcon({ ...props }: ImageProps) {
  return <Image src={"/images/logo-icon.svg"} w={15} h={20} {...props} />;
}

function ProfileMenu({ ...props }: BoxProps) {
  const router = useRouter();
  const r = api.main.user.useQuery();

  QueryError.check({
    result: r,
    fieldName: "user"
  });

  const supabase = createComponentClient();
  return (
    isLoaded(r) && (
      <Box {...props}>
        <Menu position="bottom-end" shadow="md">
          <Menu.Target>
            <UserAvatar
              user={r.data!}
              size={"sm"}
              style={{
                cursor: "pointer"
              }}
            />
          </Menu.Target>

          <Menu.Dropdown>
            <Text
              pl={"sm"}
              size={"sm"}
              fw={500}
              onClick={() => router.push(`/user/${r.data!.id}`)}
              style={{ cursor: "pointer" }}
            >{`${r.data!.firstName} ${r.data!.lastName}`}</Text>
            <Menu.Divider />
            <Menu.Item
              onClick={() => {
                router.push(`/user/${r.data!.id}`);
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

export default function HeaderBar() {
  const theme = useMantineTheme();
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
          position: "relative",
          backgroundColor:
            colorScheme === "dark" ? theme.colors.dark[7] : "#e7e2ca",
          borderBottom: `solid 1px ${colorScheme === "dark" ? theme.colors.dark[4] : "black"}`
        }}
      >
        <LogoIcon
          style={{
            position: "absolute",
            left: 10
          }}
        />
        <Group justify="flex-start" w={{ base: undefined, md: PAGE_WIDTH }}>
          <NavigationLink Icon={IconHome} label={"Clubs"} navigateTo={"/"} />
          <NavigationLink
            Icon={IconBrandSafari}
            label={"Discover"}
            navigateTo={"https://buildirl.com/clubs"}
          />
        </Group>
        <ProfileMenu
          pos={"fixed"}
          style={{ position: "absolute", right: 10 }}
        />
      </Flex>
    )
  );
}
