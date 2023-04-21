const express = require('express'),
  userRouter = express.Router(),
  userController = require('../controllers/users')

userRouter.post('/login', userController.login)
userRouter.post('/signup', userController.signup)
userRouter.post('/verify-mail-otp', userController.verifyMailOtp)
userRouter.post('/resend-otp', userController.resendMailOTP)
userRouter.post('/set-new-password', userController.setNewPassword)

module.exports = userRouter
