const mongoose = require('mongoose');

const ContactSchema = mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    messaage: {
        type: String,
    }

  })
  module.exports=mongoose.model('ContactSchema',ContactSchema);
