import {
  TEMPLATE_THEME_SELECTION,
  TemplateTheme
} from "~/client/theme/templates";
import {
  Box,
  Center,
  ThemeIcon,
  useMantineColorScheme,
  useMantineTheme,
  useMatches
} from "@mantine/core";
import Image from "next/image";
import { Carousel } from "@mantine/carousel";
import { Maybe } from "~/utils/types";
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
        top: 12,
        right: 12
      }}
    >
      <IconCircleCheckFilled />
    </ThemeIcon>
  );
}

type ThemeSelectorProps = {
  value: Maybe<TemplateTheme>;
  onChange: (theme: Maybe<TemplateTheme>) => void;
};

export default function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const size = useMatches({ base: 80, md: 100 });
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
          loop={true}
          withControls={true}
        >
          <Carousel.Slide key={"none"}>
            <Center
              onClick={() => onChange(null)}
              p={16}
              w={size}
              h={size}
              style={{
                cursor: "pointer",
                border: "1px solid",
                position: "relative",
                borderRadius: 360
              }}
            >
              {value === null && <CheckIcon />}
            </Center>
          </Carousel.Slide>

          {Object.entries(TEMPLATE_THEME_SELECTION).map(
            ([themeName, theme]) => (
              <Carousel.Slide key={themeName}>
                <Center
                  onClick={() => onChange(theme)}
                  w={size}
                  h={size}
                  style={{
                    cursor: "pointer",
                    position: "relative",
                    color: theme.isDark ? mantineTheme.colors.dark[1] : "black",
                    border: `1px solid ${colorScheme === "dark" ? mantineTheme.colors.dark[1] : "black"}`,
                    borderRadius: 360,
                    overflow: "hidden"
                  }}
                >
                  {/* use next/image for its image compression/optimization */}
                  <Image
                    alt={theme.backgroundFileName}
                    src={`/templates/background/${theme.isDark ? "dark/" : "light/"}${theme.backgroundFileName}`}
                    fill={true}
                    style={{
                      objectFit: "cover"
                    }}
                  />
                  {value?.backgroundFileName === theme.backgroundFileName && (
                    <CheckIcon />
                  )}
                </Center>
              </Carousel.Slide>
            )
          )}
        </Carousel>
      </Box>
    )
  );
}
