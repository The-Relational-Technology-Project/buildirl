import {
  Group,
  Image,
  useMatches,
  Box,
  GroupProps,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Club } from "~/server/club/types";

type ClubDisplayImageGalleryProps = {
  club: Club;
};

export default function ClubDisplayImageGallery({
  club,
  ...props
}: ClubDisplayImageGalleryProps & GroupProps) {
  const size = useMatches({ base: 250, md: 250 });
  const framePadding = { top: 12, side: 12, bottom: 48 };
  const frameWidth = size + framePadding.side * 2 + 4;
  const slideSize = frameWidth + 24;
  const borderRadius = 15;
  const rotations = [-4, 2, 4, -2, 3];
  const autoplay = Autoplay({ delay: 2000, stopOnInteraction: false });
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const frameBorder = isDark
    ? `1px solid ${theme.other.dark.borderStrong}`
    : "2px solid #000";
  const frameBackground = isDark ? "#5E5E5E" : "#fff";
  const frameShadow = isDark
    ? `6px 6px 0px ${theme.other.dark.shadow}`
    : "6px 6px 0px #000";

  return (
    club.displayImageUrls.length !== 0 && (
      <Group w={"100%"} justify={"center"} {...props}>
        <Carousel
          slideSize={slideSize}
          slideGap={24}
          align="start"
          plugins={[autoplay]}
          loop
          withControls={false}
          w="100%"
          styles={{
            root: {
              overflow: "hidden"
            },
            viewport: {
              paddingLeft: 12,
              paddingRight: 24,
              paddingBottom: 12
            }
          }}
        >
          {club?.displayImageUrls.map((url, index) => (
            <Carousel.Slide
              key={index}
              py={12}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <Box
                style={{
                  backgroundColor: frameBackground,
                  border: frameBorder,
                  borderRadius,
                  boxShadow: frameShadow,
                  padding: `${framePadding.top}px ${framePadding.side}px ${framePadding.bottom}px`,
                  transform: `rotate(${rotations[index % rotations.length]}deg)`,
                  transformOrigin: "center"
                }}
              >
                <Image
                  src={url}
                  h={size}
                  w={size}
                  radius={3}
                  bd={"1px gray solid"}
                  style={{ display: "block" }}
                  alt={`Club photo ${index + 1}`}
                />
              </Box>
            </Carousel.Slide>
          ))}
        </Carousel>
      </Group>
    )
  );
}
