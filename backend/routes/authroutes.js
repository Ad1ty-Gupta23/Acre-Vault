import express from 'express';
import { 
  register, 
  login, 
  getMe,
  getPendingOfficials,
  verifyGovernmentOfficial
} from '../controllers/authcontroller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/pending-officials', protect, authorize('government'), getPendingOfficials);
router.put('/verify/:id', protect, authorize('government'), verifyGovernmentOfficial);

export default router;