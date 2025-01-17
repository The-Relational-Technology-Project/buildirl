import "~/styles/globals.css";

import {GeistSans} from "geist/font/sans";
import {type Metadata} from "next";

import {TRPCReactProvider} from "~/trpc/react";
import {ChakraProvider} from "@chakra-ui/react";
import {system} from "~/styles/theme";

export const metadata: Metadata = {
    title: "Build IRL",
    description: "Supercharging builders of IRL communities",
    icons: [{rel: "icon", url: "/favicon.ico"}]
};

export default function RootLayout({
                                       children
                                   }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
        <body className={GeistSans.className}>
        <TRPCReactProvider>
            <ChakraProvider value={system}>
                {children}
            </ChakraProvider>
        </TRPCReactProvider>
        </body>
        </html>
    );
}
