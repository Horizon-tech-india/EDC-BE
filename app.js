const express = require('express')

const app = express()
const users = require('./routes/users')

const ErrorClass = require('./services/error')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/users', users)

app.all('*', (req) => {
  throw new ErrorClass(`Requested URL ${req.path} not found!`, 404)
})

app.use((err, req, res, next) => {
  const errorCode = err.code || 500
  res.status(errorCode).send({
    message: err.message || 'Internal Server Error. Something went wrong!',
    status: errorCode,
  })
})

module.exports = app
