import { z } from "zod";

export const FormQuestionsSchema = z.object({});
export type FormQuestions = z.infer<typeof FormQuestionsSchema>;

// TODO define the shape of this relative to ApplicationQuestionsSchema
export const FormResponsesSchema = z.object({});
export type FormResponses = z.infer<typeof FormResponsesSchema>;
