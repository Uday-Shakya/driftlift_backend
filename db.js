const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Fix for Windows/ISP DNS servers failing SRV record resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  // Ignore in environments where setServers is restricted
}

const mongoUri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

if (!process.env.MONGO_URL) {
  console.warn('⚠️ WARNING: MONGO_URL not defined in .env. Falling back to mongodb://127.0.0.1:27017/');
}

mongoose.connect(mongoUri, {
  dbName: dbName
}).then(
  () => {
    console.log('Connected to database');
  }
).catch((err) => {
  console.log('Error connecting to database: ' + err.message);
});
