const mongoose = require("mongoose");
const validator = require("validator");

//schema creation 
const SignupSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        minLength: [3, "minimun 3 letters required"],
        maxLength: [20, "more than 20 letters not allowed"],
        lowercase: true,
    },
    last_name: {
        type: String,
        required: true,
        minLength: [3, "minimun 3 letters required"],
        maxLength: [20, "more than 20 letters not allowed"],
        lowercase: true,
    },
    profession: {
        type: String,
        enum: ['student', 'coordinator'], // Allowed values for dropdown
        required: true
      },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("email is invalid")
            }
        },
        lowercase: true
    },
    phone_number: {
        type: Number,
        required: true,
        min: 1000000000,
        max: 9999999999
    },
    password: {
        type: String,
        required: true
    },
    startup_name:{
        type:String,
        required:true
    },
    applying_to:{
        type:String,
        required:true
    },
    website:{
        type:String,
        required:true
    },
    mail_otp:{
        type:Number,
        required:true
    },
    role:{
        type:String,
        required:true
    },
    date: {
        type: Date,
        default: Date.now
    } 
});



//collection created 
const Signup = new mongoose.model("Signup", SignupSchema);

module.exports = Signup;