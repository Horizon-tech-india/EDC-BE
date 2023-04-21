const jwt = require('jsonwebtoken')
const Signup = require('../models/signup')
const Login = require('../models/login')
// Login controller function
module.exports.login = async (req, res, next) => {
  const { email, password } = req.body
  const login = await Login.findOne({ email })
  if (!login) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  const isPasswordValid = await login.comparePassword(password)
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  // Generate a JWT token with user's ID as payload
  const token = jwt.sign({ userId: login._id }, process.env.JWT_SECRET, {
    expiresIn: '10h',
  })
  // Send the token as response
  res.json({ token })

  return res.status(200).json({ token })
}

// Signup controller function
module.exports.signup = async (req, res, next) => {
  try {
    const data = req.body
    console.log(req.body)
    const signup = new Signup(data)
    await signup.save()
    res.status(201).json({ message: 'Signup successful' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
  next()
}

// Logout controller function
module.exports.logout = async (req, res, next) => {
  try {
    // TODO: Implement user logout logic here

    // Send a success response if logout is successful
    res.json({ message: 'Logout successful' })
  } catch (error) {
    // Log the error to the console or your preferred logging mechanism
    console.error(error)

    // Send a 500 Internal Server Error response to the client
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
