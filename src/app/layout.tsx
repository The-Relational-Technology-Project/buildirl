import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/carousel/styles.css";
import "src/client/styles/globals.css";
import "@mantine/tiptap/styles.css";

import { Unbounded, Work_Sans } from "next/font/google";

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
import { PostHogProvider } from "./providers";

export const metadata: Metadata = {
  title: "Build IRL",
  description: "Supercharging builders of IRL communities",
  icons: [{ rel: "icon", url: "/favicon.ico" }]
};

const unbounded = Unbounded({ subsets: ["latin"] });
const workSans = Work_Sans({ subsets: ["latin"] });

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
          href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Calistoga&family=Instrument+Serif:ital@0;1&family=Martian+Mono:wght@100..800&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Rozha+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <body className={`${unbounded.className} ${workSans.className}`}>
        <PostHogProvider>
          <TRPCReactProvider>
            <MantineProvider theme={theme} defaultColorScheme={"light"}>
              <HydrateClient>{children}</HydrateClient>
              <Notifications position={"bottom-center"} />
            </MantineProvider>
          </TRPCReactProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
