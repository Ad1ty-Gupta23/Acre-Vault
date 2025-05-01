import express from 'express';
import { 
  register, 
  login, 
  getMe,
  verifyGovernmentOfficial
} from '../controllers/authcontroller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/verify/:id', protect, authorize('government'), verifyGovernmentOfficial);

export default router;