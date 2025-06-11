import dotenv from "dotenv";
import { createCanvas, registerFont } from "canvas";
import fs from "fs";
import path from "path";

dotenv.config();

const { PATH_TO_SAVE } = process.env;

const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1920;
const PADDING = { top: 70, right: 50, bottom: 50, left: 50 };
const TEXT_COLOR = "#000000";

const TITLE_FONT_SIZE = 68;
const DATE_FONT_SIZE = 36;
const ZODIAC_NAME_FONT_SIZE = 30;
const ZODIAC_CONTENT_FONT_SIZE = 23;
const CONTENT_LINE_HEIGHT_MULTIPLIER = 1.3;
const NAME_LINE_HEIGHT_APPROX = ZODIAC_NAME_FONT_SIZE * 1.15;

const FONT_FAMILY_BOLD = "Noto Bold";
const FONT_FAMILY_NORMAL = "Noto";

const zodiacTranslations = {
  AQUARIUS: "Vandenis",
  ARIES: "Avinas",
  CANCER: "Vėžys",
  CAPRICORN: "Ožiaragis",
  GEMINI: "Dvyniai",
  LEO: "Liūtas",
  LIBRA: "Svarstyklės",
  PISCES: "Žuvys",
  SAGITTARIUS: "Šaulys",
  SCORPIO: "Skorpionas",
  TAURUS: "Jautis",
  VIRGO: "Mergelė",
};

