const Signup = require('../models/signup')
const validator = require('validator')
const { validateRequest } = require('../services/common.utils')
const ErrorClass = require('../services/error')
const bcrypt = require('bcryptjs')
const { generateRandomOTP, generateToken } = require('../services/common.utils')
const { sendEmail, mailOTPTemp } = require('../services/mail')
// Login controller function
module.exports.login = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      password: true,
      rememberMe: true,
    })
    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    const { email, password, rememberMe } = req.body

    const isUserExits = await Signup.findOne({
      email: req.body.email,
    })
    if (!isUserExits) {
      throw new ErrorClass('User does not exits with this email', 400)
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      isUserExits.password,
    )
    if (!passwordMatch) {
      throw new ErrorClass('Please enter the correct credentials', 400)
    }
    const token = generateToken(isUserExits, rememberMe)
    res.status(200).send({
      message: 'User login successfully !',
      data: { email, token },
    })
  } catch (err) {
    next(err)
  }
}

// Signup controller function
module.exports.signup = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      firstName: true,
      lastName: true,
      password: true,
      email: true,
      phoneNumber: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    const isUserExits = await Signup.findOne({
      email: req.body.email,
    })
    if (isUserExits) {
      throw new ErrorClass('Already user exits with this email', 400)
    }
    if (
      !validator.isLength(req.body.password, { min: 8 }) ||
      !validator.isEmail(req.body.email)
    ) {
      throw new ErrorClass(
        'Password lenght must be greater then 8 and email should be in proper format',
        400,
      )
    }

    const newData = new Signup({
      ...req.body,
      mailOTP: null,
      otpVerified: false,
      isForgotPassword: false,
    })
    const salt = await bcrypt.genSaltSync(10)
    newData.password = bcrypt.hashSync(req.body.password, salt)

    const mailOtp = generateRandomOTP()
    const htmlTemp = mailOTPTemp(mailOtp)
    const mailOptions = {
      to: req.body.email,
      subject: 'Horizon Tech signup verification code',
      html: htmlTemp,
    }
    await sendEmail(mailOptions)
    newData.mailOTP = mailOtp
    await newData.save()

    res.send({ message: 'Check your mail to verify OTP', status: 200 })
  } catch (err) {
    next(err)
  }
}

//use for verify mail otp and forgot password otp
module.exports.verifyMailOtp = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      otp: true,
      isForgotPassword: true,
    })
    const { isForgotPassword } = req.body
    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    const isUserExits = await Signup.findOne({
      email: req.body.email,
    })
    if (!isUserExits) {
      throw new ErrorClass(
        'User does not exits with this email, Go for signup',
        400,
      )
    }
    if (isUserExits.mailOTP === req.body.otp) {
      if (isForgotPassword) {
        await Signup.updateOne(
          { email: req.body.email },
          {
            $set: {
              isForgotPassword: true,
            },
          },
        )
        res.send({
          message: 'Your OTP is verified, Please set new password  !',
          status: 200,
        })
      } else {
        await Signup.updateOne(
          { email: req.body.email },
          {
            $set: {
              otpVerified: true,
            },
          },
        )
        res.send({
          message: 'Your email has been verified, Please login  !',
          status: 200,
        })
      }
    } else {
      res.send({ message: 'Incorrect OTP please enter again !', status: 400 })
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
      throw new ErrorClass('Invalid parameters sent', 400)
    }

    const isUserExits = await Signup.findOne({
      email: req.body.email,
    })
    if (!isUserExits) {
      throw new ErrorClass(
        'User does not exits with this email, Go for signup',
        400,
      )
    }
    const { isForgotPassword } = req.body

    const mailOtp = generateRandomOTP()
    const htmlTemp = mailOTPTemp(mailOtp)
    const mailOptions = {
      to: req.body.email,
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
    await Signup.updateOne({ email: req.body.email }, updateSignupColl)
    res.send({
      message: 'OTP Resended on your mail !',
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
      confirmNewPAssword: true,
    })
    const { email, newPassword, confirmNewPAssword } = req.body
    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    if (newPassword !== confirmNewPAssword) {
      throw new ErrorClass(
        'New Password and Confirm New Password does not match !',
        400,
      )
    }
    const isUserExits = await Signup.findOne({
      email: req.body.email,
    })
    if (!isUserExits) {
      throw new ErrorClass(
        'User does not exits with this email, Go for signup',
        400,
      )
    }
    const salt = await bcrypt.genSaltSync(10)
    const setNewPassword = bcrypt.hashSync(req.body.newPassword, salt)
    await Signup.updateOne(
      { email: req.body.email },
      {
        $set: {
          password: setNewPassword,
        },
      },
    )
    res.send({
      message: 'Your password has been changed, please login !',
      status: 200,
    })
  } catch (e) {
    next(e)
  }
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
