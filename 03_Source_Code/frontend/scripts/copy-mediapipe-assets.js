const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', '..', 'eye-tracking-app', 'public');
const targetDir = path.join(__dirname, 'public');

function copyFileSync(source, target) {
  let targetFile = target;
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }
  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
  let files = [];
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}

console.log('Copying MediaPipe assets...');

// Copy MediaPipe folder
if (fs.existsSync(path.join(sourceDir, 'mediapipe'))) {
  copyFolderRecursiveSync(path.join(sourceDir, 'mediapipe'), targetDir);
  console.log('✓ MediaPipe assets copied');
}

// Copy OpenCV files (skip karena besar, bisa pakai CDN)
// if (fs.existsSync(path.join(sourceDir, 'opencv.js'))) {
//   copyFileSync(path.join(sourceDir, 'opencv.js'), path.join(targetDir, 'opencv.js'));
//   console.log('✓ OpenCV.js copied');
// }

console.log('Assets copy completed!');
console.log('Note: OpenCV files skipped due to size. Will use CDN or disable OpenCV for now.');