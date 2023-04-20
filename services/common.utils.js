// Export a function called "validateRequest" that takes two arguments: a "request" object and a "params" object
module.exports.validateRequest = (request, params) => {
  try {
    // Check if the "request" object has any keys that are not present in the "params" object
    let isInvalidRequest = Object.keys(request).some(
      (key) => !Object.keys(params).includes(key),
    )
    // If there are any invalid keys, throw an Error to indicate an invalid request
    if (isInvalidRequest) throw new Error('Invalid request')

    // Create an array of values that are considered "invalid" for request parameters
    const invalidArray = [null, undefined, 'null', 'undefined', '']

    // Loop through each key in the "params" object
    for (const key in params) {
      // If the value of the "params" key is not null/undefined and the corresponding value in the "request" object is considered invalid, set "isInvalidRequest" to true and break out of the loop
      if (params[key] && invalidArray.includes(request[key])) {
        isInvalidRequest = true
        break
      }
    }

    // If the request is invalid, throw an Error
    if (isInvalidRequest) throw new Error('Invalid request')

    // Return false to indicate a valid request
    return false
  } catch (error) {
    // Log the error to the console
    console.error(error)

    // Return true to indicate an invalid request
    return true
  }
}

// Other utility functions such as generating tokens and decrypting passwords can be added to this same file for organization and easy access. 
