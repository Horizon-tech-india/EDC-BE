const opt = require("../modals/forgotPassword");

// Login controller function
module.exports.login = async (req, res, next) => {
  try {
    // TODO: Implement user authentication logic here

    // Send a success response if authentication is successful
    res.json({ message: 'Login successful' })
  } catch (error) {
    // Log the error to the console or your preferred logging mechanism
    console.error(error)

    // Send a 500 Internal Server Error response to the client
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

// Signup controller function
module.exports.signup = async (req, res, next) => {
  try {
    // TODO: Implement user signup logic here

    // Send a success response if signup is successful
    res.json({ message: 'Signup successful' })
  } catch (error) {
    // Log the error to the console or your preferred logging mechanism
    console.error(error)

    // Send a 500 Internal Server Error response to the client
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

//forgot password 
module.exports.sendEmail = async(req,res) =>{
  let data = await Signup.findOne({email:req.body.email});
  const responseType ={ };
 
  if(data){
      let otpcode = Math.floor((Math.random()*10000+1));
      let otpdata = new opt({
          email:req.body.email,
          code:otpcode,
          expireIn:new Date().getTime()*300*1000
      })
      let otpResponse = await otpdata.save();
      console.log(otpResponse);
      responseType.statusText ="success";
      responseType.message="please check your emailid"
  }else{
      responseType.statusText ="error";
      responseType.message="emailid is not valid"
  }
  res.status(200).json(responseType)
}

module.exports.changePassword = async(req,res) =>{
  let data = await opt.find({email:req.body.email, code:req.body.otpcode});
  const response = { };
  if(data){
      let currentTime = new Date().getTime();
      let diff = data.expireIn - currentTime;
      if (diff < 0){
          response.message ="tokrn expire"
          response.statusText="error"
      }else{
          let user = await Signup.findOne({email:req.body.email})
          user.password = req.body.password,
          user.save();
          response.message="password change successfully"
          response.statusText="success"
      }
  }else{
      response.message="invalid otp"
      response.statusText="error"
  }
  res.status(200).json(response)
}

// Logout controller function
module.exports.logout = async (req, res, next) => {
  try {
    // TODO: Implement user logout logic here

    // Send a success response if logout is successful
    res.json({ message: 'Logout successful' })
  } catch (error) {
    // Log the error to the console or your preferred logging mechanism
    console.error(error)

    // Send a 500 Internal Server Error response to the client
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
