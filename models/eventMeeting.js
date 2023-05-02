/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose')

const EventMeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true },
  members: { type: [String], required: true },
  dateAndTime: {
    type: Date,
    required: true,
  },
  type: { type: String, required: true },
  createdByName: { type: String, required: true },
  createdByEmail: { type: String, required: true },
})

const EventMeeting = mongoose.model('event-or-meetings', EventMeetingSchema)

module.exports = EventMeeting
