import "@mantine/core/styles.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import React from "react";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider
} from "@mantine/core";
import { theme } from "~/client/theme";
import { HydrateClient } from "~/trpc/server";
import { HEADER_BAR_HEIGHT, HeaderBar } from "~/client/components/HeaderBar";

export const metadata: Metadata = {
  title: "Build IRL",
  description: "Supercharging builders of IRL communities",
  icons: [{ rel: "icon", url: "/favicon.ico" }]
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme={"auto"} />
      </head>
      <body className={GeistSans.className}>
        <TRPCReactProvider>
          <MantineProvider theme={theme}>
            <HydrateClient>
              <AppShell header={{ height: HEADER_BAR_HEIGHT }}>
                <AppShellHeader>
                  <HeaderBar />
                </AppShellHeader>
                <AppShellMain h={"100%"}>{children}</AppShellMain>
              </AppShell>
            </HydrateClient>
          </MantineProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
