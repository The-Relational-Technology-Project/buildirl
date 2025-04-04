import { Maybe } from "~/utils/types";
import { FONT_SELECTION } from "~/client/theme/templates";
import React from "react";
import {
  Box,
  Center,
  Text,
  ThemeIcon,
  useMantineColorScheme,
  useMantineTheme,
  useMatches
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { useMounted } from "@mantine/hooks";

function CheckIcon() {
  return (
    <ThemeIcon
      variant={"transparent"}
      color={"green"}
      size={24}
      style={{
        position: "absolute",
        top: 4,
        right: 6
      }}
    >
      <IconCircleCheckFilled />
    </ThemeIcon>
  );
}

type FontSelectorProps = {
  value: Maybe<string>;
  onChange: (font: Maybe<string>) => void;
};

export default function FontSelector({ value, onChange }: FontSelectorProps) {
  const size = useMatches({ base: 50, md: 60 });
  const textSize = useMatches({ base: "md", md: "lg" });
  const mantineTheme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const mounted = useMounted();

  return (
    mounted && (
      <Box>
        <Carousel
          slideSize={size}
          slideGap={"md"}
          align="start"
          withControls={false}
        >
          <Carousel.Slide key={"none"}>
            <Center
              onClick={() => onChange(null)}
              p={16}
              w={size * 3}
              h={size}
              style={{
                cursor: "pointer",
                border: "1px solid",
                position: "relative",
                borderRadius: 180
              }}
            >
              <Text
                size={textSize}
                style={{
                  textAlign: "center"
                }}
              >
                Default
              </Text>
              {value === null && <CheckIcon />}
            </Center>
          </Carousel.Slide>

          {FONT_SELECTION.map((font) => (
            <Carousel.Slide key={font}>
              <Center
                onClick={() => onChange(font)}
                p={16}
                w={size * 3}
                h={size}
                style={{
                  cursor: "pointer",
                  border: `1px solid ${colorScheme === "dark" ? mantineTheme.colors.dark[1] : "black"}`,
                  position: "relative",
                  borderRadius: 180
                }}
              >
                <Text
                  size={textSize}
                  style={{
                    textAlign: "center",
                    fontFamily: font
                  }}
                >
                  {font}
                </Text>
                {value === font && <CheckIcon />}
              </Center>
            </Carousel.Slide>
          ))}
        </Carousel>
      </Box>
    )
  );
}