const cleanContentForCanvas = (textContent) => {
  // Remove special unicode spaces (including non-breaking, thin, zero-width, etc.)
  let cleaned = textContent.replace(/<[^>]*>/g, " ").trim();
  // Remove all HTML entities like &#160; and &nbsp; (including multiple occurrences)
  cleaned = cleaned.replace(/&#?\w+;/g, " ");
  cleaned = cleaned.replace(/[\u00A0\u2000-\u200D\u202F\u205F\u3000]/g, " "); // special unicode spaces
  cleaned = cleaned.replace(/ /gi, " ").trim();
  cleaned = cleaned.replace(/\s\s+/g, " ");
  cleaned = cleaned.replace(/Geros dienos\.$/i, "").trim();

  return cleaned.trim();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("lt-LT", options);
};

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  context.textBaseline = "top";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

const BACKGROUND_GRADIENT_START = "#f5e8ff";
const BACKGROUND_GRADIENT_END = "#e0f7fa";
const ZODIAC_NAME_DECOR_COLOR = "#b39ddb";
const DATE_COLOR = "#6a1b9a";
const PAGE_INDICATOR_COLOR = "#6a1b9a";

// Register fonts
registerFont("fonts/NotoSans-Bold.ttf", { family: FONT_FAMILY_BOLD });
registerFont("fonts/NotoSans-Regular.ttf", { family: FONT_FAMILY_NORMAL });

async function generateImageWithCanvas(data, outputPath, options = {}) {
  // Added pageNumber and totalPages options to support pagination.
  const { pageNumber = 1, totalPages = 1, zodiacs = null } = options;

  const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
  const ctx = canvas.getContext("2d");

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, IMAGE_HEIGHT);
  gradient.addColorStop(0, BACKGROUND_GRADIENT_START);
  gradient.addColorStop(1, BACKGROUND_GRADIENT_END);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  ctx.textBaseline = "top";
  let currentY = PADDING.top;
  const contentWidth = IMAGE_WIDTH - PADDING.left - PADDING.right;

  // Title (no shadow)
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold ${TITLE_FONT_SIZE}px "${FONT_FAMILY_BOLD}"`;
  ctx.textAlign = "center";
  ctx.shadowBlur = 0; // Remove shadow
  ctx.fillText("Šios Dienos Horoskopas", IMAGE_WIDTH / 2, currentY);
  currentY += TITLE_FONT_SIZE * 1.1;
  currentY += 30;

  // Date (no shadow)
  ctx.font = `bold ${DATE_FONT_SIZE + 10}px "${FONT_FAMILY_BOLD}"`;
  ctx.fillStyle = DATE_COLOR;
  ctx.textAlign = "center";
  ctx.shadowBlur = 0; // Remove shadow
  const dateText = formatDate(data.currentEntry.periodStart);
  ctx.fillText(dateText, IMAGE_WIDTH / 2, currentY);
  currentY += (DATE_FONT_SIZE + 10) * 1.1;
  currentY += 40;

  ctx.textAlign = "left";
  ctx.shadowBlur = 0;

  const zodiacOrder = [
    "ARIES",
    "TAURUS",
    "GEMINI",
    "CANCER",
    "LEO",
    "VIRGO",
    "LIBRA",
    "SCORPIO",
    "SAGITTARIUS",
    "CAPRICORN",
    "AQUARIUS",
    "PISCES",
  ];
  const zodiacsToRender = zodiacs || data.currentEntry.zodiacs;
  const sortedZodiacs = zodiacsToRender.slice().sort((a, b) => {
    return zodiacOrder.indexOf(a.type) - zodiacOrder.indexOf(b.type);
  });

  const contentLineHeight =
    ZODIAC_CONTENT_FONT_SIZE * CONTENT_LINE_HEIGHT_MULTIPLIER;
  const MARGIN_NAME_TO_CONTENT = 12;
  const MARGIN_CONTENT_TO_LINE = 22;
  const MARGIN_LINE_TO_NEXT_NAME = 32;
  const LINE_THICKNESS = 2;

  for (let i = 0; i < sortedZodiacs.length; i++) {
    const zodiac = sortedZodiacs[i];

    // Zodiac name without shadow
    const zodiacNameFontSize = ZODIAC_NAME_FONT_SIZE + 8;
    ctx.font = `bold ${zodiacNameFontSize}px "${FONT_FAMILY_BOLD}"`;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.fillStyle = TEXT_COLOR;
    const translatedName =
      zodiacTranslations[zodiac.type.toUpperCase()] || zodiac.type;
    ctx.fillText(translatedName, PADDING.left, currentY);
    ctx.shadowBlur = 0;

    currentY += NAME_LINE_HEIGHT_APPROX + 10;
    currentY += MARGIN_NAME_TO_CONTENT;

    // Zodiac content
    ctx.font = `${ZODIAC_CONTENT_FONT_SIZE + 2}px "${FONT_FAMILY_NORMAL}"`;
    ctx.fillStyle = TEXT_COLOR;
    let cleanedText = cleanContentForCanvas(zodiac.content);

    // If ends with "Geros dienos. Horoskopą parengė ..." or similar, split into two paragraphs
    const match = cleanedText.match(/(Geros dienos\.)\s*(Horoskopą parengė.*)$/i);
    if (match) {
      // Draw first paragraph
      currentY = wrapText(
        ctx,
        cleanedText.slice(0, match.index + match[1].length).trim(),
        PADDING.left + 8,
        currentY,
        contentWidth - 8,
        contentLineHeight + 2
      );
      // Add extra space before author
      currentY += contentLineHeight * 0.7;
      // Draw author paragraph
      ctx.font = `italic ${ZODIAC_CONTENT_FONT_SIZE + 2}px "${FONT_FAMILY_NORMAL}"`;
      currentY = wrapText(
        ctx,
        match[2].trim(),
        PADDING.left + 8,
        currentY,
        contentWidth - 8,
        contentLineHeight + 2
      );
      ctx.font = `${ZODIAC_CONTENT_FONT_SIZE + 2}px "${FONT_FAMILY_NORMAL}"`;
    } else {
      currentY = wrapText(
        ctx,
        cleanedText,
        PADDING.left + 8,
        currentY,
        contentWidth - 8,
        contentLineHeight + 2
      );
    }

    // Decorative line after each zodiac
    if (i < sortedZodiacs.length - 1) {
      currentY += MARGIN_CONTENT_TO_LINE;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, currentY + LINE_THICKNESS / 2);
      ctx.lineTo(IMAGE_WIDTH - PADDING.right, currentY + LINE_THICKNESS / 2);
      ctx.strokeStyle = ZODIAC_NAME_DECOR_COLOR;
      ctx.lineWidth = LINE_THICKNESS;
      ctx.globalAlpha = 0.25;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      currentY += LINE_THICKNESS;
      currentY += MARGIN_LINE_TO_NEXT_NAME;
    }
  }

  // Stylish page indicator at the bottom
  if (totalPages > 1) {
    const indicatorText = `${pageNumber}/${totalPages}`;
    ctx.font = `bold 38px "${FONT_FAMILY_BOLD}"`;
    const indicatorY = IMAGE_HEIGHT - PADDING.bottom - 20;

    ctx.font = `bold 38px "${FONT_FAMILY_BOLD}"`;
    ctx.fillStyle = PAGE_INDICATOR_COLOR;
    ctx.textAlign = "center";
    ctx.shadowBlur = 0;
    ctx.fillText(indicatorText, IMAGE_WIDTH / 2, indicatorY + 16);
  }

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Image saved successfully to ${outputPath}`);
}

