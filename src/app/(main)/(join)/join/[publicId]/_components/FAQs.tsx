import {
  Accordion,
  Text,
  Title,
  Divider,
  BoxProps,
  Stack
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
  if (!faqs.items || faqs.items.length === 0) {
    return null;
  }

  return (
    <Stack {...props} bg={"ivory"} w={"100%"} p={28} bdrs={4} mb={16}>
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
              <Text style={{ whiteSpace: "pre-line" }}>{faq.answer}</Text>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}
