const Signup = require("../models/signup");

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
    // const { first_name, lname, email, mobileno, password, userType, companyName } = req.body;
    const data = req.body;
    let user = new Signup(data);
    await user.save();
    console.log(user)
    res.status(201).json({ message: "user send data successfully" });
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
