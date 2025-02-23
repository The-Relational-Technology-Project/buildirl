"use client";

import { Stack, Title, Button, Text, Image, Center } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";

export default function ApplicationCompleted() {
  const params = useParams<{ publicId: string }>();
  const router = useRouter();

  return (
    <Center pt={80} px={40}>
      <Stack align="center" gap={"xs"}>
        <Title order={3}>Thank you for applying!</Title>
        <Text>Your application is being reviewed.</Text>

        <Image
          src={"/images/books.png"}
          h={120}
          w={120}
          alt={"books"}
          mt={"lg"}
        />

        <Button
          variant="filled"
          color="black"
          size="lg"
          mt={"xl"}
          onClick={() => {
            router.push(`/join/${params.publicId}/`);
          }}
        >
          Back
        </Button>
      </Stack>
    </Center>
  );
}
