import axios from "axios";
import z from "zod";
import dotenv from "dotenv";
dotenv.config();

export const inputSchema = z.object({
  query: z.string(),
  systemPrompt: z.string(),
  maxTokens: z.number().optional().default(512),
  topP: z.number().optional().default(0.7),
  temperature: z.number().optional().default(0.2),
  stream: z.boolean().optional().default(true),
  outputSchema: z.any().optional(),
});

export type LLMInput = z.infer<typeof inputSchema>;

export interface NonStreamingResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function llm(
  input: LLMInput & { stream: false },
): Promise<NonStreamingResponse>;
export async function llm(
  input: LLMInput & { stream?: true },
): Promise<AsyncGenerator<string, void, unknown>>;

export async function llm(
  input: LLMInput,
): Promise<NonStreamingResponse | AsyncGenerator<string, void, unknown>> {
  const validatedInput = inputSchema.parse(input);

  const invokeUrl = process.env.NVIDIA_INVOKE_URL!;
  const apiKey = process.env.NVIDIA_API_KEY!;

  const payload = {
    "model": process.env.NVIDIA_MODEL_NAME!,
    "messages": [
      { role: "system", content: validatedInput.systemPrompt },
      { role: "user", content: validatedInput.query },
    ],
    "max_tokens": validatedInput.maxTokens,
    "temperature": validatedInput.temperature,
    "top_p": validatedInput.topP,
    "stream": validatedInput.stream,
    "response_format": validatedInput.outputSchema ? { type: "json_object" } : undefined,
    "chat_template_kwargs": {"thinking":true}
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: validatedInput.stream ? "text/event-stream" : "application/json",
  };

  try {
    const response = await axios.post(invokeUrl, payload, {
      headers: headers,
      responseType: validatedInput.stream ? "stream" : "json",
    });

    if (!validatedInput.stream) {
      return response.data as NonStreamingResponse;
    }

    return (async function* () {
      let buffer = "";

      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (!trimmedLine.startsWith("data: ")) continue;

          const dataStr = trimmedLine.slice(6);

          if (dataStr === "[DONE]") return;

          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              yield content;
            }
          } catch (e) {
            console.error("Stream parsing error:", e);
          }
        }
      }
    })();
  } catch (error) {
    console.error("Error invoking the model:", error);
    throw error;
  }
}
