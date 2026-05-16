import dotenv from "dotenv";
dotenv.config();

import { llm } from "./llm.ts";
import z from "zod";
import getTranscript from "./getTranscript.ts";
import createChunks from "./utils/chuck.ts";
import { llmOutputSchema } from "./utils/types.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";

const url = "https://youtu.be/dhYOPzcsbGM?si=Zx04B1YdFCUXgM5Y";
const transcript = await getTranscript(url);
const chunks = createChunks(transcript);

let prompt: String = "These are the chunks of the transcript with their respective start and end times:\n\n";
for (const chunk of chunks) {
  prompt += `{
    startTime:${chunk.startTime},
    endTime:${chunk.endTime},
    text:${chunk.text}
  }\n\n`;
}
console.log(prompt);

try {
  const res = await llm({
    query: prompt,
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 1000000,
    stream: true,
    outputSchema: z.toJSONSchema(llmOutputSchema),
  });
  // console.log(res.choices[0].message.content);
  
  for await (const chunk of res) {
    process.stdout.write(chunk);
  }
} catch (error) {
  console.log(error.message);
}
