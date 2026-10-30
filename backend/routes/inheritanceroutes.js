import express from 'express';
import {
  createClaim,
  getMyClaims,
  getClaims,
  approveClaim,
  rejectClaim
} from '../controllers/inheritancecontroller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/claims', protect, createClaim);
router.get('/claims/mine', protect, getMyClaims);
router.get('/claims', protect, authorize('government'), getClaims);
router.put('/claims/:id/approve', protect, authorize('government'), approveClaim);
router.put('/claims/:id/reject', protect, authorize('government'), rejectClaim);

export default router;
