// Load environment variables from a .env file in the root directory
require('dotenv').config()

// Load the built-in `fs` and `https`/`http` modules
const fs = require('fs')
const https = require('https')
const http = require('http')

// Import the `app` module from a local file
const app = require('./app')

// Get the port number from the environment variables
const port = process.env.PORT

// Set the `port` variable in the `app` module
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
