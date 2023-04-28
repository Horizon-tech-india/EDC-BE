const express = require('express'),
  userRouter = express.Router(),
  userController = require('../controllers/users'),
  { auth } = require('../middleware/auth')

const { upload } = require('../services/multer')

userRouter.post('/login', userController.login)
userRouter.post('/signup', userController.signup)
userRouter.post('/verify-mail-otp', userController.verifyMailOtp)
userRouter.post('/resend-otp', userController.resendMailOTP)
userRouter.post('/set-new-password', userController.setNewPassword)
userRouter.get('/logout', auth, userController.logout)
userRouter.post('/startup-details', auth, userController.userStartupSupport)
userRouter.post(
  '/file-upload',
  upload.single('file'),
  userController.fileUpload,
)

module.exports = userRouter
