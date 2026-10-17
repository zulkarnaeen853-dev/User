const mongoose = require('mongoose')

const {Schema} = mongoose

const User = new Schema(
    {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, 
    },
    profilePic: {
      type: String,
      default: '', 
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'other', 'prefer not to say'],
      default: 'prefer not to say',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: String,
      trim: true,
      match: [
        /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[0-2])[- /.](19|20)\d{2}$/,
        'Birth date must use DD-MM-YYYY format',
      ],
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
