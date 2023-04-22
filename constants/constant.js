exports.MESSAGES = {
  ERROR:{
     INVALID_REQ:"Invalid parameters sent",
     INVALID_USER:"User does not exits with this email,Go for signup",
     VERIFY_EMAIL:"Please verify your email by entering otp",
     INVALID_PASSWORD:"Please enter the correct credentials",
     USER_EXITS:"Already user exits with this email",
     PASSWORD_LENGTH:"Password lenght must be greater then 8 and email should be in proper format",
     INCORRECT_OTP:"Incorrect OTP please enter again !",
     PASSWORD_MISSMATCH:"New Password and Confirm New Password does not match !",
     INTERNAL_SERVER_ERROR:"Internal Server Error"
  },

  SUCCESS:{
     MESSAGE:"User login successfully",
     OTP_MESSAGE:"Check your mail to verify OTP",
     SET_NEW_PASSWORD:"Your OTP is verified, Please set new password  !",
     EMAIL_VERIFIED:"Your email has been verified, Please login  !",
     OTP_RESEND:"OTP Resended on your mail !",
     SET_PASSWORD:"Your password has been changed, please login !",
     LOGOUT_SUCCESSFUL:"Logout successful"
  }
  //    pass key value pair here as an obj
}
//  you can also make another obj if you req other then msg okay just an exmaple
