require('dotenv').config()

const fs = require('fs')
const https = require('https')
const http = require('http')
const mongoose = require('mongoose')
const app = require('./app')
const connectToDatabase = require('./db')

const port = process.env.PORT

app.set('port', port)

let server

// If a private key is specified, create an HTTPS server with the specified key and certificate
if (process.env.PRIVATE_KEY && process.env.CERTIFICATE) {
  const key = fs.readFileSync(process.env.PRIVATE_KEY),
    cert = fs.readFileSync(process.env.CERTIFICATE)
  server = https.createServer({ key, cert }, app)
} else {
  // Otherwise, create an HTTP server
  server = http.createServer(app)
}

async function startServer() {
  try {
    mongoose
      .connect(process.env.MONGODB_URL_LOCAL, {
        useNewUrlParser: true,

        useUnifiedTopology: true,
      })
      .then(() => {
        server.listen(port, () => {
          console.log(
            `Connected to local - Database for http server to port ${port}`,
          )
        })
      })
      .catch((err) => {
        console.log(err)
      })
  } catch (err) {
    console.error('Error connecting to database', err)
    process.exit(1)
  }
}

startServer()
