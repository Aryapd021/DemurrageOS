import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentController } from './document.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { config } from '../../config/index.js';
import { ValidationError } from '../../common/errors/app-error.js';

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only PDF, PNG, or JPEG documents are permitted'));
    }
  }
});

const router = Router();

router.use(authMiddleware);

router.post('/upload', upload.single('file'), DocumentController.uploadDocument);
router.get('/:id', DocumentController.getDocument);
router.get('/container/:containerId', DocumentController.getContainerDocuments);
router.post('/:id/review', DocumentController.reviewDocument);

export const documentRouter = router;
