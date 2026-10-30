import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['landowner', 'buyer', 'government'],
    default: 'buyer'
  },
  aadhaarNumber: {
    type: String,
    required: [true, 'Please provide Aadhaar number'],
    unique: true,
    minlength: 12,
    maxlength: 12
  },
  panNumber: {
    type: String,
    required: [true, 'Please provide PAN number'],
    unique: true,
    minlength: 10,
    maxlength: 10
  },
  // Government accounts start unverified; register() sets this explicitly
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});





export default model('User', UserSchema);