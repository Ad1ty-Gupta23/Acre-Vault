import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/usermodel.js';
import { verifyAadhaar, verifyPAN } from '../utils/mockverification.js';


export const register = async (req, res) => {
  try {
    const { name, email, password, role, aadhaarNumber, panNumber } = req.body;
    console.log('Received:', req.body); // Log incoming data

    // Validate required fields
    if (!name || !email || !password || !role || !aadhaarNumber || !panNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, password, role, aadhaarNumber, panNumber) are required'
      });
    }

    // Check for existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      aadhaarNumber,
      panNumber
    });

    // Send success response (e.g., with a token)
    res.status(201).json({ success: true, message: 'User created' });
  } catch (error) {
    console.error('Registration error:', error); // Log the error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate email or Aadhaar number'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message // Send detailed error for debugging
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is verified (especially for government officials)
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Your account is pending verification'
      });
    }

    // Create token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify government official account
// @route   PUT /api/auth/verify/:id
// @access  Private/Admin (would typically be admin-only)
export const verifyGovernmentOfficial = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'government') {
      return res.status(400).json({
        success: false,
        message: 'Only government official accounts need verification'
      });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res
    .status(statusCode)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
};