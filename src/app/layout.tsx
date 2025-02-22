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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/**
            Some optimization can be made here with self-hosted fonts and selective loading
            https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
         */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin={"anonymous"}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Moon+Dance&display=swap"
          rel="stylesheet"
        />
      </head>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
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
