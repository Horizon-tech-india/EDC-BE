/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  remember_me: {
    type: Boolean,
    default: false,
  },
})

const Login = mongoose.model('login', userSchema)

module.exports = Login
