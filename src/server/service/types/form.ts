import { z } from "zod";

enum FormQuestionType {
  SHORT_TEXT = "SHORT_TEXT",
  LONG_TEXT = "LONG_TEXT",
  SINGLE_SELECT = "SINGLE_SELECT",
  MULTI_SELECT = "MULTI_SELECT"
}

const FormQuestionTypeSchema = z.nativeEnum(FormQuestionType);

const BaseFormQuestionSchema = z.object({
  question: z.string().min(10, "Length must be >= 10"),
  type: FormQuestionTypeSchema
});

/**
 * Question-type specific metadata
 */

const SelectQuestionMetadataSchema = z.object({
  choices: z.array(z.string()).min(1, "At least one choice is required")
});

const FormQuestionSchema = z.discriminatedUnion("type", [
  BaseFormQuestionSchema.extend({
    type: z.literal(FormQuestionType.SHORT_TEXT),
    response: z.undefined().optional()
  }),
  BaseFormQuestionSchema.extend({
    type: z.literal(FormQuestionType.LONG_TEXT),
    response: z.undefined().optional()
  }),
  BaseFormQuestionSchema.extend({
    type: z.literal(FormQuestionType.SINGLE_SELECT),
    response: SelectQuestionMetadataSchema
  }),
  BaseFormQuestionSchema.extend({
    type: z.literal(FormQuestionType.MULTI_SELECT),
    response: SelectQuestionMetadataSchema
  })
]);

export const FormQuestionsSchema = z.array(FormQuestionSchema);
export type FormQuestions = z.infer<typeof FormQuestionsSchema>;

// TODO define the shape of this relative to FormQuestionsSchema
export const FormResponsesSchema = z.object({});
export type FormResponses = z.infer<typeof FormResponsesSchema>;
