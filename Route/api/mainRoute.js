const express = require('express')
const multer = require('multer')
const router = express.Router()
const crypto = require('crypto');

const register = require('../../controller/register')
const login = require('../../controller/login')


const picStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads');
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err);
      cb(null, file.fieldname + '-' + raw.toString('hex'));
    });
  },
});

const upload = multer({ storage: picStorage });

router.post('/register', upload.single('pic'), register)
// router.use('/login', login)

module.exports = router