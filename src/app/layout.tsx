import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import {Provider} from "~/components/ui/provider";

export const metadata: Metadata = {
  title: "Build IRL",
  description: "Supercharging builders of IRL communities",
  icons: [{ rel: "icon", url: "/favicon.ico" }]
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <TRPCReactProvider>
          <Provider>{children}</Provider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}