import { TemplateTheme } from "~/client/theme/templates";
import React, { useEffect } from "react";
import { Maybe } from "~/utils/types";
import { Box, useMantineColorScheme } from "@mantine/core";

type WithTemplateThemeProps = {
  children: React.ReactNode;
  theme: Maybe<TemplateTheme>;
};

export default function WithTemplateTheme({
  children,
  theme
}: WithTemplateThemeProps) {
  // set color scheme based on if theme `isDark`
  const { setColorScheme } = useMantineColorScheme();
  useEffect(() => {
    setColorScheme(null === theme || !theme.isDark ? "light" : "dark");
    return () => {
      // revert to default color scheme
      setColorScheme("light");
    };
  }, [theme]);

  if (null === theme) {
    return children;
  }

  return (
    <Box pos="relative" w={"100%"} h={"100%"}>
      <Box
        w={"100%"}
        h={"100%"}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -999,
          backgroundImage: theme.backgroundFileName
            ? `url(/templates/background/${theme.isDark ? "dark/" : "light/"}${theme.backgroundFileName})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />
      {children}
    </Box>
  );
}
