import dotenv from "dotenv";
import captureWebsite from "capture-website";
import path from "path";
import fs from "fs";

dotenv.config();

const { PATH_TO_SAVE } = process.env;

async function generateCalendarForToday(outputImageName) {
  const outputDir = path.dirname(path.join(PATH_TO_SAVE, outputImageName));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }

  const outputPath = path.join(PATH_TO_SAVE, outputImageName);

  return await captureWebsite.file("https://day.lt", outputPath, {
    element: ".calendar-section.calendar-left.w-full",
    blockAds: true,
    overwrite: true,
    // darkMode: true,
    launchOptions: {
      timeout: 10000,
      defaultViewport: {
        width: 1280,
        height: 800,
      },
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-software-rasterizer",
        "--window-size=1280,800",
        "--user-agent=GutenbergScraper/1.0 (+https://github.com/wadewegner/doappplat-puppeteer-sample) Chromium/120.0.0.0",

        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gl-drawing-for-tests",
        "--disable-canvas-aa",
        "--disable-2d-canvas-clip-aa",
        "--disable-dev-shm-usage",
        "--no-zygote",
        "--use-gl=swiftshader",
        "--enable-webgl",
        "--hide-scrollbars",
        "--mute-audio",
        "--no-first-run",
        "--disable-infobars",
        "--disable-breakpad",
        "--window-size=1280,1024",
        "--user-data-dir=./chromeData",
      ],
    },
  });
}

generateCalendarForToday("calendar_today.png");

export { generateCalendarForToday };
