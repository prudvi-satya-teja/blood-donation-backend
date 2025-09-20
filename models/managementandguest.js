const mongoose=require('mongoose')
const ManagementAndGuestSchema = mongoose.Schema({
    Name: {
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
    Venue:{
        type:String,
        required:true
    },
    TypeOfDonor:{
      type:String, 
      required:true
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
  module.exports=mongoose.model('managementandguest',ManagementAndGuestSchema)
