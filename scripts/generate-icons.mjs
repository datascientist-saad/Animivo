#!/usr/bin/env node
/**
 * Builds native/PWA icons from the official Animivo logo.
 * Source: public/brand/animivo-logo.png — do not invent a second mark.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const logoPath = path.join(root, "public/brand/animivo-logo.png");
const cream = { r: 0xfa, g: 0xf7, b: 0xf2, alpha: 1 };

async function compositeLogo(size, paddingRatio) {
  const logo = sharp(logoPath);
  const meta = await logo.metadata();
  if (!meta.width || !meta.height) {
    throw new Error(`Could not read official logo at ${logoPath}`);
  }

  const pad = Math.round(size * paddingRatio);
  const maxW = size - pad * 2;
  const maxH = size - pad * 2;
  const scale = Math.min(maxW / meta.width, maxH / meta.height);
  const width = Math.round(meta.width * scale);
  const height = Math.round(meta.height * scale);
  const left = Math.round((size - width) / 2);
  const top = Math.round((size - height) / 2);
  const resized = await logo
    .resize(width, height, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: cream,
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

async function writePng(rel, buffer) {
  const dest = path.join(root, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
  console.log("wrote", rel);
}

const icon = await compositeLogo(1024, 0.12);
const splash = await compositeLogo(2732, 0.18);
const icon192 = await compositeLogo(192, 0.12);
const icon512 = await compositeLogo(512, 0.12);

await writePng("resources/icon.png", icon);
await writePng("resources/splash.png", splash);
await writePng("public/icons/icon-192.png", icon192);
await writePng("public/icons/icon-512.png", icon512);
