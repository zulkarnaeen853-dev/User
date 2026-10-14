const express = require('express')
const router = express.Router()

const mainRoute = require('./mainRoute')

router.use('/auth', mainRoute)
module.exports = router