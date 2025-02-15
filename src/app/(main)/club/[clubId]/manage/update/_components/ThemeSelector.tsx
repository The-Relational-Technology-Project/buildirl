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
  useMantineTheme
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { Maybe } from "~/utils/types";
import { IconCircleCheckFilled } from "@tabler/icons-react";

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

export function ThemeSelector({
  value,
  onChange,
  ...props
}: ThemeSelectorProps & BoxProps) {
  const mantineTheme = useMantineTheme();

  return (
    <Box {...props}>
      <Carousel
        slideSize="33.333333%"
        slideGap={"md"}
        align="start"
        withControls={false}
      >
        <Carousel.Slide key={"none"}>
          <Center
            onClick={() => onChange(null)}
            p={16}
            w={150}
            h={150}
            style={{
              cursor: "pointer",
              border: "1px solid black",
              position: "relative"
            }}
          >
            <Text>Default</Text>
            {value === null && <CheckIcon />}
          </Center>
        </Carousel.Slide>

        {Object.entries(TEMPLATE_THEME_SELECTION).map(([themeName, theme]) => (
          <Carousel.Slide key={themeName}>
            <Center
              onClick={() => onChange(theme)}
              p={16}
              w={150}
              h={150}
              style={{
                cursor: "pointer",
                backgroundImage: `url(/templates/background/${theme.backgroundFileName})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                color: theme.isDark ? mantineTheme.colors.dark[1] : "black",
                fontFamily: theme.headingFontFamily,
                border: "1px solid black",
                position: "relative"
              }}
            >
              <Text>{themeName}</Text>
              {value?.backgroundFileName === theme.backgroundFileName && (
                <CheckIcon />
              )}
            </Center>
          </Carousel.Slide>
        ))}
      </Carousel>
    </Box>
  );
}
