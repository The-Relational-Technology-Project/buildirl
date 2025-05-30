import { z } from "zod";

export enum FormQuestionType {
  SHORT_TEXT = "SHORT_TEXT",
  LONG_TEXT = "LONG_TEXT",
  SINGLE_SELECT = "SINGLE_SELECT",
  MULTI_SELECT = "MULTI_SELECT"
}

const FormQuestionTypeSchema = z.nativeEnum(FormQuestionType);

const SelectChoiceSchema = z.string().min(2).max(100, "Length must be <= 100");

const BaseFormQuestionSchema = z.object({
  question: z
    .string()
    .min(3, "Length must be >= 3")
    .max(200, "Length must be <= 200"),
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
  choices: z
    .array(SelectChoiceSchema)
    .min(2, "At least two choice is required")
    .refine(
      (choices) => new Set(choices).size === choices.length,
      "Choices must be distinct"
    )
});

const SingleSelectQuestionSchema = BaseFormQuestionSchema.extend({
  type: z.literal(FormQuestionType.SINGLE_SELECT),
  metadata: SelectQuestionMetadataSchema
});

const MultiSelectQuestionSchema = BaseFormQuestionSchema.extend({
  type: z.literal(FormQuestionType.MULTI_SELECT),
  metadata: SelectQuestionMetadataSchema
});

export const FormQuestionSchema = z.discriminatedUnion("type", [
  ShortTextQuestionSchema,
  LongTextQuestionSchema,
  SingleSelectQuestionSchema,
  MultiSelectQuestionSchema
]);
export type FormQuestion = z.infer<typeof FormQuestionSchema>;

export const FormQuestionsSchema = z.object({
  questions: z.array(FormQuestionSchema)
});
export type FormQuestions = z.infer<typeof FormQuestionsSchema>;

export const FormResponseSchema = z.discriminatedUnion("type", [
  ShortTextQuestionSchema.extend({
    response: z
      .string()
      .min(3, "Length must be >= 3")
      .max(200, "Length must be <= 200")
  }),
  LongTextQuestionSchema.extend({
    response: z
      .string()
      .min(3, "Length must be >= 3")
      .max(2000, "Length must be <= 2000")
  }),
  MultiSelectQuestionSchema.extend({
    // no validation that the selection is one of the choices
    response: z
      .array(SelectChoiceSchema)
      .min(1, "At least one choice must be selected.")
  }),
  SingleSelectQuestionSchema.extend({
    // no validation that the selection is one of the choices
    response: SelectChoiceSchema
  })
]);
export type FormResponse = z.infer<typeof FormResponseSchema>;

export const FormResponsesSchema = z.object({
  responses: z.array(FormResponseSchema)
});
export type FormResponses = z.infer<typeof FormResponsesSchema>;
