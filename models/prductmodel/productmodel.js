
const mongoose = require('mongoose')



const productSchema = mongoose.Schema({
   productName: {
   type: String,
    required: true
},
category: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'Category'
    // required: true
},
offer: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
}],
price: {
    type: Number,
    required: true
},
quantity: {
    type: Number,
    required: true
},
description: {
    type: String,
    required: true 
},
productImage: {
    type:[String] ,
    required: true
},
discountPrice:{
type:Number,
required:false
},
discount: {
    type:Number,
    required:false
},
isBlocked:{
    type:Boolean,
    default:false
},
created_at: {
    type: Date,
    default: Date.now
}
})

module.exports=mongoose.model('Products',productSchema)