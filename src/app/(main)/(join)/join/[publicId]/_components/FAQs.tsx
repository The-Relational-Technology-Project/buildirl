import { Accordion, Box, Text, Title, Divider, BoxProps } from "@mantine/core";
import { FAQs as FAQsType } from "~/server/service/types";

type FAQsProps = {
  faqs: FAQsType;
};

export default function FAQs({ faqs, ...props }: FAQsProps & BoxProps) {
  if (!faqs.items || faqs.items.length === 0) {
    return null;
  }

  return (
    <Box {...props} w={{ base: "300", md: "500" }}>
      <Title order={2} mb={"lg"} ta="center">
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
    </Box>
  );
}
