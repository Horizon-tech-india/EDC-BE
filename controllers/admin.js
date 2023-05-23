const bcrypt = require('bcryptjs')
const Signup = require('../models/signup')
const StartupSupport = require('../models/userStartupSupport')
const {
  validateRequest,
  validateDateFormat,
} = require('../services/common.utils')
const ErrorClass = require('../services/error')
const {
  ROLE,
  ACTIVITY,
  CLEAR_NOTIFICATION_TYPES,
} = require('../constants/constant')
const EventMeeting = require('../models/eventMeeting')
const {
  passwordRegex,
  dateFormatRegex,
  yearMonthRegex,
} = require('../constants/regex')
const {
  MESSAGES: { ADMIN, ERROR, SUCCESS },
} = require('../constants/constant')
const { STATUS } = require('../constants/constant')
const Notification = require('../models/notification')

module.exports.getAllStartupDetails = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      title: false,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    if (!req.user?.branch?.length) {
      throw new ErrorClass(ADMIN.WITHOUT_BRANCH, 400)
    }
    const filters = req.user?.branch
    const { title } = req.query
    const regex = new RegExp(title, 'i')
    const mongoFilters = {
      $and: [
        {
          location: { $in: filters },
        },
        { title: { $regex: regex } },
      ],
    }
    let data = []
    if (filters) {
      data = await StartupSupport.find(mongoFilters).select('-__v -_id')
    } else {
      data = await StartupSupport.find().select('-__v -_id')
    }

    res.status(200).send({
      message: data.length ? SUCCESS.DATA_FETCHED : ERROR.NO_RESULT_FOUND,
      count: data.length,
      data,
    })
  } catch (err) {
    next(err)
  }
}

module.exports.updateStartupDetails = async (req, res, next) => {
  try {
    if (![ROLE.MASTER_ADMIN, ROLE.ADMIN].includes(req.user.role)) {
      throw new ErrorClass(ADMIN.SELECTED_ACCESS, 403)
    }
    const isInvalidRequest = validateRequest(req.body, {
      startupId: true,
      status: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const { startupId, status } = req.body

    const startup = await StartupSupport.findOne({ startupId })
    if (!req?.user?.branch.includes(startup?.location)) {
      throw new ErrorClass(ADMIN.STARTUP_NOT_UNDER_ADMIN, 400)
    }
    const result = await StartupSupport.findOneAndUpdate(
      { startupId },
      { status },
    )
    if (!result) {
      throw new ErrorClass(ERROR.INCORRECT_STARTUP_ID, 400)
    }

    res.status(200).send({ message: SUCCESS.UPDATED_STARTUP })
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
      throw new ErrorClass(ERROR.USER_EXITS, 400)
    }
    if (!passwordRegex.test(password)) {
      throw new ErrorClass(ERROR.PASSWORD_VALIDATION, 400)
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

    res.status(200).send({ message: ADMIN.CREATED })
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
      throw new ErrorClass(ADMIN.NOT_EXIST, 404)
    }

    res.status(200).send({ message: ADMIN.DELETED })
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
        ? ADMIN.ALL_FETCHED_SUCCESS
        : ADMIN.NO_ADMIN_FOUND,
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
      link: false,
      dateAndTime: true,
      description: false,
    })
    const { title, members, type, link, dateAndTime, filters, description } =
      req.body

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    if (type === ACTIVITY.EVENT && !description?.length) {
      throw new ErrorClass(ERROR.EMPTY_DESCRIPTION, 400)
    }
    if (type === ACTIVITY.MEETING && !link?.length) {
      throw new ErrorClass(ERROR.EMPTY_LINK, 400)
    }
    const data = new EventMeeting({
      title,
      members,
      link,
      dateAndTime,
      type,
      description,
      createdByEmail: req.user?.email,
      createdByName: req.user?.firstName,
    })
    if (type !== ACTIVITY.MEETING && filters && filters.length) {
      const result = await StartupSupport.find({ $or: filters })

      const eventMembers = result.map((startup) => startup?.email)

      data.members = eventMembers
      data.filters = filters
    }
    await data.save()

    await Notification.findOneAndUpdate(
      {},
      {
        $push: {
          eventAndMeetings: [{ eventMeeting: data._id }],
        },
      },
      { new: true, upsert: true },
    )

    res.status(200).send({
      message:
        type === ACTIVITY.MEETING
          ? SUCCESS.MEETING_SCHEDULED
          : SUCCESS.EVENT_SCHEDULED,
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

    if (!req.user?.branch?.length) {
      throw new ErrorClass(ADMIN.WITHOUT_BRANCH, 400)
    }

    const days = req.query?.days || 30

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days)

    const data = await StartupSupport.find({
      $and: [
        { createdAt: { $gte: thirtyDaysAgo } },
        { location: { $in: req.user?.branch } },
      ],
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
        : ERROR.NO_STARTUP_FOUND,
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

    const { email, role } = req.user
    const { date } = req.query
    const query = role === ROLE.MASTER_ADMIN ? {} : { createdByEmail: email }

    // If a date is provided, set the start and end dates
    if (date) {
      // Validate the date format
      if (!validateDateFormat(date, dateFormatRegex)) {
        throw new ErrorClass(ERROR.INVALID_DATE_FORMAT, 400)
      }
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1) // Add one day to the end date
      query.dateAndTime = { $gte: startDate, $lt: endDate }
    }

    // Retrieve the logged-in user's events and meetings based on the query
    const data = await EventMeeting.find(query).select('-_id -__v')

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
        ? SUCCESS.EVENT_MEETING_FETCHED
        : ERROR.NO_EVENT_MEETING_FOUND,
      meetingCount: meetings.length ? meetings.length : 0,
      eventCount: events.length ? events.length : 0,
      meetings,
      events,
    })
  } catch (err) {
    next(err)
  }
}

