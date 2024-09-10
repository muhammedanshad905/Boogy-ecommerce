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
},{
    timestamps: true 
})

module.exports=mongoose.model("User",userSchema);