import { Accordion, Box, Text, Title, Divider } from "@mantine/core";
import { FAQs as FAQsType } from "~/server/service/types";

type FAQsProps = {
  faqs: FAQsType;
};

export default function FAQs({ faqs }: FAQsProps) {
  if (!faqs.items || faqs.items.length === 0) {
    return null;
  }

  return (
    <Box my={48}>
      <Title order={2} mb={24} ta="center">
        Frequently Asked Questions
      </Title>
      <Accordion>
        <Divider mb={-1} />
        {faqs.items.map((faq, index) => (
          <Accordion.Item key={index} value={`faq-${index}`}>
            <Accordion.Control>
              <Text fw={600}>{faq.question}</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Text>{faq.answer}</Text>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Box>
  );
} 