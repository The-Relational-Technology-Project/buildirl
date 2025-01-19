"use client";

import {
  Flex,
  Group,
  Text,
  ThemeIcon,
  Image,
  Menu,
  Avatar,
  Box
} from "@mantine/core";

export const HEADER_BAR_HEIGHT = 50;
export const PAGE_WIDTH = 800;

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { IconBrandSafari, IconHome, TablerIcon } from "@tabler/icons-react";
import { createComponentClient } from "~/utils/supabase/auth/client";

type NavigationLinkProps = {
  label: string;
  Icon: TablerIcon;
  navigateTo: string;
};

function NavigationLink({ label, navigateTo, Icon }: NavigationLinkProps) {
  const currentPath = usePathname();
  return (
    <Group mr={"xxs"}>
      <Link href={navigateTo} style={{ textDecoration: "none" }}>
        <Group style={{ gap: 4 }}>
          <ThemeIcon
            size={"xs"}
            variant={"white"}
            c={currentPath === navigateTo ? "black" : "dimmed"}
            style={{
              backgroundColor: "transparent",
              "&:hover": { color: "black" }
            }}
          >
            <Icon />
          </ThemeIcon>
          <Text
            c={currentPath === navigateTo ? "black" : "dimmed"}
            size={"sm"}
            fw={500}
            style={{
              "&:hover": { color: "black" },
              borderColor: "black",
              borderWidth: 1
            }}
          >
            {label}
          </Text>
        </Group>
      </Link>
    </Group>
  );
}

function LogoIcon() {
  return (
    <Image
      src={"/logo-icon.svg"}
      w={15}
      h={20}
      style={{
        position: "fixed",
        left: 20
      }}
    />
  );
}

function ProfileMenu() {
  const router = useRouter();
  const supabase = createComponentClient();
  return (
    <Box>
      <Menu position="bottom-end" shadow="md">
        <Menu.Target>
          <Avatar
            size="md"
            style={{
              cursor: "pointer",
              position: "fixed",
              top: 8,
              right: 10
            }}
          />
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            onClick={() => {
              router.push("/my-profile");
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
  );
}

export function HeaderBar() {
  return (
    <Flex
      h={HEADER_BAR_HEIGHT}
      align={"center"}
      justify={"center"}
      style={{
        backgroundColor: "#dde2fa"
      }}
    >
      <LogoIcon />
      <Group justify="flex-start" w={{ base: undefined, md: PAGE_WIDTH }}>
        <NavigationLink Icon={IconHome} label={"Clubs"} navigateTo={"/"} />
        <NavigationLink
          Icon={IconBrandSafari}
          label={"Discover"}
          navigateTo={"/discover"}
        />
      </Group>
      <ProfileMenu />
    </Flex>
  );
}
