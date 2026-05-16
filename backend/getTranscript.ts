import { fetchTranscript } from "youtube-transcript";

export default async function getTranscript(url: string) {
  const transcript = await fetchTranscript(url);
  return transcript;
}