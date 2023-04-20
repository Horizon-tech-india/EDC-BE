// Importing required modules
const express = require('express')
const usersRouter = require('./routes/users')
const ErrorClass = require('./services/error')

// Creating Express app instance
const app = express()

// Parsing incoming JSON and URL-encoded request bodies
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Mounting the users router
app.use('/users', usersRouter)

// Handling all other routes with a 404 error
app.all('*', (req, res, next) => {
  next(new ErrorClass(`Requested URL ${req.path} not found!`, 404))
})

// Error handling middleware
app.use((err, req, res, next) => {
  const errorCode = err.code || 500
  res.status(errorCode).send({
    message: err.message || 'Internal Server Error. Something went wrong!',
    status: errorCode,
  })
})

// Exporting the app instance
module.exports = app
