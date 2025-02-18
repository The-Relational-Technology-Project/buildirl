import { Group, ScrollArea, Image, Center, Box } from "@mantine/core";
import { Club } from "~/server/service/types";

type ClubDisplayImageGalleryProps = {
  club: Club;
};

export default function ClubDisplayImageGallery({
  club
}: ClubDisplayImageGalleryProps) {
  return (
    club.displayImageUrls.length !== 0 && (
      <Group w={"100%"} justify={"center"}>
        <ScrollArea type="never" h={160}>
          <Group w={"max-content"}>
            {club?.displayImageUrls.map((url, index) => (
              <Center key={index} style={{ border: "2px black solid" }}>
                <Image src={url} h={150} w={150} />
              </Center>
            ))}
          </Group>
        </ScrollArea>
      </Group>
    )
  );
}
