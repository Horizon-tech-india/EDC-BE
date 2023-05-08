const Signup = require('../models/signup')

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

    entries.push({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      otpVerified,
      isForgotPassword,
      role,
    })
  }

  try {
    // Save the entries in bulk
    await Signup.insertMany(entries)

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

// function generateRandomBoolean() {
//   return Math.random() < 0.5
// }

function generateRandomRole() {
  const roles = ['admin', 'user']
  return roles[Math.floor(Math.random() * roles.length)]
}

module.exports = {
  signupUsers,
}
