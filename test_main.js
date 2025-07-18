// Test main.js functionality without scheduling
import dotenv from "dotenv";

import { generateCalendarForToday } from "./calendar_worker.js";
import {
  generateHoroscopeStoryImageCanvasPage1,
  generateHoroscopeStoryImageCanvasPage2,
} from "./horoscope_worker.js";
import { handleUpload } from "./instagram_upload.js";
import demotyvacijosFetcher from "./demotyvacijos_worker.js";

dotenv.config();

// Mock handleUpload function for testing (since we don't want to actually post to Instagram)
async function mockHandleUpload(image, generateImage) {
  console.log(`\n=== Testing ${image} upload ===`);
  try {
    const today = new Date().getDay();
    const outputImageFilename = `${image}_${today}.png`;
    
    console.log(`Generating image: ${outputImageFilename}`);
    await generateImage(outputImageFilename);
    console.log(`✅ ${image} image generated successfully`);
    
    return { success: true, filename: outputImageFilename };
  } catch (error) {
    console.error(`❌ Error generating ${image} image:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testAllJobs() {
  console.log("Testing all scheduled jobs...\n");

  // Test horoscope jobs
  console.log("Testing horoscope jobs...");
  const horoscope1Result = await mockHandleUpload("horoscope_1", generateHoroscopeStoryImageCanvasPage1);
  const horoscope2Result = await mockHandleUpload("horoscope_2", generateHoroscopeStoryImageCanvasPage2);

  // Test calendar job  
  console.log("Testing calendar job...");
  const calendarResult = await mockHandleUpload("calendar", generateCalendarForToday);

  // Test demotyvacijos job
  console.log("Testing demotyvacijos job...");
  const demotyvacijosResult = await mockHandleUpload("demotyvacijos", demotyvacijosFetcher.generateDemotyvacijosImage.bind(demotyvacijosFetcher));

  // Summary
  console.log("\n=== Test Results Summary ===");
  console.log("Horoscope 1:", horoscope1Result.success ? "✅ PASS" : "❌ FAIL");
  console.log("Horoscope 2:", horoscope2Result.success ? "✅ PASS" : "❌ FAIL");
  console.log("Calendar:", calendarResult.success ? "✅ PASS" : "❌ FAIL");
  console.log("Demotyvacijos:", demotyvacijosResult.success ? "✅ PASS" : "❌ FAIL");

  console.log("\nDemotyvacijos stats:", demotyvacijosFetcher.getStats());
}

testAllJobs();
