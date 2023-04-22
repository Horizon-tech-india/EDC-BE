const Signup = require('../models/signup')
const validator = require('validator')
const { validateRequest } = require('../services/common.utils')
const ErrorClass = require('../services/error')
const bcrypt = require('bcryptjs')
const { generateRandomOTP, generateToken } = require('../services/common.utils')
const { sendEmail, mailOTPTemp } = require('../services/mail')
const { MESSAGES } = require("../constants/constant")

module.exports.login = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      password: true,
      rememberMe: true,
    })
    if (isInvalidRequest) {
      throw new ErrorClass(MESSAGES.ERROR.INVALID_REQ, 400) 
    }
    const { email, password, rememberMe } = req.body

    const isUserExits = await Signup.findOne({
      email: email,
    })
    if (!isUserExits) {
      throw new ErrorClass(MESSAGES.ERROR.INVALID_USER, 400)   
    }
    if (!isUserExits.otpVerified) {
        throw new ErrorClass(MESSAGES.ERROR.VERIFY_EMAIL, 400)  
      }
    const passwordMatch = await bcrypt.compare(password, isUserExits.password)
    if (!passwordMatch) {
      throw new ErrorClass(MESSAGES.ERROR.INVALID_PASSWORD, 400)  
    }
    const token = generateToken(isUserExits, rememberMe)
    await Signup.findOneAndUpdate({ email: email }, { token })
    res.status(200).send({
      message: MESSAGES.SUCCESS.MESSAGE,  
      data: { email, token },
    })
  } catch (err) {
    next(err)
  }
}

module.exports.signup = async (req, res, next) => {
  const { email, password } = req.body
  try {
    const isInvalidRequest = validateRequest(req.body, {
      firstName: true,
      lastName: true,
      password: true,
      email: true,
      phoneNumber: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(MESSAGES.ERROR.INVALID_REQ, 400)  
    }
    const isUserExits = await Signup.findOne({
      email: email,
    })
    if (isUserExits && isUserExits.otpVerified) {
      throw new ErrorClass(MESSAGES.ERROR.USER_EXITS, 400) 
    }
    if (
      !validator.isLength(password, { min: 8 }) ||
      !validator.isEmail(email)
    ) {
      throw new ErrorClass(
        MESSAGES.ERROR.PASSWORD_LENGTH,   
        400,
      )
    }

    const mailOtp = generateRandomOTP()
    const htmlTemp = mailOTPTemp(mailOtp)
    const mailOptions = {
      to: email,
      subject: 'Horizon Tech signup verification code',
      html: htmlTemp,
    }
    await sendEmail(mailOptions)
    const userData = {
      ...req.body,
      mailOTP: mailOtp,
      otpVerified: false,
      isForgotPassword: false,
    }
    const salt = await bcrypt.genSaltSync(10)
    userData.password = bcrypt.hashSync(password, salt)

    if (isUserExits && !isUserExits.otpVerified) {
      await Signup.findOneAndUpdate({ email: email }, userData)
    } else {
      const insertData = new Signup(userData)
      await insertData.save()
    }

    res.send({ message: MESSAGES.SUCCESS.OTP_MESSAGE, status: 200 })  
  } catch (err) {
    next(err)
  }
}

//use for verify mail otp and forgot password otp
module.exports.verifyMailOtp = async (req, res, next) => {
  const { email, isForgotPassword } = req.body
  try {
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      otp: true,
      isForgotPassword: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(MESSAGES.ERROR.INVALID_REQ, 400)   
    }
    const isUserExits = await Signup.findOne({
      email: email,
    })
    if (!isUserExits) {
      throw new ErrorClass(
        MESSAGES.ERROR.INVALID_USER,  
        400,
      )
    }
    if (isUserExits.mailOTP === req.body.otp) {
      if (isForgotPassword) {
        await Signup.updateOne(
          { email: email },
          {
            $set: {
              isForgotPassword: true,
            },
          },
        )
        res.send({
          message: MESSAGES.MESSAGES.SET_NEW_PASSWORD,  
          status: 200,
        })
      } else {
        await Signup.updateOne(
          { email: email },
          {
            $set: {
              otpVerified: true,
            },
          },
        )
        res.send({
          message: MESSAGES.SUCCESS.EMAIL_VERIFIED,  
          status: 200,
        })
      }
    } else {
      throw new ErrorClass(MESSAGES.ERROR.INCORRECT_OTP, 400)  
    }
  } catch (e) {
    next(e)
  }
}

//use for forgot password and resend mail otp
module.exports.resendMailOTP = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      isForgotPassword: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(MESSAGES.ERROR.INVALID_REQ, 400)  
    }
    const { isForgotPassword, email } = req.body
    const isUserExits = await Signup.findOne({
      email: email,
    })
    if (!isUserExits) {
      throw new ErrorClass(
        MESSAGES.ERROR.INVALID_USER,    
        400,
      )
    }

    const mailOtp = generateRandomOTP()
    const htmlTemp = mailOTPTemp(mailOtp)
    const mailOptions = {
      to: email,
      subject: 'Horizon Tech signup verification code',
      html: htmlTemp,
    }
    await sendEmail(mailOptions)
    let updateSignupColl = {
      $set: {
        mailOTP: mailOtp,
      },
    }
    if (isForgotPassword) {
      updateSignupColl = {
        $set: {
          mailOTP: mailOtp,
          isForgotPassword: false,
        },
      }
    }
    await Signup.updateOne({ email: email }, updateSignupColl)
    res.send({
      message: MESSAGES.SUCCESS.OTP_RESEND,  
      status: 200,
    })
  } catch (e) {
    next(e)
  }
}

module.exports.setNewPassword = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      newPassword: true,
      confirmNewPassword: true,
    })
    const { email, newPassword, confirmNewPassword } = req.body
    if (isInvalidRequest) {
      throw new ErrorClass(MESSAGES.ERROR.INVALID_REQ, 400)  
    }
    if (newPassword !== confirmNewPassword) {
      throw new ErrorClass(
        MESSAGES.ERROR.PASSWORD_MISSMATCH,   
        400,
      )
    }
    const isUserExits = await Signup.findOne({
      email: email,
    })
    if (!isUserExits) {
      throw new ErrorClass(
        MESSAGES.ERROR.INVALID_USER,  
        400,
      )
    }
    const salt = await bcrypt.genSaltSync(10)
    const setNewPassword = bcrypt.hashSync(req.body.newPassword, salt)
    await Signup.updateOne(
      { email: email },
      {
        $set: {
          password: setNewPassword,
        },
      },
    )
    res.send({
      message: MESSAGES.SUCCESS.SET_PASSWORD,  
      status: 200,
    })
  } catch (e) {
    next(e)
  }
}

module.exports.logout = async (req, res, next) => {
  try {
    await Signup.findOneAndUpdate({ email: req.user.email }, { token: null })
    res.json({ message:  MESSAGES.SUCCESS.LOGOUT_SUCCESSFUL})  
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: MESSAGES.ERROR.INTERNAL_SERVER_ERROR  }) 
  }
}
