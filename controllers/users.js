const Signup = require('../models/signup')
const validator = require('validator')
const { validateRequest } = require('../services/common.utils')
const ErrorClass = require('../services/error')
const bcrypt = require('bcryptjs')
const { generateRandomOTP } = require('../services/common.utils')
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
    const { email, password } = req.body

    const isUserExits = await Signup.findOne({
      email: req.body.email,
    })
    if (!isUserExits) {
      throw new ErrorClass('User does not exits with this email', 400)
    }
    const user = rows[0]

    const isPasswordMatch = await bcrypt.compare(
      decryptPassword(password),
      user.password,
    )
    if (!isPasswordMatch) {
      throw new ErrorClass(MESSAGES.ERROR.INCORRECT_CRED, 400)
    }
    const token = generateToken(user, 'JWT_KEY_1')
    res.status(200).send({
      message: MESSAGES.SUCCESS.USER_LOGIN,
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
      profession: true,
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

module.exports.verifyMailOtp = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      otp: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    const isUserExits = await Signup.findOne({
      email: req.body.email,
    })
    if (isUserExits) {
      throw new ErrorClass(
        'User does not exits with this email, Go for signup',
        400,
      )
    }
    if (isUserExits.mailOTP === otp) {
      await UserModel.updateOne(
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
    } else {
      res.send({ message: 'Incorrect OTP please enter again !', status: 400 })
    }
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
