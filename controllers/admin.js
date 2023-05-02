const bcrypt = require('bcryptjs')
const validator = require('validator')
const Signup = require('../models/signup')
const StartupSupport = require('../models/userStartupSupport')
const { validateRequest } = require('../services/common.utils')
const ErrorClass = require('../services/error')
const { generateRandomOTP, generateToken } = require('../services/common.utils')
const { sendEmail, mailOTPTemp } = require('../services/mail')
const { ROLE, ACTIVITY } = require('../constants/constant')
const EventMeeting = require('../models/eventMeeting')

module.exports.getAllStartupDetails = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      filters: false,
    })

    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    const filters = req.query?.filters?.split(',')

    let data = []
    if (filters) {
      data = await StartupSupport.find({
        location: { $in: filters },
      }).select('-__v -_id')
    } else {
      data = await StartupSupport.find().select('-__v -_id')
    }
    res.status(200).send({
      message: data.length
        ? 'Fetched the data successfully'
        : 'No results found !',
      data,
    })
  } catch (err) {
    next(err)
  }
}

module.exports.updateStartupDetails = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      startupId: true,
      status: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    const { startupId, status } = req.body
    // await StartupSupport.findOne({ startupId })
    const result = await StartupSupport.findOneAndUpdate(
      { startupId },
      { status },
    )
    if (!result) {
      throw new ErrorClass('Please enter the correct statuId', 400)
    }

    res.status(200).send({
      message: 'Startup has been updated successfully !',
    })
  } catch (err) {
    next(err)
  }
}

module.exports.createAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== ROLE.MASTER_ADMIN) {
      throw new ErrorClass('Only master admin has access !', 400)
    }
    const isInvalidRequest = validateRequest(req.body, {
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      branch: true,
      phoneNumber: true,
    })
    const { email, password } = req.body
    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    const isUserExits = await Signup.findOne({
      email,
    })

    if (isUserExits) {
      throw new ErrorClass('Already user exits with this email', 400)
    }
    if (
      !/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/.test(
        password,
      ) ||
      !validator.isEmail(email)
    ) {
      throw new ErrorClass(
        'Password length must be greater then 8 should contain uppar,lower,number and special letter  and email should be in proper format',
        400,
      )
    }
    const userData = {
      ...req.body,
      otpVerified: true,
      isForgotPassword: false,
      role: ROLE.ADMIN,
    }
    const salt = await bcrypt.genSaltSync(10)
    userData.password = bcrypt.hashSync(password, salt)
    const insertData = new Signup(userData)
    await insertData.save()

    res.status(200).send({
      message: 'Admin has created successfully !',
    })
  } catch (err) {
    next(err)
  }
}

module.exports.deleteAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== ROLE.MASTER_ADMIN) {
      throw new ErrorClass('Only master admin has access !', 400)
    }
    const isInvalidRequest = validateRequest(req.query, {
      email: true,
    })
    const { email } = req.query
    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    const isUserExits = await Signup.findOneAndDelete({
      email,
      role: ROLE.ADMIN,
    })

    if (!isUserExits) {
      throw new ErrorClass(
        'No admin present with email which you have provided',
        400,
      )
    }

    res.status(200).send({
      message: 'Admin has deleted successfully !',
    })
  } catch (err) {
    next(err)
  }
}

module.exports.getAllAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== ROLE.MASTER_ADMIN) {
      throw new ErrorClass('Only master admin has access !', 400)
    }

    const allAdminData = await Signup.find({
      role: ROLE.ADMIN,
    })

    res.status(200).send({
      message: allAdminData.length
        ? 'fetched all the admin successfully !'
        : 'No admin found !',
      count: allAdminData.length ? allAdminData.length : 0,
      data: allAdminData,
    })
  } catch (err) {
    next(err)
  }
}
module.exports.scheduleEventOrMeeting = async (req, res, next) => {
  try {
    if (req.user.role !== ROLE.MASTER_ADMIN) {
      throw new ErrorClass('Only master admin has access !', 400)
    }
    const isInvalidRequest = validateRequest(req.body, {
      title: true,
      members: false,
      filters: false,
      type: true,
      link: true,
      dateAndTime: true,
    })
    const { title, members, type, link, dateAndTime } = req.body

    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    if (type === ACTIVITY.MEETING) {
      const data = new EventMeeting({
        title,
        members,
        link,
        dateAndTime,
        type,
        createdByEmail: req.user.email,
        createdByName: req.user.firstName,
      })
      await data.save()
    }
    res.status(200).send({
      message:
        type === ACTIVITY.MEETING
          ? 'Meeting scheduled successfully !'
          : 'Event scheduled successfully !',
    })
  } catch (err) {
    next(err)
  }
}
