/* eslint-disable import/no-extraneous-dependencies */

const { MongoClient } = require('mongodb')

const url = process.env.MONGODB_URL_LOCAL

// Specify the database name
const dbName = 'EDCHorizonTech'

const client = new MongoClient(url)

module.exports = async function connectToDatabase() {
  try {
    await client.connect()
    return client.db()
  } catch (err) {
    console.error(err)
    return null
  }
}
