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
  FINANCE_TYPE,
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
const SecStageStartupSupport = require('../models/secStageStartupSupport')
const FinanceDetails = require('../models/financeDetails')

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
    }

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
    console.log('198')
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
    res.status(200).send({ message: 'good res' })
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
    console.log('500')
  } catch (err) {
    next(err)
  }
}

module.exports.clearNotification = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      id: false,
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
          $elemMatch: { _id: { $in: id } },
        },
      }
      let updateQuery = { $set: { 'eventAndMeetings.$.viewed': true } }
      if (type === CLEAR_NOTIFICATION_TYPES.STARTUP) {
        query = {
          userStartupSupports: {
            $elemMatch: { _id: { $in: id } },
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

module.exports.addSecStageStarupSupport = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      startupId: true,
      incubationId: true,
      title: true,
      problemDescription: true,
      solutionDescription: true,
      uniquenessDescription: true,
      startupSector: true,
      innovationType: true,
      currentStage: true,
      startupProgram: true,
      startupStatus: true,
      startupGrade: true,
      programStartDate: true,
      yuktiInnovationId: true,
      yuktiPortalUserId: true,
      yuktiPortalPassword: true,
      teamLeaderName: true,
      teamLeaderEmail: true,
      teamLeaderContact: true,
      teamLeaderCategory: true,
      teamLeaderId: true,
      organisationName: true,
      teamMembers: true,
      teamMemberCategory: true,
      spoc: true,
      externalMentor: true,
      incubationDate: true,
      graduationDate: true,
      receivedFunding: true,
      fundingAgency: true,
      fundSanctionDate: true,
      fundingAmount: true,
      registeredCompany: true,
      companyType: true,
      cinUdhyamRegistrationNo: true,
      companyRegistrationDate: true,
      dpiitRecognised: true,
      dpiitCertificateNo: true,
      incubatedAt: true,
      ipFilledGranted: true,
      ipTypes: true,
      ipDetails: true,
      revenueGeneration: true,
      numOfEmployees: true,
      folderLink: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const { role, firstName, email, branch } = req.user
    if (![ROLE.MASTER_ADMIN, ROLE.ADMIN].includes(role)) {
      throw new ErrorClass(ADMIN.SELECTED_ACCESS, 403)
    }
    const isExitsInStartupData = await StartupSupport.findOne({
      startupId: req.body.startupId,
      location: { $in: branch },
    })
    if (!isExitsInStartupData) {
      throw new ErrorClass(ADMIN.SEC_STAGE_ID_NOT_EXITS, 400)
    }
    const isAlreadyExits = await SecStageStartupSupport.findOne({
      startupId: req.body.startupId,
    })
    if (isAlreadyExits) {
      throw new ErrorClass(ADMIN.EXITS_SEC_STAGE_DET, 400)
    }

    const secStageData = new SecStageStartupSupport({
      ...req.body,
      createdByName: firstName,
      createdByEmail: email,
    })
    await secStageData.save()

    res.send({ message: ADMIN.ADDED_SEC_STAGE_DET, status: 200 })
  } catch (error) {
    next(error)
  }
}

module.exports.addFinanceDetail = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.body, {
      startupId: true,
      finance: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }
    const { role, firstName, email, branch } = req.user
    if (![ROLE.MASTER_ADMIN, ROLE.ADMIN].includes(role)) {
      throw new ErrorClass(ADMIN.SELECTED_ACCESS, 403)
    }
    const isExitsInStartupData = await StartupSupport.findOne({
      startupId: req.body.startupId,
      location: { $in: branch },
    })

    if (!isExitsInStartupData) {
      throw new ErrorClass(ADMIN.SARTUP_ID_NOT_EXITS, 400)
    }
    const financeDetails = await FinanceDetails.findOne({
      startupId: req.body.startupId,
    })

    let updatedNetBalance = financeDetails?.netBalance

    if (financeDetails?.netBalance) {
      if (req.body?.finance?.type === FINANCE_TYPE.CREDIT) {
        updatedNetBalance += req.body.finance.amount
      }
      if (req.body?.finance?.type === FINANCE_TYPE.DEBIT) {
        updatedNetBalance -= req.body.finance.amount
        if (updatedNetBalance < 0) {
          throw new ErrorClass(ADMIN.NEG_NET_BALANCE, 400)
        }
      }
    } else if (
      !financeDetails?.netBalance &&
      req.body?.finance?.type === FINANCE_TYPE.DEBIT
    ) {
      throw new ErrorClass(ADMIN.NEG_NET_BALANCE, 400)
    } else {
      updatedNetBalance = req.body?.finance?.amount
    }

    await FinanceDetails.findOneAndUpdate(
      { startupId: req.body.startupId },
      {
        netBalance: updatedNetBalance,
        $push: {
          finance: [{ ...req.body.finance }],
        },
      },
      { upsert: true, new: true },
    )

    res.send({ message: ADMIN.FINANCE_ADDED, status: 200 })
  } catch (error) {
    next(error)
  }
}

module.exports.getFinanceDetail = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      startupId: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }

    const financeDetails = await FinanceDetails.findOne({
      startupId: req.query.startupId,
    }).select('-__v -_id')

    res.send({
      message: ADMIN.FINANCED_DATA_FETCHED,
      financeDetails,
      status: 200,
    })
  } catch (err) {
    console.error(err)
    next(err)
  }
}
module.exports.getSecStageStarupSupport = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      startupId: true,
    })

    if (isInvalidRequest) {
      throw new ErrorClass(ERROR.INVALID_REQ, 400)
    }

    const secStageData = await SecStageStartupSupport.findOne({
      startupId: req.query.startupId,
    }).select('-__v -_id')

    res.send({
      message: ADMIN.FINANCED_FETCHED,
      secStageData,
      status: 200,
    })
  } catch (err) {
    console.error(err)
    next(err)
  }
}