module.exports.deleteStartup = async (req, res, next) => {
  try {
    if (![ROLE.MASTER_ADMIN, ROLE.ADMIN].includes(req.user.role)) {
      throw new ErrorClass(ADMIN.SELECTED_ACCESS, 403)
    }

    const isInvalidRequest = validateRequest(req.query, {
      startupId: true,
    })
    const { startupId } = req.query
    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }

    if (!req.user?.branch?.length) {
      throw new ErrorClass(ADMIN.WITHOUT_BRANCH, 400)
    }
    const isStartupExits = await StartupSupport.findOneAndDelete({
      startupId,
      location: { $in: req.user?.branch },
    })

    if (!isStartupExits) {
      throw new ErrorClass(ERROR.STARTUP_NOT_FOUND, 400)
    }

    res.status(200).send({ message: SUCCESS.STARTUP_DELETED })
  } catch (err) {
    next(err)
  }
}

module.exports.getEventMeetingDates = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      yearAndMonth: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }

    const { email, role } = req.user
    const { yearAndMonth } = req.query
    const query = role === ROLE.MASTER_ADMIN ? {} : { createdByEmail: email }

    // Validate the yearMonth format 'yyyy-mm'
    if (!validateDateFormat(yearAndMonth, yearMonthRegex)) {
      throw new ErrorClass(ERROR.INVALID_DATE_FORMAT, 400)
    }

    // Construct the start and end dates for the given month and year
    const startDate = new Date(`${yearAndMonth}-01T00:00:00.000Z`)
    const endDate = new Date(`${yearAndMonth}-31T23:59:59.999Z`)
    query.dateAndTime = { $gte: startDate, $lte: endDate }

    // Query the database for documents that match the given query
    const data = await EventMeeting.find(query)
    const eventDates = [],
      meetingDates = []

    if (data.length) {
      data.forEach((meetingOrEvent) => {
        const date = new Date(meetingOrEvent.dateAndTime).getUTCDate()
        if (meetingOrEvent.type === ACTIVITY.MEETING) {
          meetingDates.push(date)
        } else {
          eventDates.push(date)
        }
      })
    }
    res.status(200).send({ meetingDates, eventDates })
  } catch (err) {
    next(err)
  }
}

module.exports.getUsersEmail = async (req, res, next) => {
  try {
    const { branch } = req.user
    if (![ROLE.MASTER_ADMIN, ROLE.ADMIN].includes(req.user?.role)) {
      throw new ErrorClass(ADMIN.SELECTED_ACCESS, 403)
    }
    if (!branch?.length) {
      throw new ErrorClass(ADMIN.WITHOUT_BRANCH, 400)
    }

    const data = await StartupSupport.find({
      location: { $in: branch },
    }).select('email -_id')

    res.status(200).send({
      message: data.length
        ? 'Emails fetched successfully !'
        : 'No Emails found !',
      count: data.length ? data.length : 0,
      data: data.map((obj) => obj?.email),
    })
  } catch (err) {
    next(err)
  }
}

