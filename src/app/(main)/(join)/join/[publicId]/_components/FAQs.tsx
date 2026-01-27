import {
  Accordion,
  Text,
  Title,
  Divider,
  BoxProps,
  Stack,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { FAQs as FAQsType } from "~/server/club/types";
import { Maybe } from "~/utils/types";

type FAQsProps = {
  faqs: FAQsType;
  themeHeadingFont: Maybe<string>;
};

export default function FAQs({
  faqs,
  themeHeadingFont,
  ...props
}: FAQsProps & BoxProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const borderRadius = 15;
  const isDark = colorScheme === "dark";
  const sectionTextColor = theme.other.dark.text;
  const sectionBorder = isDark
    ? `1px solid ${theme.other.dark.borderStrong}`
    : "2px solid #000";
  const sectionShadow = isDark
    ? `6px 6px 0px ${theme.other.dark.shadow}`
    : "6px 6px 0px #000";

  if (!faqs.items || faqs.items.length === 0) {
    return null;
  }

  return (
    <Stack
      {...props}
      bg={isDark ? theme.other.dark.surface : theme.colors.beige![1]}
      w={"100%"}
      p={28}
      mb={16}
      style={{
        border: sectionBorder,
        boxShadow: sectionShadow,
        borderRadius,
        color: isDark ? sectionTextColor : undefined
      }}
    >
      <Title
        order={2}
        mb={"lg"}
        ta="center"
        style={{
          fontFamily: themeHeadingFont ?? "inherit",
          textAlign: "center"
        }}
      >
        FAQs
      </Title>
      <Accordion>
        <Divider mb={-1} />
        {faqs.items.map((faq, index) => (
          <Accordion.Item key={index} value={`faq-${index}`}>
            <Accordion.Control>
              <Text fw={600}>{faq.question}</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Text style={{ whiteSpace: "pre-line" }}>
                {faq.answer}
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}
