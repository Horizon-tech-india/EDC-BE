require('dotenv').config();

const fs = require('fs');
const https = require('https');
const http = require('http');
const app = require('./app');

const port = process.env.PORT;
app.set('port', port);

let server;

if (process.env.PRIVATE_KEY) {
  const key = fs.readFileSync(process.env.PRIVATE_KEY),
    cert = fs.readFileSync(process.env.CERTIFICATE);
  server = https.createServer({ key, cert }, app);
} else {
  server = http.createServer(app);
}

server.listen(port, async () => {
  console.log('Server is *_* at port', port);
});
