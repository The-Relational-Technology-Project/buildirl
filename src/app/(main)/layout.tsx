import "@mantine/core/styles.css";

import React from "react";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Box,
  Center
} from "@mantine/core";
import {
  HEADER_BAR_HEIGHT,
  HeaderBar,
  PAGE_WIDTH
} from "~/client/components/HeaderBar";
import { api } from "~/trpc/server";
import { createSSRClient } from "~/utils/supabase/auth/ssrClient";

export default async function MainLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  // we want to resolve this via supabase SSR to avoid `use client` for
  // the entire main route group
  const supabase = await createSSRClient();
  const r = await supabase.auth.getSession();
  if (!r.data.session) {
    return <PublicLayout>{children}</PublicLayout>;
  }
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

type LayoutProps = {
  children: React.ReactNode;
};

function AuthenticatedLayout({ children }: LayoutProps) {
  // Prefetching of user-authenticated data goes here
  void api.main.user.prefetch();
  void api.main.userOwnedClubs.prefetch();
  void api.main.userMemberships.prefetch();

  return (
    <AppShell header={{ height: HEADER_BAR_HEIGHT }}>
      <AppShellHeader>
        <HeaderBar />
      </AppShellHeader>
      <AppShellMain h={"100%"}>
        <Center>
          <Box w={{ base: "80vw", md: PAGE_WIDTH }}>{children}</Box>
        </Center>
      </AppShellMain>
    </AppShell>
  );
}

function PublicLayout({ children }: LayoutProps) {
  return (
    <Center h={"100%"}>
      <Box w={{ base: "80vw", md: PAGE_WIDTH }}>{children}</Box>
    </Center>
  );
}
