import { YtDlp } from "ytdlp-nodejs";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const FFMPEG_PATH = "C:\\ffmpeg\\ffmpeg.exe";

async function download(videoUrl: string, outputFolder: string = "./output") {
  const ytdlp = new YtDlp();
  console.log("Fetching video metadata and starting download...");

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  try {
    const timestamp = Date.now();
    const videoPath = path.join(outputFolder, `video_${timestamp}.mp4`);
    const audioPath = path.join(outputFolder, `audio_${timestamp}.m4a`);

    // Download video only
    console.log("Downloading video stream...");
    await ytdlp
      .download(videoUrl)
      .format("bestvideo[ext=mp4]") // Best video stream only
      .output(videoPath)
      .on("progress", (p) => {
        console.log(
          `Video Progress: ${p.percentage_str} | Speed: ${p.speed_str} | ETA: ${p.eta_str}`,
        );
      })
      .run();

    // Download audio only
    console.log("Downloading audio stream...");
    await ytdlp
      .download(videoUrl)
      .format("bestaudio[ext=m4a]") // Best audio stream only
      .output(audioPath)
      .on("progress", (p) => {
        console.log(
          `Audio Progress: ${p.percentage_str} | Speed: ${p.speed_str} | ETA: ${p.eta_str}`,
        );
      })
      .run();

    console.log("\nBoth streams downloaded!");
    console.log("Video:", videoPath);
    console.log("Audio:", audioPath);

    // Merge both
    const merged = mergeVideoAudio(videoPath, audioPath, outputFolder);
    console.log("Final merged file:", merged);

    // Cleanup separate streams
    fs.unlinkSync(videoPath);
    fs.unlinkSync(audioPath);
    console.log("Cleaned up temporary files.");
  } catch (error) {
    console.error("An error occurred during download:", error);
  }
}

function mergeVideoAudio(
  videoPath: string,
  audioPath: string,
  outputFolder: string = "./output",
): string {
  const outputFileName = `merged_${Date.now()}.mp4`;
  const outputPath = path.join(outputFolder, outputFileName);

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  console.log("Merging video and audio with FFmpeg...");

  try {
    execSync(
      `"${FFMPEG_PATH}" -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`,
      { stdio: "inherit" },
    );

    console.log("Merge completed! Output:", outputPath);
    return outputPath;
  } catch (error) {
    console.error("FFmpeg merge failed:", error);
    throw error;
  }
}

download("https://youtu.be/dhYOPzcsbGM?si=Zx04B1YdFCUXgM5Y", "./output");
