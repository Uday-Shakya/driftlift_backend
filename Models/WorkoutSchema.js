const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    sets: {
        type: Number,
        default: 3,
    },
    reps: {
        type: Number,
        default: 10,
    },
    rest: {
        type: Number,
        default: 60, // in seconds
    },
    videoUrl: {
        type: String,
        default: '',
    },
    youtubeId: {
        type: String,
        default: '',
    },
    imageURL: {
        type: String,
        default: '',
    },
    tips: [
        {
            type: String,
        }
    ],
});

const workoutSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        index: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
    },
    durationInMinutes: {
        type: Number,
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Intermediate',
    },
    targetMuscles: [
        {
            type: String,
        }
    ],
    exercises: [exerciseSchema],
    imageURL: {
        type: String,
        default: '',
    },
}, {
    timestamps: true
});

const Workout = mongoose.model('Workout', workoutSchema);
module.exports = Workout;