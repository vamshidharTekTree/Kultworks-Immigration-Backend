import path    from 'path';
import multer  from 'multer';
import { maxFileSizeMb } from '../configs/env.config.js';

const ACCEPTED_MIMETYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const fileFilter = (_req, file, cb) => {
  if (ACCEPTED_MIMETYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${path.extname(file.originalname)}`), false);
  }
};

// Memory storage — file is available as req.file.buffer for S3 upload
export const uploadFile = multer({
  storage:  multer.memoryStorage(),
  limits:   { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter,
}).single('file');
