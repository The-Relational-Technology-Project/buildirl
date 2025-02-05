import { z } from "zod";

enum FormQuestionType {
  SHORT_TEXT = "SHORT_TEXT",
  LONG_TEXT = "LONG_TEXT",
  SINGLE_SELECT = "SINGLE_SELECT",
  MULTI_SELECT = "MULTI_SELECT"
}

const FormQuestionTypeSchema = z.nativeEnum(FormQuestionType);

const BaseFormQuestionSchema = z.object({
  question: z
    .string()
    .min(10, "Length must be >= 10")
    .max(300, "Length must be <= 300"),
  type: FormQuestionTypeSchema
});

/**
 * Question-type specific schema and metadata definitions
 */

const ShortTextQuestionSchema = BaseFormQuestionSchema.extend({
  type: z.literal(FormQuestionType.SHORT_TEXT),
  metadata: z.undefined().optional()
});

const LongTextQuestionSchema = BaseFormQuestionSchema.extend({
  type: z.literal(FormQuestionType.LONG_TEXT),
  metadata: z.undefined().optional()
});

const SelectQuestionMetadataSchema = z.object({
  choices: z.array(z.string()).min(2, "At least two choice is required")
});

const SingleSelectQuestionSchema = BaseFormQuestionSchema.extend({
  type: z.literal(FormQuestionType.SINGLE_SELECT),
  metadata: SelectQuestionMetadataSchema
});

const MultiSelectQuestionSchema = BaseFormQuestionSchema.extend({
  type: z.literal(FormQuestionType.MULTI_SELECT),
  metadata: SelectQuestionMetadataSchema
});

const FormQuestionSchema = z.discriminatedUnion("type", [
  ShortTextQuestionSchema,
  LongTextQuestionSchema,
  SingleSelectQuestionSchema,
  MultiSelectQuestionSchema
]);

export const FormQuestionsSchema = z.array(FormQuestionSchema);
export type FormQuestions = z.infer<typeof FormQuestionsSchema>;

export const FormResponsesSchema = z.array(
  z.discriminatedUnion("type", [
    ShortTextQuestionSchema.extend({
      response: z
        .string()
        .min(3, "Length must be >= 3")
        .max(150, "Length must be <= 150")
    }),
    LongTextQuestionSchema.extend({
      response: z
        .string()
        .min(10, "Length must be >= 10")
        .max(1000, "Length must be <= 1000")
    }),
    MultiSelectQuestionSchema.extend({
      // no validation that the selection is one of the choices
      response: z
        .array(z.number())
        .min(1, "At least one choice must be selected")
    }),
    SingleSelectQuestionSchema.extend({
      // no validation that the selection is one of the choices
      response: z.number()
    })
  ])
);

export type FormResponses = z.infer<typeof FormResponsesSchema>;
