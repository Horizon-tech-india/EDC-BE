/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose')

require('dotenv').config()

const fs = require('fs')
const https = require('https')
const http = require('http')

const app = require('./app')

const port = process.env.PORT

app.set('port', port)

let server
mongoose.connect(process.env.MONGODB_URL_LOCAL).then(() => {
  console.log('Connected to MongoDB')
  server = app.listen(port, () => {
    console.log(`Listening to port ${port}`)
  })
})

// If a private key is specified, create an HTTPS server with the specified key and certificate
if (process.env.PRIVATE_KEY && process.env.CERTIFICATE) {
  const key = fs.readFileSync(process.env.PRIVATE_KEY),
    cert = fs.readFileSync(process.env.CERTIFICATE)
  server = https.createServer({ key, cert }, app)
} else {
  // Otherwise, create an HTTP server
  server = http.createServer(app)
}
const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed')
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
}

const unexpectedErrorHandler = (error) => {
  console.log(error)
  exitHandler()
}
process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)
process.on('SIGTERM', () => {
  console.log('SIGTERM received')
  if (server) {
    server.close()
  }
})
