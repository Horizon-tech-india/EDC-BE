// Define a custom Error class that extends the built-in Error class
class ErrorClass extends Error {
  // Define a constructor method that takes two arguments: a message and a code
  constructor(message, code) {
    // Call the parent class's constructor method and pass it the message argument
    super(message)
    // Set the code property on the new ErrorClass instance to the value of the code argument
    this.code = code
  }
}

// Export the ErrorClass so it can be used in other modules
module.exports = ErrorClass
