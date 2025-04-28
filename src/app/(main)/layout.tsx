import "@mantine/core/styles.css";

import React from "react";
import { AppShell, AppShellMain, Box, Center } from "@mantine/core";
import { HEADER_BAR_HEIGHT, PAGE_WIDTH } from "~/client/components/HeaderBar";
import HeaderBar from "~/client/components/HeaderBar";
import { api } from "~/trpc/server";
import { isUserAuthenticated } from "~/client/utils/auth";
import WithDefaultColorSchemeOnManualRouteChange from "~/client/components/WithDefaultColorSchemeOnManualRouteChange";
import ErrorBoundary from "~/client/components/ErrorBoundary";

export default async function MainLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  if (await isUserAuthenticated()) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }
  return <PublicLayout>{children}</PublicLayout>;
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
      <AppShellMain h={"100%"}>
        {/* We cannot use AppShellHeader because it doesn't work with transparency */}
        <HeaderBar />
        <WithDefaultColorSchemeOnManualRouteChange>
          <Center>
            <Box w={{ base: "100%", md: PAGE_WIDTH }} px={{ base: 30, md: 0 }}>
              <ErrorBoundary adjustForHeader>{children}</ErrorBoundary>
            </Box>
          </Center>
        </WithDefaultColorSchemeOnManualRouteChange>
      </AppShellMain>
    </AppShell>
  );
}

function PublicLayout({ children }: LayoutProps) {
  return (
    <AppShell header={{ height: HEADER_BAR_HEIGHT }}>
      <AppShellMain h={"100%"}>
        <WithDefaultColorSchemeOnManualRouteChange>
          <Center>
            <Box w={{ base: "100%", md: PAGE_WIDTH }} px={{ base: 30, md: 0 }}>
              <ErrorBoundary>{children}</ErrorBoundary>
            </Box>
          </Center>
        </WithDefaultColorSchemeOnManualRouteChange>
      </AppShellMain>
    </AppShell>
  );
}
