const express = require('express')

const userRouter = express.Router()

const userController = require('../controllers/users')

userRouter.post('/login', userController.login)

userRouter.post('/signup', userController.signup)

// Catch-all error handler for the user router
userRouter.use((err, req, res, next) => {
  console.error(err)

  res.status(500).json({ error: 'Internal Server Error' })
})

module.exports = userRouter
