const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);

// Trust Render / cloud reverse proxy for HTTPS detection
app.set('trust proxy', 1);

require('dotenv').config({ path: path.join(__dirname, '.env') });

const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = process.env.PORT || 8000;
const cookieParser = require('cookie-parser');
const { attachSquadSocketServer, getRoomsList, createRoom } = require('./squadSocketServer');

const authRoutes = require('./Routes/Auth');
const calorieIntakeRoutes = require('./Routes/CalorieIntake');
const adminRoutes = require('./Routes/Admin');
const imageUploadRoutes = require('./Routes/imageUploadRoutes');
const sleepTrackRoutes = require('./Routes/SleepTrack');
const stepTrackRoutes = require('./Routes/StepTrack');
const weightTrackRoutes = require('./Routes/WeightTrack');
const waterTrackRoutes = require('./Routes/WaterTrack');
const workoutTrackRoutes = require('./Routes/WorkoutTrack');
const workoutRoutes = require('./Routes/WorkoutPlans');
const reportRoutes = require('./Routes/Report'); 
const errorHandler = require('./Middlewares/errorMiddleware');
require('./db');

app.use(bodyParser.json());

// Permissive dynamic CORS with credentials support for localhost, Vercel, and Render
app.use(
    cors({
        origin: function (origin, callback) {
            callback(null, true);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'x-refresh-token'],
        exposedHeaders: ['Set-Cookie', 'x-new-authtoken']
    })
);

app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/calorieintake', calorieIntakeRoutes);
app.use('/admin', adminRoutes);
app.use('/image-upload', imageUploadRoutes);
app.use('/sleeptrack', sleepTrackRoutes);
app.use('/steptrack', stepTrackRoutes);
app.use('/weighttrack', weightTrackRoutes);
app.use('/watertrack', waterTrackRoutes);
app.use('/workouttrack', workoutTrackRoutes);
app.use('/workoutplans', workoutRoutes);
app.use('/report', reportRoutes); 

// Squad Rooms REST API (discovery & fallback)
app.get('/squad/rooms', (req, res) => {
    try {
        const rooms = getRoomsList();
        res.json({ ok: true, rooms });
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message });
    }
});

app.post('/squad/rooms/create', (req, res) => {
    try {
        const { name, split, description } = req.body;
        const newRoom = createRoom(null, name, split, description);
        res.json({ ok: true, room: newRoom });
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message });
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'The API is working' });
});

app.use(errorHandler);

// Attach native WebSocket server to the HTTP server for real-time squad sync
attachSquadSocketServer(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
