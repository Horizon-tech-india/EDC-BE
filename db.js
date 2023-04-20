const { MongoClient } = require('mongodb')

// Get the MongoDB connection URL from the environment variable
const url = process.env.MONGODB_URL_LOCAL

// Specify the database name
const dbName = 'EDCHorizonTech'

// Create a new MongoClient instance
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

async function connectToDatabase() {
  try {
    // Connect to the MongoDB server
    await client.connect()

    // Return the database object
    return client.db(dbName)
  } catch (err) {
    // Log the error to the console
    console.error(err)

    // Return null to indicate that there was an error connecting to the database
    return null
  }
}

module.exports = connectToDatabase
