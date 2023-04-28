const multer = require('multer')

// Set up multer to handle file uploads
// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, 'uploads/')
//   },
//   filename(req, file, cb) {
//     cb(null, file.originalname)
//   },
// })
const storage = multer.memoryStorage()

module.exports.upload = multer({ storage })
