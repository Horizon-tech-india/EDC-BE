const jwt = require('jsonwebtoken')
const moment = require('moment')

const httpStatus = require('http-status')

const Token = require('./token.model')
const ApiError = require('../errors/ApiError')
const tokenTypes = require('./token.types')
const { userService } = require('../user')

const config = {
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes:
      process.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes:
      process.env.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      signed: true,
    },
  },
}

const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  }
  return jwt.sign(payload, secret)
}

const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  })
  return tokenDoc
}

const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret)
  if (typeof payload.sub !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'bad user')
  }
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  })
  if (!tokenDoc) {
    throw new Error('Token not found')
  }
  return tokenDoc
}

const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    'minutes',
  )
  const accessToken = generateToken(
    user.id,
    accessTokenExpires,
    tokenTypes.ACCESS,
  )

  const refreshTokenExpires = moment().add(
    config.jwt.refreshExpirationDays,
    'days',
  )
  const refreshToken = generateToken(
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH,
  )
  await saveToken(
    refreshToken,
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH,
  )

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  }
}

const generateResetPasswordToken = async (email) => {
  const user = await userService.getUserByEmail(email)
  if (!user) {
    throw new ApiError(httpStatus.NO_CONTENT, '')
  }
  const expires = moment().add(
    config.jwt.resetPasswordExpirationMinutes,
    'minutes',
  )
  const resetPasswordToken = generateToken(
    user.id,
    expires,
    tokenTypes.RESET_PASSWORD,
  )
  await saveToken(
    resetPasswordToken,
    user.id,
    expires,
    tokenTypes.RESET_PASSWORD,
  )
  return resetPasswordToken
}

const generateVerifyEmailToken = async (user) => {
  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    'minutes',
  )
  const verifyEmailToken = generateToken(
    user.id,
    expires,
    tokenTypes.VERIFY_EMAIL,
  )
  await saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL)
  return verifyEmailToken
}
module.exports = {
  generateVerifyEmailToken,
  generateResetPasswordToken,
  generateAuthTokens,
  verifyToken,
  saveToken,
  generateToken,
}
