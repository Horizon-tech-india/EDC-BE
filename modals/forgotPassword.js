const mongoose =require("mongoose");

const otpSchema = new mongoose.Schema({
email:String,
code:String,
expireIn:Number
});


let opt = new mongoose.model("otp",otpSchema);

module.exports = opt;