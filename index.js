require('dotenv').config();
const express = require('express');
const cors = require('cors');

const router = require('./Route/index');
const database = require('./config/database')

const app = express();
const port = process.env.PORT || 3000

app.use(cors()); 
app.use(express.json());
app.use(router);

async function startServer() {
  try {
    await database()
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`)
    })
  } catch (error) {
    console.error('Unable to start server:', error.message)
    process.exit(1)
  }
}

startServer()
