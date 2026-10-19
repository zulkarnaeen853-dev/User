const { publicUser } = require('../utils/tokenHelper')

const me = async (req, res) => {
  return res.send({
    success: true,
    message: 'Authenticated user.',
    data: publicUser(req.user),
  })
}

module.exports = me
