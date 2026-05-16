import z from "zod";
// Types
//Transcript types
export const transcriptSchema = z.object({
  text: z.string(),
  offset: z.number(),
  duration: z.number(),
});
export const chunkSchema = z.object({
  text: z.string(),
  startTime: z.number(),
  endTime: z.number(),
});
export type Chunk = z.infer<typeof chunkSchema>;
export type TranscriptItem = z.infer<typeof transcriptSchema>;

//LLM types
export const llmOutputSchema = z.array(z.object({
    startTime: z.number(),
    endTime: z.number(),
    text: z.string(),
}));

export type LLMOutputSchema = z.infer<typeof llmOutputSchema>;