async function generateHoroscopeStoryImageCanvasPage1(outputImageName) {
  try {
    if (!PATH_TO_SAVE) {
      console.error("PATH_TO_SAVE environment variable is not set.");
      throw new Error("PATH_TO_SAVE environment variable is not set.");
    }

    const response = await fetch(
      "https://horoscope.api.delfi.lt/horoscope/v1/graphql?variables=%7B%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22e9d52d0790992a2e4231e53e97dd54f2cf346edceeb3da6c62f3628593fd004e%22%7D%7D",
      {
        headers: {
          accept: "*/*",
          "accept-language": "lt,en-US;q=0.9,en;q=0.8",
          "content-type": "application/json",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          Referer: "https://www.delfi.lt/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );
    const json = await response.json();

    if (
      !json ||
      !json.data ||
      !json.data.getHoroscopes ||
      !json.data.getHoroscopes.items ||
      json.data.getHoroscopes.items.length === 0
    ) {
      console.error(
        "Unexpected data structure from horoscope API or no items found."
      );
      throw new Error(
        "Unexpected data structure from horoscope API or no items found."
      );
    }
    const horoscopeItem = json.data.getHoroscopes.items[0];
    if (!horoscopeItem || !horoscopeItem.currentEntry) {
      console.error("No current horoscope entry found in JSON data.");
      throw new Error("No current horoscope entry found in JSON data.");
    }

    const zodiacs = horoscopeItem.currentEntry.zodiacs.slice();
    const zodiacOrder = [
      "ARIES",
      "TAURUS",
      "GEMINI",
      "CANCER",
      "LEO",
      "VIRGO",
      "LIBRA",
      "SCORPIO",
      "SAGITTARIUS",
      "CAPRICORN",
      "AQUARIUS",
      "PISCES",
    ];
    zodiacs.sort(
      (a, b) => zodiacOrder.indexOf(a.type) - zodiacOrder.indexOf(b.type)
    );
    const mid = Math.ceil(zodiacs.length / 2);
    const zodiacsPage1 = zodiacs.slice(0, mid);

    const outputDir = path.dirname(path.join(PATH_TO_SAVE, outputImageName));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }
    await generateImageWithCanvas(
      horoscopeItem,
      path.join(PATH_TO_SAVE, outputImageName),
      {
        pageNumber: 1,
        totalPages: 2,
        zodiacs: zodiacsPage1,
      }
    );
  } catch (error) {
    console.error(
      "Failed to generate horoscope story image with canvas:",
      error.message
    );
    // Re-throw the error if handleUpluad needs to know generation failed
    throw error;
  }
}

async function generateHoroscopeStoryImageCanvasPage2(outputImageName) {
  try {
    if (!PATH_TO_SAVE) {
      console.error("PATH_TO_SAVE environment variable is not set.");
      throw new Error("PATH_TO_SAVE environment variable is not set.");
    }

    const response = await fetch(
      "https://horoscope.api.delfi.lt/horoscope/v1/graphql?variables=%7B%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22e9d52d0790992a2e4231e53e97dd54f2cf346edceeb3da6c62f3628593fd004e%22%7D%7D",
      {
        headers: {
          accept: "*/*",
          "accept-language": "lt,en-US;q=0.9,en;q=0.8",
          "content-type": "application/json",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          Referer: "https://www.delfi.lt/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );
    const json = await response.json();

    if (
      !json ||
      !json.data ||
      !json.data.getHoroscopes ||
      !json.data.getHoroscopes.items ||
      json.data.getHoroscopes.items.length === 0
    ) {
      console.error(
        "Unexpected data structure from horoscope API or no items found."
      );
      throw new Error(
        "Unexpected data structure from horoscope API or no items found."
      );
    }
    const horoscopeItem = json.data.getHoroscopes.items[0];
    if (!horoscopeItem || !horoscopeItem.currentEntry) {
      console.error("No current horoscope entry found in JSON data.");
      throw new Error("No current horoscope entry found in JSON data.");
    }

    const zodiacs = horoscopeItem.currentEntry.zodiacs.slice();
    const zodiacOrder = [
      "ARIES",
      "TAURUS",
      "GEMINI",
      "CANCER",
      "LEO",
      "VIRGO",
      "LIBRA",
      "SCORPIO",
      "SAGITTARIUS",
      "CAPRICORN",
      "AQUARIUS",
      "PISCES",
    ];
    zodiacs.sort(
      (a, b) => zodiacOrder.indexOf(a.type) - zodiacOrder.indexOf(b.type)
    );
    const mid = Math.ceil(zodiacs.length / 2);
    const zodiacsPage2 = zodiacs.slice(mid);

    const outputDir = path.dirname(path.join(PATH_TO_SAVE, outputImageName));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }
    await generateImageWithCanvas(
      horoscopeItem,
      path.join(PATH_TO_SAVE, outputImageName),
      {
        pageNumber: 2,
        totalPages: 2,
        zodiacs: zodiacsPage2,
      }
    );
  } catch (error) {
    console.error(
      "Failed to generate horoscope story image with canvas:",
      error.message
    );
    // Re-throw the error if handleUpluad needs to know generation failed
    throw error;
  }
}

export {
  generateHoroscopeStoryImageCanvasPage1,
  generateHoroscopeStoryImageCanvasPage2,
};
