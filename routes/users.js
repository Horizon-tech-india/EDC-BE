const express = require('express'),
    userRouter = express.Router(),
    userController = require('../controllers/users');

userRouter.post('/login', userController.login);

userRouter.post('/signup', userController.logout);
// need to use auth token for every api expect login
module.exports = userRouter;
