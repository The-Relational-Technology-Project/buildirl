import {
  Group,
  ScrollArea,
  Image,
  useMatches,
  Paper,
  GroupProps
} from "@mantine/core";
import { Club } from "~/server/service/types";

type ClubDisplayImageGalleryProps = {
  club: Club;
};

export default function ClubDisplayImageGallery({
  club,
  ...props
}: ClubDisplayImageGalleryProps & GroupProps) {
  const size = useMatches({ base: 240, md: 300 });

  return (
    club.displayImageUrls.length !== 0 && (
      <Group w={"100%"} justify={"center"} {...props}>
        <ScrollArea type="never" h={size + 10}>
          <Group w={"max-content"} px={4}>
            {club?.displayImageUrls.map((url, index) => (
              // remove the shadow
              <Paper key={index} style={{ border: "1px solid" }}>
                <Image src={url} h={size} w={size} />
              </Paper>
            ))}
          </Group>
        </ScrollArea>
      </Group>
    )
  );
}
