import {
  TEMPLATE_THEME_SELECTION,
  TemplateTheme
} from "~/client/theme/templates";
import {
  Box,
  BoxProps,
  Center,
  Text,
  ThemeIcon,
  useMantineColorScheme,
  useMantineTheme,
  useMatches
} from "@mantine/core";
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
        top: 8,
        right: 8
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

export default function ThemeSelector({
  value,
  onChange,
  ...props
}: ThemeSelectorProps & BoxProps) {
  const size = useMatches({ base: 100, md: 150 });
  const textSize = useMatches({ base: "lg", md: "xl" });
  const mantineTheme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const mounted = useMounted();

  return (
    mounted && (
      <Box {...props}>
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
              w={size}
              h={size}
              style={{
                cursor: "pointer",
                border: "1px solid",
                position: "relative"
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

          {Object.entries(TEMPLATE_THEME_SELECTION).map(
            ([themeName, theme]) => (
              <Carousel.Slide key={themeName}>
                <Center
                  onClick={() => onChange(theme)}
                  p={16}
                  w={size}
                  h={size}
                  style={{
                    cursor: "pointer",
                    backgroundImage: `url(/templates/background/${theme.backgroundFileName})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    color: theme.isDark ? mantineTheme.colors.dark[1] : "black",
                    border: `1px solid ${colorScheme === "dark" ? mantineTheme.colors.dark[1] : "black"}`,
                    position: "relative"
                  }}
                >
                  <Text
                    size={textSize}
                    style={{
                      textAlign: "center"
                    }}
                  >
                    {themeName}
                  </Text>
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
