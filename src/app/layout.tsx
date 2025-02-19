import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/carousel/styles.css";
import "src/client/styles/globals.css";

import { Manrope } from "next/font/google";

import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import React from "react";
import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider
} from "@mantine/core";
import { theme } from "~/client/theme/theme";
import { HydrateClient } from "~/trpc/server";
import { Notifications } from "@mantine/notifications";

export const metadata: Metadata = {
  title: "Build IRL",
  description: "Supercharging builders of IRL communities",
  icons: [{ rel: "icon", url: "/favicon.ico" }]
};

const manrope = Manrope({ subsets: ["latin"] });

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme={"light"} />
      </head>
      <body className={manrope.className}>
        <TRPCReactProvider>
          <MantineProvider theme={theme} defaultColorScheme={"light"}>
            <HydrateClient>{children}</HydrateClient>
            <Notifications position={"bottom-center"} />
          </MantineProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
