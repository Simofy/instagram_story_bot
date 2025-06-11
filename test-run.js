import { generateCalendarForToday } from "./calendar_worker.js";
import {
  generateHoroscopeStoryImageCanvasPage1,
  generateHoroscopeStoryImageCanvasPage2,
} from "./horoscope_worker.js";
import { handleUpluad } from "./instagram_upload.js";

handleUpluad("horoscope_1", generateHoroscopeStoryImageCanvasPage1);
handleUpluad("horoscope_2", generateHoroscopeStoryImageCanvasPage2);
handleUpluad("calendar", generateCalendarForToday);
