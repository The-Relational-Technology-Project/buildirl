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
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { storageClient } from "~/client/utils/storageClient";

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
            variant={"transparent"}
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
              "&:hover": { color: "black" }
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
      src={"/images/logo-icon.svg"}
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
  const r = api.main.user.useQuery();

  QueryError.check({
    result: r,
    fieldName: "user"
  });

  const supabase = createComponentClient();
  return (
    isLoaded(r) && (
      <Box>
        <Menu position="bottom-end" shadow="md">
          <Menu.Target>
            <Avatar
              src={storageClient.userProfileImageUrl(r.data!.id)}
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
  return (
    <Flex
      h={HEADER_BAR_HEIGHT}
      align={"center"}
      justify={"center"}
      w={"100vw"}
      style={{
        backgroundColor: "#e7e2ca",
        borderBottom: "solid 1px black"
      }}
    >
      <LogoIcon />
      <Group justify="flex-start" w={{ base: undefined, md: PAGE_WIDTH }}>
        <NavigationLink Icon={IconHome} label={"Clubs"} navigateTo={"/"} />
        <NavigationLink
          Icon={IconBrandSafari}
          label={"Discover"}
          navigateTo={"https://buildirl.com/clubs"}
        />
      </Group>
      <ProfileMenu />
    </Flex>
  );
}
