const mongoose = require('mongoose')
const dns = require('dns')
require('dotenv').config();

// Fix for Windows/ISP DNS servers failing SRV record resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);


mongoose.connect(process.env.MONGO_URL,{
    dbName: process.env.DB_NAME
}).then(
    () => {
        console.log('Connected to database');
    }
).catch((err) => {
    console.log('Error connecting to database ' + err);
})