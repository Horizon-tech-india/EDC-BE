const bcrypt = require('bcryptjs')
const validator = require('validator')
const Signup = require('../models/signup')
const StartupSupport = require('../models/userStartupSupport')
const { validateRequest } = require('../services/common.utils')
const ErrorClass = require('../services/error')
const { generateRandomOTP, generateToken } = require('../services/common.utils')
const { sendEmail, mailOTPTemp } = require('../services/mail')
const { BRANCHES, STATUS, ROLE } = require('../constants/constant')
const { passwordRegex } = require('../constants/regex')
const {
  MESSAGES: { ERROR },
} = require('../constants/constant')

module.exports.login = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      password: true,
      rememberMe: true,
    })
    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const { email, password, rememberMe } = req.body

    const isUserExits = await Signup.findOne({
      email,
    })
    if (!isUserExits) {
      throw new ErrorClass('User does not exits with this email', 400)
    }
    if (!isUserExits.otpVerified) {
      throw new ErrorClass('Please verify your email by entering otp', 400)
    }
    const passwordMatch = await bcrypt.compare(password, isUserExits.password)
    if (!passwordMatch) {
      throw new ErrorClass('Please enter the correct credentials', 400)
    }
    const now = new Date()

    // Add 60 minutes to the current time
    let tokenExpTime = new Date(now.getTime() + 60 * 60 * 1000)
    if (rememberMe) {
      tokenExpTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
    // Output the future time

    const token = generateToken(isUserExits, rememberMe)

    // Update user document with new token if not already present
    await Signup.findOneAndUpdate(
      { email: req.body.email },
      { $addToSet: { token } },
    )

    res.status(200).send({
      message: 'User login successfully !',
      data: {
        email,
        token,
        firstName: isUserExits.firstName,
        lastName: isUserExits.lastName,
        phoneNumber: isUserExits.phoneNumber,
        role: isUserExits.role,
        tokenExpTime,
        branch: isUserExits?.branch,
      },
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
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const isUserExits = await Signup.findOne({
      email,
    })
    if (isUserExits && isUserExits.otpVerified) {
      throw new ErrorClass('Already user exits with this email', 400)
    }
    if (!passwordRegex.test(password) || !validator.isEmail(email)) {
      throw new ErrorClass(
        'Password length must be greater then 8 should contain uppar,lower,number and special letter  and email should be in proper format',
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
      role: ROLE.STUDENT,
    }
    const salt = await bcrypt.genSaltSync(10)
    userData.password = bcrypt.hashSync(password, salt)

    if (isUserExits && !isUserExits.otpVerified) {
      await Signup.findOneAndUpdate({ email }, userData)
    } else {
      const insertData = new Signup(userData)
      await insertData.save()
    }

    res.send({ message: 'Check your mail to verify OTP', email, status: 200 })
  } catch (err) {
    next(err)
  }
}

// use for verify mail otp and forgot password otp
module.exports.verifyMailOtp = async (req, res, next) => {
  const { email, isForgotPassword } = req.body
  try {
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      otp: true,
      isForgotPassword: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const isUserExits = await Signup.findOne({
      email,
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
          { email },
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
          { email },
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
      throw new ErrorClass('Incorrect OTP please enter again !', 400)
    }
  } catch (e) {
    next(e)
  }
}

// use for forgot password and resend mail otp
module.exports.resendMailOTP = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      isForgotPassword: true,
    })
    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const { isForgotPassword, email } = req.body
    const isUserExits = await Signup.findOne({
      email,
    })
    if (!isUserExits) {
      throw new ErrorClass(
        'User does not exits with this email, Go for signup',
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
    await Signup.updateOne({ email }, updateSignupColl)
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
      confirmNewPassword: true,
    })
    const { email, newPassword, confirmNewPassword } = req.body
    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    if (newPassword !== confirmNewPassword) {
      throw new ErrorClass(
        'New Password and Confirm New Password does not match !',
        400,
      )
    }
    const isUserExits = await Signup.findOne({
      email,
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
      { email },
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

module.exports.logout = async (req, res, next) => {
  try {
    await Signup.findOneAndUpdate(
      { email: req.user.email },
      { $pull: { token: req.token } },
    )
    res.json({ message: 'Logout successful' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
module.exports.userStartupSupport = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      name: true,
      email: true,
      contact: true,
      location: true,
      institute: false,
      otherInstitute: false,
      aadhar: false,
      category: true,
      categoryOther: false,
      otherUniversity: false,
      otherOrganisation: false,
      designation: false,
      enrollmentNum: false,
      teamSize: false,
      teamMembers: true,
      title: true,
      uniqueFeatures: true,
      currentStage: true,
    })

    const { email, title, category, location } = req.body
    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }

    const isAlreadyApplied = await StartupSupport.findOne({
      email,
    })
    if (isAlreadyApplied) {
      throw new ErrorClass('You have already applied for it !', 400)
    }

    const startupId =
      location.substring(0, 2).toUpperCase() +
      category.substring(0, 2).toUpperCase() +
      title.substring(0, 2).toUpperCase() +
      generateRandomOTP()
    const branch = BRANCHES[location]
    const startupData = new StartupSupport({
      ...req.body,
      startupId,
      branch,
      status: STATUS.PENDING,
    })
    await startupData.save()
    res.send({
      message: 'Your application has been submitted successfully !',
      status: 200,
    })
  } catch (error) {
    next(error)
  }
}

module.exports.fileUpload = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.file, {
      fieldname: false,
      originalname: true,
      encoding: false,
      mimetype: false,
      buffer: true,
      size: false,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }

    const fileBuffer = Buffer.from(req.file.buffer, 'base64')

    await StartupSupport.updateOne(
      { email: req.user.email },
      {
        $set: {
          file: fileBuffer,
          fileName: req.file.originalname,
        },
      },
    )

    res.status(200).json({ message: 'File uploaded successfully' })
  } catch (err) {
    console.error(err)
    next(err)
  }
}

module.exports.downloadFile = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      startupId: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const fileData = await StartupSupport.findOne({
      startupId: req.query.startupId,
    }).select('file fileName')

    res.set({
      'Content-Disposition': `attachment; filename=${fileData.fileName}`,
      'Content-Type': 'application/octet-stream',
    })
    res.send(fileData.file)
  } catch (err) {
    console.error(err)
    next(err)
  }
}
