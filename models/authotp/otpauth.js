const mongoose=require("mongoose")

const otpSchema = mongoose.Schema({
    email:{
        type:String
    },
    otp : Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        index: { expires: '3m' }
    } 
  
})

module.exports = mongoose.model("OTP",otpSchema)