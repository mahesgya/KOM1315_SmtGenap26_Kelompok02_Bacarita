import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { diskStorage, StorageEngine } from 'multer';
import { join } from 'path';

const storyImageUploadDir = join(process.cwd(), 'public', 'story-images');
// Ensure directory exists
if (!fs.existsSync(storyImageUploadDir)) {
  fs.mkdirSync(storyImageUploadDir, { recursive: true });
}

export const storyImageStorage: { storage: StorageEngine } = {
  storage: diskStorage({
    destination: (_, __, cb) => {
      cb(null, storyImageUploadDir);
    },
    filename: (_, file, cb) => {
      const ext = file.originalname.split('.').pop() || 'jpg';
      cb(null, `${randomUUID()}.${ext}`);
    },
  }),
};
