const { glob } = require('glob');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const PUBLIC_DIR = path.resolve(__dirname, '../public/level');
const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;
const PNG_COMPRESSION_LEVEL = 8;

async function compressImages() {
  console.log('Starting image compression process...');
  console.log(`Searching for JPG and PNG images in: ${PUBLIC_DIR}`);

  const imagePaths = await glob(`**/*.{jpg,jpeg,png}`, {
    cwd: PUBLIC_DIR,
    absolute: true,
    nodir: true,
  });

  if (imagePaths.length === 0) {
    console.log('No images found to compress.');
    return;
  }

  console.log(`Found ${imagePaths.length} images. Analyzing file sizes...`);

  let compressedCount = 0;

  for (const imagePath of imagePaths) {
    try {
      const stats = await fs.stat(imagePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (stats.size <= MAX_FILE_SIZE_BYTES) {
        console.log(`Skipping ${path.basename(imagePath)} (${fileSizeMB.toFixed(2)} MB) - already within size limit.`);
        continue;
      }

      console.log(`Compressing ${path.basename(imagePath)} (${fileSizeMB.toFixed(2)} MB)...`);

      const tempOutputPath = `${imagePath}.tmp`;
      const ext = path.extname(imagePath).toLowerCase();
      let newSharpInstance = sharp(imagePath);

      if (ext === '.jpg' || ext === '.jpeg') {
        newSharpInstance = newSharpInstance.jpeg({ quality: JPEG_QUALITY });
      } else if (ext === '.png') {
        newSharpInstance = newSharpInstance.png({ quality: PNG_QUALITY, compressionLevel: PNG_COMPRESSION_LEVEL });
      }

      await newSharpInstance.toFile(tempOutputPath);

      const newStats = await fs.stat(tempOutputPath);
      const newFileSizeMB = newStats.size / (1024 * 1024);
      const reduction = ((stats.size - newStats.size) / stats.size) * 100;

      await fs.rename(tempOutputPath, imagePath);
      
      console.log(`Compressed ${path.basename(imagePath)} → ${newFileSizeMB.toFixed(2)} MB (${reduction.toFixed(1)}% reduction)`);
      compressedCount++;

    } catch (error) {
      console.error(`Error processing ${path.basename(imagePath)}:`, error);
      const tempFile = `${imagePath}.tmp`;
      try {
        await fs.stat(tempFile);
        await fs.unlink(tempFile);
      } catch (e) {
      }
    }
  }

  console.log(`Compression complete! ${compressedCount} out of ${imagePaths.length} images were compressed.`);
}

compressImages();