import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DELETE_ORIGINALS = false; // Set to true to delete original images after conversion
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];
const PUBLIC_DIR = path.join(__dirname, '../public');
const SRC_DIR = path.join(__dirname, '../src');

const imageRefRegex = /(['"`])((?:(?!\1).)*\.(?:jpg|jpeg|png|gif))\1/gi;

async function convertImagesToWebP() {
  console.log('🔍 Mencari semua image di public folder...');

  const imageFiles = await glob(`**/*.{jpg,jpeg,png,gif}`, {
    nodir: true,
    cwd: PUBLIC_DIR,
    absolute: true,
  });

  console.log(`📊 Ditemukan ${imageFiles.length} image files`);

  for (const file of imageFiles) { // Using `for...of` for sequential async operations
    const ext = path.extname(file).toLowerCase();
    if (!IMAGE_EXTENSIONS.includes(ext)) continue;

    const webpPath = file.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
    
    if (fs.existsSync(webpPath)) {
      console.log(`⏭️  ${path.relative(PUBLIC_DIR, webpPath)} sudah ada, skip`);
      continue;
    }

    try {
      await sharp(file)
        .webp({ quality: 80 })
        .toFile(webpPath);
      
      console.log(`✅ ${path.relative(PUBLIC_DIR, file)} → ${path.relative(PUBLIC_DIR, webpPath)}`);
      
      if (DELETE_ORIGINALS) {
        fs.unlinkSync(file);
        console.log(`🗑️  Dihapus: ${path.relative(PUBLIC_DIR, file)}`);
      }
    } catch (error) {
      console.error(`❌ Error converting ${file}:`, error.message);
    }
  }
}

async function updateImageReferencesInCode() {
  console.log('\n📝 Update referensi image di kode...');

  const sourceFiles = await glob(`**/*.{ts,tsx,js,jsx,css,scss}`, {
    nodir: true,
    cwd: SRC_DIR,
    absolute: true,
  });

  console.log(`📊 Ditemukan ${sourceFiles.length} source files untuk di-update`);

  let updatedCount = 0;

  for (const file of sourceFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;

    content = content.replace(imageRefRegex, (match, quote, imagePath) => {
      const newPath = imagePath.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
      if (imagePath !== newPath) {
        console.log(`  - ${path.relative(SRC_DIR, file)}: "${imagePath}" → "${newPath}"`);
        updatedCount++;
      }
      return `${quote}${newPath}${quote}`;
    });

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf-8');
    }
  }

  console.log(`\n✅ Total ${updatedCount} referensi di-update.`);
}

async function main() {
  try {
    console.log('🚀 Mulai convert images ke WebP...\n');
    await convertImagesToWebP();
    
    console.log('\n🔄 Update referensi di source code...\n');
    await updateImageReferencesInCode();
    
    console.log('\n✨ Selesai! Image conversion dan update referensi berhasil.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();