const { ACTIVITY, ROLE, LOCATION } = require('../constants/constant')
const Signup = require('../models/signup')
const EventMeeting = require('../models/eventMeeting')

async function signupUsers() {
  const entries = []

  // Generate 100 random entries
  for (let i = 0; i < 100; i++) {
    const firstName = generateRandomString(3, 20)
    const lastName = generateRandomString(3, 20)
    const email = `${generateRandomString(10, 20)}@example.com`
    const phoneNumber = generateRandomNumberString(10)
    const password = 'Abc@1234567'
    const otpVerified = true
    const isForgotPassword = false
    const role = generateRandomRole()
    const branch = generateRandomBranch()
    const entry = {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      otpVerified,
      isForgotPassword,
      role,
    }
    if (role === ROLE.ADMIN) {
      entry.branch = branch
    }
    entries.push(entry)
  }

  try {
    // Save the entries in bulk
    await Signup.insertMany(entries)

    console.log('Entries saved successfully')
  } catch (error) {
    console.error('Error while saving entries:', error)
  }
}

async function eventAndMeetings() {
  const entries = []
  const res = await Signup.find()
  // Generate 100 random entries
  const startDate = new Date(2022, 0, 1) // January 1, 2022
  const endDate = new Date(2022, 11, 31) // December 31, 2022

  for (let i = 0; i < res.length; i++) {
    const title = generateRandomString(3, 20)
    const type = generateRandomScheduleType()
    const link = generateRandomString(3, 20)
    const description = generateRandomString(3, 20)
    const dateAndTime = randomDate(startDate, endDate)
    const createdByEmail = res[i].email
    const createdByName = res[i].firstName
    const filters = [{ location: res[i].branch[0] }]
    const entry = {
      title,
      type,
      link,
      description,
      dateAndTime,
      createdByEmail,
      createdByName,
      filters,
    }
    if (!entry.link) {
      delete entry.link
    }
    if (!entry.description) {
      delete entry.description
    }
    if (res[i].role === ROLE.ADMIN) {
      entries.push(entry)
    }
  }

  try {
    // Save the entries in bulk
    await EventMeeting.insertMany(entries)

    console.log('Entries saved successfully')
  } catch (error) {
    console.error('Error while saving entries:', error)
  }
}

function generateRandomString(minLength, maxLength) {
  const length =
    minLength + Math.floor(Math.random() * (maxLength - minLength + 1))
  let result = ''

  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

function generateRandomNumberString(length) {
  let result = ''

  const digits = '0123456789'

  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length))
  }

  return result
}

function generateRandomRole() {
  const roles = ['admin', 'user']
  return roles[Math.floor(Math.random() * roles.length)]
}
function generateRandomScheduleType() {
  const types = ['event', 'meeting']
  return types[Math.floor(Math.random() * types.length)]
}

function randomNumberInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function generateRandomBranch() {
  const branches = [
    'Parul University',
    'Vadodara Startup Studio',
    'Ahmedabad Startup Studio',
    'Rajkot Startup Studio',
    'Surat Startup Studio',
  ]
  const res = []
  for (let i = 0; i < randomNumberInRange(2, 5); i++) {
    res.push(branches[randomNumberInRange(0, 4)])
  }
  return res
}
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  )
}
module.exports = {
  signupUsers,
  eventAndMeetings,
}
