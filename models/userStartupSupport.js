/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose')
const validator = require('validator')

const StartupSupportSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: false },
  contact: { type: String, required: false },
  location: { type: String, required: false },
  institute: { type: String, required: false },
  otherInstitute: { type: String, required: false },
  aadhar: {
    type: [Number, String],
    required: false,
  },
  category: { type: String, required: false },
  categoryOther: { type: String, required: false },
  otherUniversity: { type: String, required: false },
  otherOrganisation: { type: String, required: false },
  designation: { type: String, required: false },
  enrollmentNum: { type: [Number, String], required: false },
  teamSize: { type: [Number, String], required: false },
  teamMembers: { type: String, required: false },
  title: { type: String, required: false },
  uniqueFeatures: { type: String, required: false },
  currentStage: { type: String, required: false },
  startupId: { type: String, require: false },
})

const StartupSupport = mongoose.model(
  'user-startup-supports',
  StartupSupportSchema,
)

module.exports = StartupSupport
