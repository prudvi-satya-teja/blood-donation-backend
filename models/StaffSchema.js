const mongoose = require('mongoose');
const StaffSchema = mongoose.Schema({
    Name: {
      type: String,
      required: true
    },
    EmployeeId: {
      type: String,
      required: true
    },
    MobileNumber: {
      type: Number,
      required: true
    },
    Email: {
      type: String,
      required: true
    },
    College: {
      type: String,
      required: true,
    },
    collegeCode: {
      type: String,
      required: true,
    },
    Department: {
      type: String,
      required: true,
    },
    Venue: {
      type: String,
      required: true,
    },
    BloodGroup: {
      type: String,
      required: true,
    },
    Gender: {
      type: String,
      required: true,
    },
    NumberOfTimesDonatedInCampus : {
      type: Number,
      required: true 
    },
    NumberOfTimesDonatedOutside : {
      type: Number,
      required: true
    },
    EventDate: {
      type: Date,
      required: true
    }
  })

module.exports = mongoose.model('Staff', StaffSchema);