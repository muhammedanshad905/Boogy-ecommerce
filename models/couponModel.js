const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponCode: {
     type: String,
      required: true,
    //    unique: true
     },
     couponDescription: {
         type: String,
          required: true
         },
         couponDiscount:{
         type: Number,
         required: true
        },// "percentage" or "fixed"
    // discountValue: { 
    // type: Number,
    //  required: true
    //  },
    couponMinPurchase: {
         type: Number,
          required: true 
        },
        couponExpiry: {
         type: Date,
          required: true 
        },
    createDate: {
         type: Date,
         default:Date.now()
        }, //creation
        couponRedeemAmount: {
         type: Number,
         required: true
         },
    isValid:{ 
        type: Boolean,
        required:false,
        default:true
    }
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports=Coupon;