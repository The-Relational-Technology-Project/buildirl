import "@mantine/core/styles.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import React from "react";
import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider
} from "@mantine/core";
import { theme } from "~/client/theme";

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
          <MantineProvider theme={theme}>{children}</MantineProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
