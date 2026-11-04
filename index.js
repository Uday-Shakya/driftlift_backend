const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);

const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = 8000;
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
require('dotenv').config();
require('./db');

app.use(bodyParser.json());
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true, // Allow credentials
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
