const httpStatus = require('http-status')
const User = require('./user.model')
const ApiError = require('../errors/ApiError')

const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
  }
  return User.create(userBody)
}

const registerUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
  }
  return User.create(userBody)
}

const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options)
  return users
}

const getUserByEmail = async (email) => User.findOne({ email })

const getUserById = async (id) => User.findById(id)

const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
  }
  Object.assign(user, updateBody)
  await user.save()
  return user
}

const deleteUserById = async (userId) => {
  const user = await getUserById(userId)
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }
  await user.remove()
  return user
}

module.exports = {
  createUser,
  registerUser,
  queryUsers,
  getUserByEmail,
  updateUserById,
  deleteUserById,
}
