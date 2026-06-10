import mongoose  from "mongoose";
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    assistantName:{
        type:String
    },
    assistantImage:{
        type:String
    },
    assistantVoice:{
        type:String,
        enum:["auto","female","male"],
        default:"auto"
    },
    assistantVoiceName:{
        type:String,
        default:""
    },
    googleCalendar:{
        accessToken:{
            type:String
        },
        refreshToken:{
            type:String
        },
        expiryDate:{
            type:Number
        },
        scope:{
            type:String
        },
        tokenType:{
            type:String
        },
        connectedAt:{
            type:Date
        },
        updatedAt:{
            type:Date
        }
    },
    history:[
        {type:String}
    ]

},{timestamps: true})

const User=mongoose.model("User",userSchema)
export default User
