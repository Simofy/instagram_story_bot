import { generateCalendarForToday } from "./calendar_worker.js";
import {
  generateHoroscopeStoryImageCanvasPage1,
  generateHoroscopeStoryImageCanvasPage2,
} from "./horoscope_worker.js";
import { handleUpload } from "./instagram_upload.js";

generateHoroscopeStoryImageCanvasPage1('horoscope_1.png');

async function runJobs() {
  // await handleUpload("calendar", generateCalendarForToday);
  await handleUpload("horoscope_1", generateHoroscopeStoryImageCanvasPage1);
  await handleUpload("horoscope_2", generateHoroscopeStoryImageCanvasPage2);
}

runJobs();