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

adminRouter.post('/create-admin', auth, adminController.createAdmin)
adminRouter.get('/delete-admin', auth, adminController.deleteAdmin)
adminRouter.get('/get-all-admin', auth, adminController.getAllAdmin)
adminRouter.post(
  '/schedule-event-meeting',
  auth,
  adminController.scheduleEventOrMeeting,
)
adminRouter.get(
  '/get-lastmonth-startups',
  auth,
  adminController.getLastMonthStartups,
)

module.exports = adminRouter
