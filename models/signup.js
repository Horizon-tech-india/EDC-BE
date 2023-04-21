/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const speakeasy = require('speakeasy')

const SignupSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minlength: [3, 'Minimum 3 letters required'],
    maxlength: [20, 'Maximum 20 letters allowed'],
    lowercase: true,
  },
  lastName: {
    type: String,
    required: true,
    minlength: [3, 'Minimum 3 letters required'],
    maxlength: [20, 'Maximum 20 letters allowed'],
    lowercase: true,
  },
  profession: {
    type: String,
    enum: ['student', 'coordinator'],
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: 'Invalid email address',
    },
    lowercase: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
    min: 1000000000,
    max: 9999999999,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator(value) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          value,
        )
      },
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  },
  startupName: {
    type: String,
    required: true,
    index: true,
  },
  applyingTo: {
    type: String,
    required: true,
    index: true,
  },
  website: {
    type: String,
    required: true,
  },
  mailOTP: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user'],
    default: 'user',
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

// Hash password before saving
// SignupSchema.pre('save', async function (next) {
//   const user = this

//   if (!user.isModified('password')) {
//     return next()
//   }

//   try {
//     const salt = await bcrypt.genSalt(10)
//     const hash = await bcrypt.hash(user.password, salt)
//     user.password = hash
//     next()
//   } catch (error) {
//     return next(error)
//   }
// })

// Generate OTP before saving
// SignupSchema.pre('save', async function (next) {
//   const user = this
//   if (!user.isModified('mailOTP')) {
//     return next()
//   }
//   try {
//     const otp = speakeasy.totp({
//       secret: process.env.OTP_SECRET,
//       encoding: 'base32',
//     })
//     user.mailOTP = otp
//     next()
//   } catch (error) {
//     return next(error)
//   }
// })

const Signup = mongoose.model('users', SignupSchema)

module.exports = Signup
