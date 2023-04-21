// eslint-disable-next-line import/no-extraneous-dependencies
const { ExtractJwt, Strategy: JwtStrategy } = require('passport-jwt')
const User = require('../user/user.model')
const { tokenTypes } = require('../token')

const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: process.env.JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  },
  async (payload, done) => {
    try {
      if (payload.type !== tokenTypes.ACCESS) {
        throw new Error('Invalid token type')
      }
      const user = await User.findById(payload.sub)
      if (!user) {
        return done(null, false)
      }
      done(null, user)
    } catch (error) {
      done(error, false)
    }
  },
)

module.exports = jwtStrategy
