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

database()

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})
