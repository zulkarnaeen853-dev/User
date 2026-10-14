const mongoose = require('mongoose')

const {Schema} = mongoose

const User = new Schema(
    {
    name: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, 
    },
    profilePic: {
      type: String,
      default: '', 
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer not to say'],
      default: 'prefer not to say',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    dateOfBirth: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
},
{
    timestamps: true, 
  }
)

module.exports = mongoose.model('User', User);


