"use client";

import { Flex, Group, Text, ThemeIcon } from "@mantine/core";

export const HEADER_BAR_HEIGHT = 50;
export const PAGE_WIDTH = 800;

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { IconBrandSafari, IconHome, TablerIcon } from "@tabler/icons-react";

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

export function HeaderBar() {
  return (
    <Flex h={HEADER_BAR_HEIGHT} align={"center"} justify={"center"}>
      <Group justify="flex-start" w={PAGE_WIDTH}>
        <NavigationLink Icon={IconHome} label={"Clubs"} navigateTo={"/"} />
        <NavigationLink
          Icon={IconBrandSafari}
          label={"Discover"}
          navigateTo={"/discover"}
        />
      </Group>
    </Flex>
  );
}
