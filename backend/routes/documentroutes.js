import express from 'express';
import multer from 'multer';
import { uploadDocument } from '../controllers/documentcontroller.js';
import { protect } from '../middleware/auth.js';

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

// Files stay in memory and go straight to IPFS; nothing is written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'document'));
  }
});

// Turn multer errors into the API's usual JSON shape
const handleUpload = (req, res, next) =>
  upload.single('document')(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Document must be 10 MB or smaller'
        : 'Upload a PDF, PNG or JPEG document';
    res.status(400).json({ success: false, message });
  });

const router = express.Router();

router.post('/', protect, handleUpload, uploadDocument);

export default router;
