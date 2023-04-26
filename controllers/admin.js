const bcrypt = require('bcryptjs')
const validator = require('validator')
const Signup = require('../models/signup')
const StartupSupport = require('../models/userStartupSupport')
const { validateRequest } = require('../services/common.utils')
const ErrorClass = require('../services/error')
const { generateRandomOTP, generateToken } = require('../services/common.utils')
const { sendEmail, mailOTPTemp } = require('../services/mail')
const { BRANCHES, STATUS } = require('../constants/constant')

module.exports.getAllStartupDetails = async (req, res, next) => {
  try {
    const isInvalidRequest = validateRequest(req.query, {
      filters: false,
    })

    if (isInvalidRequest) {
      throw new ErrorClass('Invalid parameters sent', 400)
    }
    const filters = req.query?.filters?.split(',')
    const data = await StartupSupport.find({
      location: { $in: filters },
    }).select('-__v -_id')
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
