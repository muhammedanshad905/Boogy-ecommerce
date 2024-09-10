const mongoose = require('mongoose')

const categoryModel = mongoose.Schema({
    name:{
        type:String,
        requred:true
    },
    description:{
        type:String,
        requred:true
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
    },
    image :{
        type : String,
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
})

module.exports=mongoose.model('Category',categoryModel)