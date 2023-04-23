/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose')
const validator = require('validator')

const StartupSupportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  location: { type: String, required: true },
  institute: { type: String, required: true },
  otherInstitute: { type: String, required: true },
  aadhar: {
    type: Number,
    required: true,
    validate: {
      validator: function (v) {
        return v.toString().length === 12
      },
      message: (props) => `${props.value} is not a valid Aadhar number !`,
    },
  },
  category: { type: String, required: true },
  categoryOther: { type: String, required: true },
  otherUniversity: { type: String, required: true },
  otherOrganisation: { type: String, required: true },
  designation: { type: String, required: true },
  enrollmentNum: { type: Number, required: true },
  teamSize: { type: Number, required: true },
  teamMembers: { type: String, required: true },
  title: { type: String, required: true },
  uniqueFeatures: { type: String, required: true },
  currentStage: { type: String, required: true },
})

const StartupSupport = mongoose.model(
  'user-startup-supports',
  StartupSupportSchema,
)

module.exports = StartupSupport
