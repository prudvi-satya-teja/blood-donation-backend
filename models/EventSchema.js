const mongoose = require('mongoose');

const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bloodBanks: [
    {
      nameOfTheBloodBank: { type: String, required: true },
      Venue: { type: String, required: true },
      RoomNo: { type: Number, required: true },
    },
  ],
});

const EventSchema = mongoose.Schema({
  EventName: {
    type: String,
    required: true,
  },
  Date: {
    type: Date,
    required: true,
  },
  Colleges: {
    type: [CollegeSchema],
    required: true,
  },
  filename: {
    type: String,
  },
  imgPath: {
    type: String,
  },
});

module.exports = mongoose.model('Eventschema', EventSchema);
