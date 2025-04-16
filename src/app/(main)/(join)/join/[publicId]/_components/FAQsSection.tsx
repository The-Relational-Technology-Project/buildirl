import { Accordion, Box, Text, Title } from "@mantine/core";
import { FAQs } from "~/server/service/types";

type FAQsSectionProps = {
  faqs: FAQs;
};

export default function FAQsSection({ faqs }: FAQsSectionProps) {
  // If there are no FAQs, don't render the section
  if (!faqs.items || faqs.items.length === 0) {
    return null;
  }

  return (
    <Box my={48}>
      <Title order={2} mb={24} ta="center">
        Frequently Asked Questions
      </Title>
      <Accordion>
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