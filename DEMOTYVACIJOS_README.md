# Demotyvacijos Image Fetcher

This module provides a method to fetch random demotivator images from demotyvacijos.lt without repeating previously fetched images.

## Features

- Fetches random images from a pool of 101,208 images
- Prevents image repetition by tracking used images
- Automatically resets when all images have been used
- Persists used images to a JSON file for persistence across restarts
- Converts thumbnail URLs to full-size image URLs
- Downloads and saves images locally for Instagram upload

## Usage

### Import the module
```javascript
import demotyvacijosFetcher from './demotyvacijos_worker.js';
```

### Get a random image URL (for external use)
```javascript
const imageUrl = await demotyvacijosFetcher.getRandomImageUrl();
console.log(imageUrl);
// Output: https://www.demotyvacijos.lt/media/demotivators/demotyvacija.lt_Some-image-name.jpg
```

### Generate and save image file (for Instagram upload)
```javascript
// This downloads the image and saves it to the PATH_TO_SAVE directory
const outputPath = await demotyvacijosFetcher.generateDemotyvacijosImage('demotyvacijos_today.png');
console.log('Image saved to:', outputPath);
```

### Check usage statistics
```javascript
const stats = demotyvacijosFetcher.getStats();
console.log(stats);
// Output: {
//   totalImages: 101208,
//   usedImages: 5,
//   remainingImages: 101203,
//   percentageUsed: '0.00'
// }
```

### Reset used images (start over)
```javascript
demotyvacijosFetcher.resetUsedImages();
```

## Integration with Instagram Bot

The module is integrated into the main Instagram bot scheduler:

```javascript
// In main.js
import demotyvacijosFetcher from "./demotyvacijos_worker.js";

const demotyvacijosJob = schedule.scheduleJob("0 3 * * *", async () => {
  console.log("Running scheduled Demotyvacijos job at " + new Date());
  try {
    await handleUpload("demotyvacijos", demotyvacijosFetcher.generateDemotyvacijosImage.bind(demotyvacijosFetcher));
  } catch (error) {
    console.error("Error in Demotyvacijos job:", error);
  }
});
```

This runs daily at 3:00 AM and uploads a random demotyvator image to Instagram Stories.

## Environment Variables

Make sure to set the following in your `.env` file:

```bash
PATH_TO_SAVE=./public  # Directory where images will be saved
DOMAIN_NAME=https://yourdomain.com  # For Instagram URL access
ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_APP_ID=your_instagram_app_id
```

## How it works

1. **Random ID Generation**: Generates a random number between 1 and 101,208
2. **URL Construction**: Builds a URL like `https://www.demotyvacijos.lt/geriausi/filter_all/{id}/po_1.html`
3. **HTML Parsing**: Extracts image URLs from the HTML response
4. **URL Conversion**: Converts thumbnail URLs (with `/thumb/`) to full-size URLs
5. **Image Download**: Downloads the full-size image
6. **File Saving**: Saves the image to the specified directory with the given filename
7. **Tracking**: Saves used image IDs to prevent repetition

## File Persistence

- Used images are stored in `used_demotivacijos_images.json` in the same directory
- Downloaded images are saved to the `PATH_TO_SAVE` directory (typically `./public`)

## Error Handling

- If an image ID doesn't contain a valid image, it automatically tries another ID
- Network errors are properly caught and thrown
- File system errors for tracking are logged but don't stop execution
- Environment variable validation ensures PATH_TO_SAVE is set

## Example Output

The method returns URLs in this format:
```
https://www.demotyvacijos.lt/media/demotivators/demotyvacija.lt_Image-title-here.jpg
```

These are direct links to the full-size demotivator images, which are then downloaded and saved locally for Instagram upload.
