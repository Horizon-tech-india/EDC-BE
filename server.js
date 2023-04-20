require('dotenv').config()

const fs = require('fs')
const https = require('https')
const http = require('http')

const app = require('./app')

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

// Start the server and listen for incoming requests
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
