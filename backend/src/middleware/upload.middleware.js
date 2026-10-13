import multer from 'multer';

// 5 MB file upload limit
export const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }
});
