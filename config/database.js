const mongoose = require('mongoose')

function database() {
  mongoose.connect(process.env.DB_URL)
    .then(() => console.log('Database connected'))
}


module.exports = database