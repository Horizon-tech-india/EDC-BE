const authController = require('./auth.controller')
const auth = require('./auth.middleware')
const authService = require('./auth.service')
const authValidation = require('./auth.validation')
const jwtStrategy = require('./passport')

module.exports = {
  authController,
  auth,
  authService,
  authValidation,
  jwtStrategy,
}
