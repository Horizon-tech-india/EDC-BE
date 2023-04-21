/* eslint-disable import/no-extraneous-dependencies */
// Importing required modules
const cors = require('cors')
const express = require('express')
const passport = require('passport')
const usersRouter = require('./routes/users')
const ErrorClass = require('./services/error')
const authLimiter = require('./modules/utils')
const routes = require('./routes/v1')

const { jwtStrategy } = require('./modules/auth')

const app = express()
// enable cors
app.use(cors())
app.options('*', cors())

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// app.use('/users', usersRouter)

// jwt authentication
app.use(passport.initialize())
passport.use('jwt', jwtStrategy)

// limit repeated failed requests to auth endpoints
if (process.env === 'production') {
  app.use('/v1/auth', authLimiter)
}

// Define a route handler
app.get('/', (req, res) => {
  res.send('Hello, World!')
})
// v1 api routes
app.use('/v1', routes)

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
