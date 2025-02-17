import { Group, ScrollArea, Image, Center } from "@mantine/core";
import { Club } from "~/server/service/types";

type ClubDisplayImageGalleryProps = {
  club: Club;
};

export default function ClubDisplayImageGallery({
  club
}: ClubDisplayImageGalleryProps) {
  return (
    <ScrollArea type="never" h={160}>
      <Group w={"max-content"}>
        {club?.displayImageUrls.map((url, index) => (
          <Center style={{ border: "2px black solid" }}>
            <Image key={index} src={url} h={150} w={150} />
          </Center>
        ))}
      </Group>
    </ScrollArea>
  );
}
