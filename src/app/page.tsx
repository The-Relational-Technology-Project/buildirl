import { HydrateClient } from "~/trpc/server";
import React from "react";
import { Text } from "@chakra-ui/react";

export default async function Home() {
  return (
    <HydrateClient>
      <Text>Hello world!</Text>
    </HydrateClient>
  );
}
