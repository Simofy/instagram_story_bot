// from 1 to 101208
// https://www.demotyvacijos.lt/geriausi/visi/filter_all/101208/po_1.html

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { PATH_TO_SAVE } = process.env;

class DemotyvacijosImageFetcher {
  constructor() {
    this.maxImageId = 101208;
    this.usedImages = new Set();
    this.usedImagesFile = path.join(__dirname, 'used_demotivacijos_images.json');
    this.loadUsedImages();
  }

  // Load previously used images from file
  loadUsedImages() {
    try {
      if (fs.existsSync(this.usedImagesFile)) {
        const data = fs.readFileSync(this.usedImagesFile, 'utf8');
        const usedArray = JSON.parse(data);
        this.usedImages = new Set(usedArray);
      }
    } catch (error) {
      console.log('No previous used images file found, starting fresh');
      this.usedImages = new Set();
    }
  }

  // Save used images to file
  saveUsedImages() {
    try {
      const usedArray = Array.from(this.usedImages);
      fs.writeFileSync(this.usedImagesFile, JSON.stringify(usedArray, null, 2));
    } catch (error) {
      console.error('Error saving used images:', error);
    }
  }

  // Reset used images (start over)
  resetUsedImages() {
    this.usedImages.clear();
    if (fs.existsSync(this.usedImagesFile)) {
      fs.unlinkSync(this.usedImagesFile);
    }
  }

  // Get a random image ID that hasn't been used
  getRandomUnusedImageId() {
    // If all images have been used, reset
    if (this.usedImages.size >= this.maxImageId) {
      console.log('All images have been used, resetting...');
      this.resetUsedImages();
    }

    let randomId;
    do {
      randomId = Math.floor(Math.random() * this.maxImageId) + 1;
    } while (this.usedImages.has(randomId));

    return randomId;
  }

  // Extract image URL from HTML response
  extractImageUrl(html) {
    // Look for img tags with src containing "media/demotivators/thumb/"
    const imgRegex = /<img[^>]+src="([^"]*media\/demotivators\/thumb\/[^"]+)"/g;
    const matches = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const thumbUrl = match[1];
      // Convert thumb URL to full image URL by removing "/thumb"
      const fullUrl = thumbUrl.replace('/thumb/', '/');
      // Ensure it starts with https://
      const completeUrl = fullUrl.startsWith('http') ? fullUrl : `https://www.demotyvacijos.lt/${fullUrl}`;
      matches.push(completeUrl);
    }

    return matches.length > 0 ? matches[0] : null;
  }

  // Main method to get a random image URL
  async getRandomImageUrl() {
    try {
      const randomId = this.getRandomUnusedImageId();
      console.log(`Fetching image with ID: ${randomId}`);

      const response = await fetch(`https://www.demotyvacijos.lt/geriausi/filter_all/${randomId}/po_1.html`, {
        "headers": {
          "x-requested-with": "XMLHttpRequest",
        },
        "method": "GET"
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const imageUrl = this.extractImageUrl(html);

      if (imageUrl) {
        // Mark this image ID as used
        this.usedImages.add(randomId);
        this.saveUsedImages();
        
        console.log(`Found image: ${imageUrl}`);
        return imageUrl;
      } else {
        console.log(`No image found for ID ${randomId}, trying another...`);
        // Try again with a different ID
        return await this.getRandomImageUrl();
      }

    } catch (error) {
      console.error('Error fetching random image:', error);
      throw error;
    }
  }

  // Get stats about usage
  getStats() {
    return {
      totalImages: this.maxImageId,
      usedImages: this.usedImages.size,
      remainingImages: this.maxImageId - this.usedImages.size,
      percentageUsed: ((this.usedImages.size / this.maxImageId) * 100).toFixed(2)
    };
  }

  // Download and save image for Instagram upload
  async generateDemotyvacijosImage(outputImageName) {
    try {
      // Validate PATH_TO_SAVE environment variable
      if (!PATH_TO_SAVE) {
        console.error("PATH_TO_SAVE environment variable is not set.");
        throw new Error("PATH_TO_SAVE environment variable is not set.");
      }

      // Get a random image URL
      const imageUrl = await this.getRandomImageUrl();
      console.log(`Downloading image from: ${imageUrl}`);

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(path.join(PATH_TO_SAVE, outputImageName));
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created directory: ${outputDir}`);
      }

      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      // Get image buffer
      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);

      // Save to file
      const outputPath = path.join(PATH_TO_SAVE, outputImageName);
      fs.writeFileSync(outputPath, buffer);

      console.log(`Demotyvacijos image saved to: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error('Error generating demotyvacijos image:', error);
      throw error;
    }
  }
}

// Create instance and export
const demotyvacijosFetcher = new DemotyvacijosImageFetcher();

// If running directly, test the function
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      console.log('Stats:', demotyvacijosFetcher.getStats());
      const imageUrl = await demotyvacijosFetcher.getRandomImageUrl();
      console.log('Random image URL:', imageUrl);
      console.log('Updated stats:', demotyvacijosFetcher.getStats());
    } catch (error) {
      console.error('Error:', error);
    }
  })();
}

export default demotyvacijosFetcher;
export { demotyvacijosFetcher };