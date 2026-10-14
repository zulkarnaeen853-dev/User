const mongoose = require('mongoose')

function database() {
  const connectionString = process.env.DB_URL
  if (!connectionString || /[<>]/.test(connectionString)) {
    throw new Error('DB_URL is missing or still contains placeholder values')
  }

  return mongoose.connect(connectionString)
    .then(() => console.log('Database connected'))
}


module.exports = database