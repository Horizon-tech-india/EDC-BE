const userController = require('./user.controller')

const User = require('./user.model').default
const userService = require('./user.service')
const userValidation = require('./user.validation')

module.exports = {
  userController,
  User,
  userService,
  userValidation,
}
