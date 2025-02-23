import { z } from "zod";

export enum FormQuestionType {
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
  choices: z.array(z.string().min(3)).min(2, "At least two choice is required")
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
      .array(z.string().min(3))
      .min(1, "At least one choice must be selected.")
  }),
  SingleSelectQuestionSchema.extend({
    // no validation that the selection is one of the choices
    response: z.string().min(3)
  })
]);
export type FormResponse = z.infer<typeof FormResponseSchema>;

export const FormResponsesSchema = z.object({
  responses: z.array(FormResponseSchema)
});
export type FormResponses = z.infer<typeof FormResponsesSchema>;