module.exports.updateFinanceStartupDetails = async (req, res, next) => {
  try {
    if (![ROLE.MASTER_ADMIN, ROLE.ADMIN].includes(req.user.role)) {
      throw new ErrorClass(ADMIN.SELECTED_ACCESS, 403)
    }
    const isInvalidRequest = validateRequest(req.body, {
      startupId: true,
      amount: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const { startupId, amount } = req.body
    const startup = await StartupSupport.findOne({ startupId })
    if (!req?.user?.branch.includes(startup?.location)) {
      throw new ErrorClass(ADMIN.STARTUP_NOT_UNDER_ADMIN, 400)
    }

    const result = await StartupSupport.findOneAndUpdate(
      { startupId },
      { $addToSet: { finance: { amount, date: new Date() } } },
    )
    if (!result) {
      throw new ErrorClass(ERROR.INCORRECT_STARTUP_ID, 400)
    }

    res.status(200).send({ message: SUCCESS.FINANCE_UPDATED_STARTUP })
  } catch (err) {
    next(err)
  }
}

module.exports.sendNotification = async (req, res, next) => {
  try {
    const { branch, email, role } = req.user

    if (![ROLE.MASTER_ADMIN, ROLE.ADMIN].includes(role)) {
      throw new ErrorClass(ADMIN.SELECTED_ACCESS, 403)
    }

    if (!branch?.length) {
      throw new ErrorClass(ADMIN.WITHOUT_BRANCH, 400)
    }

    if (!email) {
      throw new ErrorClass(ERROR.NO_EMAIL, 400)
    }

    /**
     * set data from the populated path & schema model with
     * query condition and store selected keys
     */
    const notifications = await Notification.find()
      .populate({
        path: 'userStartupSupports.startup',
        model: StartupSupport,
        match: { location: { $in: branch } },
        select: '-_id',
      })
      .populate({
        path: 'eventAndMeetings.eventMeeting',
        model: EventMeeting,
        match: { members: { $in: [email] } },
        select: '-_id',
      })

    // Separate eventMeeting & userStartup data from populated notifications
    const emData = notifications?.[0].eventAndMeetings.map(
      (em) =>
        em.eventMeeting && {
          id: em._id,
          viewed: em.viewed,
          ...em.eventMeeting._doc,
        },
    )
    const stData = notifications?.[0].userStartupSupports.map(
      (st) =>
        st.startup && { id: st._id, viewed: st.viewed, ...st.startup._doc },
    )

    // merge eventMeeting and startup notification data
    const data = [...emData, ...stData]
    const notificationsData = data
      .filter((dt) => dt !== null && dt?.viewed === false) // filter null values & not viewed notification
      .sort((a, b) => b.createdAt - a.createdAt) // sort notification on createdAt

    res.status(200).send({
      message: SUCCESS.NOTIFICATION,
      notificationCount: notificationsData?.length || 0,
      notifications: notificationsData || [],
    })
  } catch (err) {
    next(err)
  }
}

module.exports.clearNotification = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      id: true,
      type: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }

    const { branch, email, role } = req.user
    const { id, type } = req.query
    if (![ROLE.MASTER_ADMIN, ROLE.ADMIN].includes(role)) {
      throw new ErrorClass(ADMIN.SELECTED_ACCESS, 403)
    }

    if (!branch?.length) {
      throw new ErrorClass(ADMIN.WITHOUT_BRANCH, 400)
    }

    if (!email) {
      throw new ErrorClass(ERROR.NO_EMAIL, 400)
    }

    if (type !== CLEAR_NOTIFICATION_TYPES.ALL) {
      let query = {
        eventAndMeetings: {
          $elemMatch: { eventMeeting: { $in: id } },
        },
      }
      let updateQuery = { $set: { 'eventAndMeetings.$.viewed': true } }
      if (type === CLEAR_NOTIFICATION_TYPES.STARTUP) {
        query = {
          userStartupSupports: {
            $elemMatch: { startup: { $in: id } },
          },
        }
        updateQuery = { $set: { 'userStartupSupports.$.viewed': true } }
      }
      await Notification.findOneAndUpdate(query, updateQuery)
    } else {
      await Notification.updateMany(
        {},
        {
          $set: {
            'eventAndMeetings.$[].viewed': true,
            'userStartupSupports.$[].viewed': true,
          },
        },
      )
    }

    res.status(200).send({
      message: SUCCESS.NOTIFICATION_CLEARED,
    })
  } catch (err) {
    next(err)
  }
}
