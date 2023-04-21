const { Router } = require('express')

const { validate } = require('../modules/validate')
const { auth } = require('../modules/auth')
const { userValidation, userController } = require('../modules/user')

const router = Router()

router
  .route('/')
  .post(
    auth('manageUsers'),
    validate(userValidation.createUser),
    userController.createUser,
  )
  .get(
    auth('getUsers'),
    validate(userValidation.getUsers),
    userController.getUsers,
  )

router
  .route('/:userId')
  .get(
    auth('getUsers'),
    validate(userValidation.getUser),
    userController.getUser,
  )
  .patch(
    auth('manageUsers'),
    validate(userValidation.updateUser),
    userController.updateUser,
  )
  .delete(
    auth('manageUsers'),
    validate(userValidation.deleteUser),
    userController.deleteUser,
  )

module.exports = router
