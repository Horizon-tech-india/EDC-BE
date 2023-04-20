// Importing required modules
const express = require('express')
const usersRouter = require('./routes/users')
const ErrorClass = require('./services/error')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/users', usersRouter)

// Define a route handler
app.get('/', (req, res) => {
  res.send('Hello, World!')
})

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

module.exports = app
