// Import the Express.js library
const express = require('express')

// Create an instance of the Router object from Express.js
const userRouter = express.Router()

// Import the user controller module
const userController = require('../controllers/users')

// Route for user login
userRouter.post('/login', userController.login)

// Route for user signup
userRouter.post('/signup', userController.signup)

// Catch-all error handler for the user router
userRouter.use((err, req, res, next) => {
  // Log the error to the console or your preferred logging mechanism
  console.error(err)
  // Return a 500 Internal Server Error response to the client
  res.status(500).json({ error: 'Internal Server Error' })
})

// Export the user router
module.exports = userRouter
