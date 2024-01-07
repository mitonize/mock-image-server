const http = require("http");
const url = require("url");
const path = require("path");
const md5 = require("md5");
const fs = require("fs");
const YAML = require("yaml");

const { createCanvas } = require("canvas");

const NodeCache = require("node-cache");
const nodeCache = new NodeCache({
  maxKeys: 1000,
  stdTTL: 60,
  checkperiod: 120,
  useClones: false,
});

const mimeTypes = {
  png: "image/png",
  jpg: "image/jpeg",
  pdf: "application/pdf",
  svg: "image/svg+xml",
};

const palettes = {
  neutral: [
    "#f2f2f2", // Black White
    "#d9d9d9", // Silver
    "#595959", // Cod Gray
    "#bfbfbf", // Silver Chalice
    "#808080", // Gray
    "#666666", // Mid Gray
    "#4d4d4d", // Gravel
    "#333333", // Mine Shaft
  ],
};

// Load palette from file if exists.
if (fs.existsSync("./palette.yml")) {
  const palette = YAML.parse(fs.readFileSync("./palette.yml", "utf8"));
  Object.assign(palettes, palette);
}

//-- MAIN SERVER
const server = http.createServer((req, res) => {
  const reqUrl = req.headers["x-mockimageserver-path"] || req.url;
  const requestUrl = url.parse(reqUrl, true);

  const date = new Date().toLocaleString("sv-SE"); //.replace(/\D/g, '');
  console.log(`[${date}] ${req.method} ${reqUrl}  RealPath: ${req.url}`);

  try {
    const options = extractOptionsFromUrl(
      requestUrl.pathname,
      requestUrl.query
    );

    // If the image is already in the cache, we will return it
    let buf = nodeCache.get(options.output);
    if (buf == undefined) {
      // Color code is not specified, so we will use the color palette
      const { red, green, blue } = options.color
        ? hexToRgb(options.color)
        : colorPalette(options.key, options.palette);

      const color = rgbToHex(red, green, blue);
      const textColor = hicontrastColor(red, green, blue);

      buf = createImageBuffer(
        options.width,
        options.height,
        options.type,
        color,
        options.text,
        textColor
      );
      console.log(`Generated: ${options.output} key = ${options.key}`);

      try {
        nodeCache.set(options.output, buf);
      } catch (error) {
        // If the cache is full, we will clear it and try again
        nodeCache.flushAll();
        nodeCache.set(options.output, buf);
      }
    }

    res.writeHead(200, {
      "Content-Type": mimeTypes[options.type],
      "Content-Length": buf.length,
    });
    res.end(buf);
  } catch (error) {
    res.statusCode = 404;
    res.end("Not found: " + error.message);
  }
});

server.listen(3000, undefined, () => {
  console.log("Server running at http://localhost:3000/");
});

/**
 *
 * @param {*} width
 * @param {*} height
 * @param {*} type png | jpg | svg
 * @param {*} color hex color code
 * @param {*} text
 * @param {*} textColor hex color code
 * @param {*} textsize
 * @param {*} textFont
 */
function createImageBuffer(
  width,
  height,
  type,
  color,
  text,
  textColor,
  textsize = 20,
  textFont = "sans-serif"
) {
  const canvas = createCanvas(width, height, type);
  const context = canvas.getContext("2d");

  const fontSize = height / 10;

  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  context.fillStyle = textColor;
  context.font = `${fontSize}px ${textFont}`;

  const textSize = context.measureText(text);

  context.fillText(
    text,
    canvas.width / 2 - textSize.width / 2,
    canvas.height / 2 + fontSize / 2
  );

  const buffer = canvas.toBuffer(mimeTypes[type]);
  return buffer;
}

/**
 * /{color}/{width}x{height}.(png|jpg|jpeg|svg)
 * @param {*} pathname
 * @param {*} query
 * @returns
 */
function extractOptionsFromUrl(pathname, query) {
  const filename = path.basename(pathname).toLowerCase();

  if (/^\d+x\d+\.(png|jpg|jpeg|svg)$/.test(filename) === false) {
    throw new Error(`Invalid filename: ${filename}`);
  }

  // Extract width and height from size (e.g. '100x100' extracts 100 and 100)
  const size = filename.split(".")[0];
  const [width, height] = size.split("x").map(Number);
  if (width <= 0 || width > 2000 || height <= 0 || height > 2000) {
    throw new Error(
      `Size must be not more than 2000. width = ${width}, height = ${height}`
    );
  }

  // Extract color code from pathname (e.g. '/ff0000/100x150.png' extracts ff0000)
  let hexColorCode = null;
  const components = pathname.slice(1).split("/");
  if (
    components.length > 1 &&
    /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(components[0])
  ) {
    hexColorCode = components[0].toLowerCase();
  }

  const text = query.text || width + "x" + height;
  const key = parseInt(md5(query.key || text).slice(0, 8), 16);
  const hash = md5(text);

  const palette = query.palette;

  const filenameWithoutSlash = `${palette}-${hexColorCode}-${hash}-${key}-${filename}`;
  return {
    width: width,
    height: height,
    color: hexColorCode,
    text: text,
    key: key,
    palette: query.palette,
    output: filenameWithoutSlash,
    type: filename.split(".")[1],
  };
}

//-- COLOR HANDLING
function colorPalette(key, palette) {
  const colors = palettes[palette || 'neutral'];
  if (colors == undefined) {
    throw new Error(`Invalid palette: ${palette}`);
  }
  const index = key % colors.length;
  return hexToRgb(colors[index]);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        red: parseInt(result[1], 16),
        green: parseInt(result[2], 16),
        blue: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

/**
 * Select high contrast color among lightColor and darkColor
 * @param {*} r 
 * @param {*} g 
 * @param {*} b 
 * @param {*} lightColor 
 * @param {*} darkColor 
 * @returns 
 */
function hicontrastColor(r, g, b, lightColor = "#ffffff", darkColor = "#000000") {
  const lightRGB = hexToRgb(lightColor);
  const darkRGB = hexToRgb(darkColor);

  const luminance0 = relativeLuminance(r, g, b);
  const luminance1 = relativeLuminance(lightRGB.red, lightRGB.green, lightRGB.blue);
  const luminance2 = relativeLuminance(darkRGB.red, darkRGB.green, darkRGB.blue);

  const contrastLight = contrastRatio(luminance0, luminance1);
  const contrastDark  = contrastRatio(luminance0, luminance2);
  return contrastLight > contrastDark ? lightColor : darkColor;
}

// --- https://lifehackdev.com/ZakkiBlog/articles/detail/web15

// Calculate rgb value for relative luminance calculation
function rgbForCalculateLuminance(rgb) {
	if (rgb <= 0.03928){
		return rgb / 12.92;
	} else {
		return Math.pow(((rgb + 0.055) / 1.055), 2.4);
	}
}

function relativeLuminance(r, g, b) {
	const R = rgbForCalculateLuminance(r / 255);
	const G = rgbForCalculateLuminance(g / 255);
	const B = rgbForCalculateLuminance(b / 255);
	return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(l1, l2) {
	let bright = (l1 > l2) ? l1 : l2; 
	let dark   = (l1 < l2) ? l1 : l2;
	return (bright + 0.05) / (dark + 0.05);
}