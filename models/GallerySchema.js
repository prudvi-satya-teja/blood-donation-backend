const mongoose = require('mongoose');

const GallerySchema = mongoose.Schema({
    filename: {
        type: String
    },
    imgPath: {
        type: String,
    }

  })


module.exports=mongoose.model('GallerySchema',GallerySchema);
