const multer = require('multer')

const storage = multer.memoryStorage()

module.exports.upload = multer({
  storage,
  // limits: {
  //   fileSize: 1000000, // 8MB in bytes
  // },
})
