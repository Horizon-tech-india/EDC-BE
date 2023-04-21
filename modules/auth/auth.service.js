/* eslint-disable import/no-extraneous-dependencies */
const httpStatus = require('http-status')
const mongoose = require('mongoose')
const Token = require('../token')
const ApiError = require('../errors/ApiError')
const tokenTypes = require('../token')
const {
  getUserByEmail,
  getUserById,
  updateUserById,
} = require('../user/user.service')
const { generateAuthTokens, verifyToken } = require('../token')

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await getUserByEmail(email)
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password')
  }
  return user
}

const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  })
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found')
  }
  await refreshTokenDoc.remove()
}

const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken, tokenTypes.REFRESH)
    const user = await getUserById(
      new mongoose.Types.ObjectId(refreshTokenDoc.user),
    )
    if (!user) {
      throw new Error()
    }
    await refreshTokenDoc.remove()
    const tokens = await generateAuthTokens(user)
    return { user, tokens }
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate')
  }
}

const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await verifyToken(
      resetPasswordToken,
      tokenTypes.RESET_PASSWORD,
    )
    const user = await getUserById(
      new mongoose.Types.ObjectId(resetPasswordTokenDoc.user),
    )
    if (!user) {
      throw new Error()
    }
    await updateUserById(user.id, { password: newPassword })
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD })
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed')
  }
}

const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await verifyToken(
      verifyEmailToken,
      tokenTypes.VERIFY_EMAIL,
    )
    const user = await getUserById(
      new mongoose.Types.ObjectId(verifyEmailTokenDoc.user),
    )
    if (!user) {
      throw new Error()
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL })
    const updatedUser = await updateUserById(user.id, { isEmailVerified: true })
    return updatedUser
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed')
  }
}

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
}
