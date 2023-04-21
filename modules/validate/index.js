const validate = require('./validate.middleware')
const { objectId, password } = require('./custom.validation')

module.exports = { objectId, password, validate }
