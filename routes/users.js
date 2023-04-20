const express = require('express'),
  userRouter = express.Router(),
  userController = require('../controllers/users')
  sendEmail = require("../controllers/users");
  changePassword = require("../controllers/users");
  sendVerifyMail  = require("../services/common.utils");

userRouter.post('/login', userController.login)

userRouter.post('/signup', userController.signup)

// for send main 
userRouter.get("/sendmail",sendVerifyMail);

//for forgot password getting mail
userRouter.post("/emailsend",sendEmail);

//for forgot password getting otp
userRouter.post("/changePassword",changePassword);

// need to use auth token for every api expect login
module.exports = userRouter
