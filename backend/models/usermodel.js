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
  isVerified: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});





export default model('User', UserSchema);