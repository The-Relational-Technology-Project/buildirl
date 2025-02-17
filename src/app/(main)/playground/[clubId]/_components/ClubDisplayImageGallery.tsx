import { Group, ScrollArea, Image } from "@mantine/core";
import { Club } from "~/server/service/types";

type ClubDisplayImageGalleryProps = {
  club: Club;
};

export default function ClubDisplayImageGallery({
  club
}: ClubDisplayImageGalleryProps) {
  return (
    <ScrollArea>
      <Group>
        {club?.displayImageUrls.map((url, index) => (
          <Image
            key={index}
            src={url}
            alt={`Club Image ${index}`}
            width={150}
          />
        ))}
      </Group>
    </ScrollArea>
  );
}
