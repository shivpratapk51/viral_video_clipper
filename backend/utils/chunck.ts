import type { Chunk, TranscriptItem } from "./types.ts";


export default function createChunks(transcript: TranscriptItem[]): Chunk[] {
  const CHUNK_SIZE_MS = parseInt(process.env.CHUNK_SIZE!);
  const chunks: Chunk[] = [];

  if (!transcript || transcript.length === 0) return chunks;

  let currentText = [];
  let startTime = transcript[0].offset;
  let endTime = startTime;

  for (const item of transcript) {
    // Check if the current item exceeds the 30-second window from the start time
    if (item.offset - startTime >= CHUNK_SIZE_MS && currentText.length > 0) {
      // Save the completed chunk
      chunks.push({
        text: currentText.join(" "),
        startTime: startTime,
        endTime: endTime,
      });

      // Reset variables for the next chunk
      currentText = [];
      startTime = item.offset;
    }

    // Accumulate text and update the rolling end time
    currentText.push(item.text);
    endTime = item.offset + item.duration;
  }

  // Catch any remaining text to form the final chunk
  if (currentText.length > 0) {
    chunks.push({
      text: currentText.join(" "),
      startTime: startTime,
      endTime: endTime,
    });
  }

  return chunks;
}