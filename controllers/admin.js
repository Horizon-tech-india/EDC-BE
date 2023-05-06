const bcrypt = require('bcryptjs')
const Signup = require('../models/signup')
const StartupSupport = require('../models/userStartupSupport')
const {
  validateRequest,
  validateDateFormat,
} = require('../services/common.utils')
const ErrorClass = require('../services/error')
const { ROLE, ACTIVITY } = require('../constants/constant')
const EventMeeting = require('../models/eventMeeting')
const { passwordRegex, dateFormatRegex } = require('.././constants/regex')
const {
  MESSAGES: { ADMIN, ERROR },
} = require('../constants/constant')
const { STATUS } = require('../constants/constant')

module.exports.getAllStartupDetails = async (req, res, next) => {
  try {
    if (req.user.role !== ROLE.MASTER_ADMIN) {
      throw new ErrorClass(ADMIN.MASTER_ACCESS, 403)
    }
    const isInvalidRequest = validateRequest(req.query, {
      filters: false,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
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
    if (req.user.role !== ROLE.MASTER_ADMIN) {
      throw new ErrorClass(ADMIN.MASTER_ACCESS, 403)
    }
    const isInvalidRequest = validateRequest(req.body, {
      startupId: true,
      status: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
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
      throw new ErrorClass(ADMIN.MASTER_ACCESS, 403)
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
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const isUserExits = await Signup.findOne({
      email,
    })

    if (isUserExits) {
      throw new ErrorClass('Already user exits with this email', 400)
    }
    if (!passwordRegex.test(password)) {
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
      throw new ErrorClass(ADMIN.MASTER_ACCESS, 403)
    }
    const isInvalidRequest = validateRequest(req.query, {
      email: true,
    })
    const { email } = req.query
    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
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
      throw new ErrorClass(ADMIN.MASTER_ACCESS, 403)
    }

    const allAdminData = await Signup.find({
      role: ROLE.ADMIN,
    }).select('-_id firstName lastName email phoneNumber role branch')

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
    const isInvalidRequest = validateRequest(req.body, {
      title: true,
      members: false,
      filters: false,
      type: true,
      link: true,
      dateAndTime: true,
    })
    const { title, members, type, link, dateAndTime, filters } = req.body

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const data = new EventMeeting({
      title,
      members,
      link,
      dateAndTime,
      type,
      createdByEmail: req.user.email,
      createdByName: req.user.firstName,
    })
    if (type !== ACTIVITY.MEETING) {
      const result = await StartupSupport.find({ $or: filters })

      const eventMembers = result.map((startup) => startup.email)

      data.members = eventMembers
      data.filters = filters
    }
    await data.save()
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

module.exports.getLastMonthStartups = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      days: false,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const days = req?.query?.days || 30

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days)

    const data = await StartupSupport.find({
      createdAt: { $gte: thirtyDaysAgo },
    })

    const totalCount = data.length
    let approvedCount = 0,
      pendingCount = 0

    data.forEach((startup) => {
      if (startup.status === STATUS.VERIFIED) {
        approvedCount++
      } else if (startup.status === STATUS.PENDING) {
        pendingCount++
      }
    })

    res.status(200).send({
      message: totalCount
        ? `fetched last ${days} days startups successfully !`
        : 'No startup found !',
      data: {
        approvedCount,
        pendingCount,
        totalCount,
      },
    })
  } catch (err) {
    next(err)
  }
}

module.exports.getAllMeetingAndEvent = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      date: false,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }

    const { email } = req.user
    const { date } = req.query
    let data = []

    if (date) {
      // Validate the date format
      if (!validateDateFormat(date, dateFormatRegex)) {
        throw new ErrorClass(ERROR.INVALID_DATE_FORMAT, 400)
      }
      // Set the start and end dates for the selected date
      startDate = new Date(date)
      endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1) // Add one day to the end date

      // Retrieve the logged-in user's events and meetings based on the date
      data = await EventMeeting.find({
        createdByEmail: email,
        dateAndTime: { $gte: startDate, $lt: endDate },
      }).select('-_id -__v -createdByName -createdByEmail')
    } else {
      data = await EventMeeting.find({
        createdByEmail: email,
      }).select('-_id -__v -createdByName -createdByEmail')
    }

    const meetings = []
    const events = []
    if (data.length) {
      data.forEach((meetingOrEvent) => {
        if (meetingOrEvent.type === ACTIVITY.MEETING) {
          meetings.push(meetingOrEvent)
        } else {
          events.push(meetingOrEvent)
        }
      })
    }
    res.status(200).send({
      message: data.length
        ? 'All the events and meeting are fetched successfully '
        : 'No Event or Meeting found !',
      meetingCount: meetings.length ? meetings.length : 0,
      eventCount: events.length ? events.length : 0,
      meetings,
      events,
    })
  } catch (err) {
    next(err)
  }
}
