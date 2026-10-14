const express = require('express')
const router = express.Router()

const api = process.env.API
const IndexRoute = require('./api/index')

router.use(api, IndexRoute)

module.exports = router
