const express = require('express'),
  adminRouter = express.Router(),
  adminController = require('../controllers/admin'),
  { auth } = require('../middleware/auth')

adminRouter.get(
  '/all-startup-details',
  auth,
  adminController.getAllStartupDetails,
)
adminRouter.patch(
  '/update-startup-details',
  auth,
  adminController.updateStartupDetails,
)

module.exports = adminRouter
