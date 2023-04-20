const nodemailer = require("nodemailer");

module.exports.validateRequest = (request, params) => {
  let isInvalidRequest = Object.keys(request).some(
    (key) => !Object.keys(params).includes(key),
  )
  if (isInvalidRequest) return isInvalidRequest

  const invalidArray = [null, undefined, 'null', 'undefined', '']
  for (const key in params) {
    if (params[key] && invalidArray.includes(request[key])) {
      isInvalidRequest = true
      break
    }
  }
  return isInvalidRequest
}
// function lke gen token,decypt password will be come in this utils file
//
module.exports.sendVerifyMail = async(req,res) =>{
    
  const transporter = await nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
          user: 'kian.gibson@ethereal.email',
          pass: '3zR51qtg5R3frDgNfE'
      }
  });
  let info = await transporter.sendMail({
      from: 'kian.gibson@ethereal.email', // sender address
      to: "birjusinghthakur@gmail.com, birj1@gmail.com", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>, <h1>my name is akash </h1>", // html body
    });
    console.log("Message sent: %s", info.messageId);
  res.json(info)
}