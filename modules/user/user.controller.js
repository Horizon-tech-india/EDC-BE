const httpStatus = require('http-status')
const mongoose = require('mongoose')
const catchAsync = require('../utils/catchAsync')
const ApiError = require('../errors/ApiError')
const pick = require('../utils/pick')
const userService = require('./user.service')

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body)
  res.status(httpStatus.CREATED).send(user)
})

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role'])
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy'])
  const result = await userService.queryUsers(filter, options)
  res.send(result)
})

const getUser = catchAsync(async (req, res) => {
  if (typeof req.params.userId === 'string') {
    const user = await userService.getUserById(
      new mongoose.Types.ObjectId(req.params.userId),
    )
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    res.send(user)
  }
})

const updateUser = catchAsync(async (req, res) => {
  if (typeof req.params.userId === 'string') {
    const user = await userService.updateUserById(
      new mongoose.Types.ObjectId(req.params.userId),
      req.body,
    )
    res.send(user)
  }
})

const deleteUser = catchAsync(async (req, res) => {
  if (typeof req.params.userId === 'string') {
    await userService.deleteUserById(
      new mongoose.Types.ObjectId(req.params.userId),
    )
    res.status(httpStatus.NO_CONTENT).send()
  }
})

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
}
