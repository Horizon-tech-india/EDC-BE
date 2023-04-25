/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose')
const validator = require('validator')

const StartupSupportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  location: { type: String, required: true },
  institute: { type: String },
  otherInstitute: { type: String },
  aadhar: { type: String },
  category: { type: String, required: true },
  categoryOther: { type: String },
  otherUniversity: { type: String },
  otherOrganisation: { type: String },
  designation: { type: String },
  enrollmentNum: { type: String },
  teamSize: { type: String },
  teamMembers: { type: String, required: true },
  title: { type: String, required: true },
  uniqueFeatures: { type: String, required: true },
  currentStage: { type: String, required: true },
  startupId: { type: String, require: true },
  status: { type: String, require: true },
  branch: { type: String, require: true },
})

const StartupSupport = mongoose.model(
  'user-startup-supports',
  StartupSupportSchema,
)

module.exports = StartupSupport
