import { Group, ScrollArea, Image, useMatches, Paper } from "@mantine/core";
import { Club } from "~/server/service/types";

type ClubDisplayImageGalleryProps = {
  club: Club;
};

export default function ClubDisplayImageGallery({
  club
}: ClubDisplayImageGalleryProps) {
  const size = useMatches({ base: 150, md: 250 });

  return (
    club.displayImageUrls.length !== 0 && (
      <Group w={"100%"} justify={"center"}>
        <ScrollArea type="never" h={size + 10}>
          <Group w={"max-content"} px={4}>
            {club?.displayImageUrls.map((url, index) => (
              <Paper key={index}>
                <Image src={url} h={size} w={size} />
              </Paper>
            ))}
          </Group>
        </ScrollArea>
      </Group>
    )
  );
}
