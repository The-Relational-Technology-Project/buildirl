import "@mantine/core/styles.css";

import React from "react";
import { AppShell, AppShellHeader, AppShellMain } from "@mantine/core";
import { HEADER_BAR_HEIGHT, HeaderBar } from "~/client/components/HeaderBar";

export default function MainLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppShell header={{ height: HEADER_BAR_HEIGHT }}>
      <AppShellHeader>
        <HeaderBar />
      </AppShellHeader>
      <AppShellMain h={"100%"}>{children}</AppShellMain>
    </AppShell>
  );
}
