import dotenv from "dotenv";
import schedule from "node-schedule";

import { generateCalendarForToday } from "./calendar_worker.js";
import {
  generateHoroscopeStoryImageCanvasPage1,
  generateHoroscopeStoryImageCanvasPage2,
} from "./horoscope_worker.js";
import { handleUpload } from "./instagram_upload.js";

dotenv.config();

const horoscopeJob = schedule.scheduleJob("0 2 * * *", async () => {
  console.log("Running scheduled horoscope job at " + new Date());
  await handleUpload("horoscope_1", generateHoroscopeStoryImageCanvasPage1);
  await handleUpload("horoscope_2", generateHoroscopeStoryImageCanvasPage2);
});

const calendarJob = schedule.scheduleJob("0 1 * * *", () => {
  console.log("Running scheduled calendar job at " + new Date());
  handleUpload("calendar", generateCalendarForToday);
});

console.log("Jobs scheduled.");
