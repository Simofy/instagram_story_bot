import dotenv from "dotenv";
import schedule from "node-schedule";

import { handleUpluad } from "./instagram_upload.js";
import {
  generateHoroscopeStoryImageCanvasPage1,
  generateHoroscopeStoryImageCanvasPage2,
} from "./horoscope_worker.js";

dotenv.config();

const horoscopeJob = schedule.scheduleJob("0 6 * * *", () => {
  console.log("Running scheduled job: handleUpluad at " + new Date());
  handleUpluad("horoscope_1", generateHoroscopeStoryImageCanvasPage1);
  handleUpluad("horoscope_2", generateHoroscopeStoryImageCanvasPage2);
});

console.log("Horoscope image generation and uploader scheduled.");
