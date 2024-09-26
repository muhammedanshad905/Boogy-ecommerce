const mongoose=require("mongoose")

const userSchema= new mongoose.Schema({

    googleId : {
        type : String
    },
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
 
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
    },
    image:{
        type:String,

    },
    
    password:{
        type:String,

    },
    is_verified:{
        type:Number,
        default: 0

    },
    is_block :{
        type : Boolean,
        default : false
    }, 
    resetPasswordToken:{
        type:String,
    },
    resetPasswordExpires:{
        type:Date
    },
    referralCode: {  // Referral Code field for each user
        type: String,
        default: function() {
            return `REF${this._id}${Math.floor(Math.random() * 10000)}`;  // Generating a unique referral code
        },
    },
    referredBy: {  // To track which user referred this one
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
    }
}
,{
    timestamps: true 
})

module.exports=mongoose.model("User",userSchema);