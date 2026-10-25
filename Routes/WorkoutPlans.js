const express = require('express');
const router = express.Router();
const errorHandler = require('../Middlewares/errorMiddleware');
const adminTokenHandler = require('../Middlewares/checkAdminToken');
const Workout = require('../Models/WorkoutSchema');

function createResponse(ok, message, data = null) {
    return {
        ok,
        message,
        data,
    };
}

// Seed default rich workouts with real video tutorials
const defaultWorkouts = [
    {
        name: 'Full Chest Hypertrophy',
        category: 'chest',
        description: 'Target upper, middle, and lower pectorals with strict form and peak contraction.',
        durationInMinutes: 45,
        difficulty: 'Intermediate',
        targetMuscles: ['Upper Pectorals', 'Mid Chest', 'Triceps', 'Front Delts'],
        imageURL: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1740&q=80',
        exercises: [
            {
                name: 'Barbell Bench Press',
                description: 'The premier compound movement for chest mass and pushing power.',
                sets: 4,
                reps: 10,
                rest: 90,
                videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
                youtubeId: 'rT7DgCr-3pg',
                imageURL: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
                tips: ['Keep shoulder blades retracted and depressed', 'Tuck elbows at ~45 degrees', 'Drive through the heels']
            },
            {
                name: 'Incline Dumbbell Press',
                description: 'Focuses heavily on the clavicular head (upper chest) development.',
                sets: 3,
                reps: 12,
                rest: 60,
                videoUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8',
                youtubeId: '8iPEnn-ltC8',
                imageURL: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
                tips: ['Bench angle between 30 and 45 degrees', 'Do not bounce dumbbells at the bottom', 'Squeeze at peak contraction']
            },
            {
                name: 'Cable Chest Flyes',
                description: 'Maintains constant tension across the entire chest for extreme blood flow.',
                sets: 3,
                reps: 15,
                rest: 45,
                videoUrl: 'https://www.youtube.com/embed/Iwe6AmxVf7o',
                youtubeId: 'Iwe6AmxVf7o',
                imageURL: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
                tips: ['Maintain a slight bend in your elbows', 'Cross over hands slightly at the finish', 'Focus on mind-muscle connection']
            }
        ]
    },
    {
        name: 'V-Taper Back Demolition',
        category: 'back',
        description: 'Build width and thickness with vertical pulls, rows, and lower back engagement.',
        durationInMinutes: 50,
        difficulty: 'Advanced',
        targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Trapezius', 'Biceps'],
        imageURL: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=800&q=80',
        exercises: [
            {
                name: 'Wide Grip Lat Pulldown',
                description: 'Builds lat width and upper back definition.',
                sets: 4,
                reps: 10,
                rest: 60,
                videoUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc',
                youtubeId: 'CAwf7n6Luuc',
                imageURL: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=800&q=80',
                tips: ['Pull with elbows down to hips', 'Do not swing your torso back excessively', 'Pause 1 second at chest level']
            },
            {
                name: 'Barbell Bent-Over Row',
                description: 'Essential for back thickness, spinal erector strength, and grip.',
                sets: 4,
                reps: 8,
                rest: 90,
                videoUrl: 'https://www.youtube.com/embed/FWJR5Ve8gkQ',
                youtubeId: 'FWJR5Ve8gkQ',
                imageURL: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=800&q=80',
                tips: ['Hinge at hips with flat back', 'Pull bar into lower belly button', 'Control the descent']
            }
        ]
    },
    {
        name: 'Iron Core & Abs Shred',
        category: 'abs',
        description: 'Comprehensive core routine targeting rectus abdominis, obliques, and transverse abdominis.',
        durationInMinutes: 25,
        difficulty: 'Beginner',
        targetMuscles: ['Upper Abs', 'Lower Abs', 'Obliques', 'Core Stabilizers'],
        imageURL: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
        exercises: [
            {
                name: 'Hanging Leg Raises',
                description: 'One of the best lower abdominal exercises that also challenges grip.',
                sets: 3,
                reps: 12,
                rest: 45,
                videoUrl: 'https://www.youtube.com/embed/Pr1ieGZ5atk',
                youtubeId: 'Pr1ieGZ5atk',
                imageURL: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
                tips: ['Avoid swinging using momentum', 'Roll pelvis upward at top of movement', 'Breathe out on contraction']
            },
            {
                name: 'Plank to Dolphin Pose',
                description: 'Stabilizes core endurance while stretching hamstrings and shoulders.',
                sets: 3,
                reps: 15,
                rest: 45,
                videoUrl: 'https://www.youtube.com/embed/ynUw0YsRMHk',
                youtubeId: 'ynUw0YsRMHk',
                imageURL: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=800&q=80',
                tips: ['Keep core braced throughout', 'Do not let lower back sag', 'Steady controlled tempo']
            }
        ]
    },
    {
        name: 'Boulder Shoulders',
        category: 'shoulder',
        description: 'Complete 3D deltoid development for anterior, lateral, and posterior heads.',
        durationInMinutes: 40,
        difficulty: 'Intermediate',
        targetMuscles: ['Lateral Deltoids', 'Front Delts', 'Rear Delts', 'Traps'],
        imageURL: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=800&q=80',
        exercises: [
            {
                name: 'Overhead Dumbbell Shoulder Press',
                description: 'Builds functional pressing strength and overhead stability.',
                sets: 4,
                reps: 10,
                rest: 75,
                videoUrl: 'https://www.youtube.com/embed/qEwKCR5JCog',
                youtubeId: 'qEwKCR5JCog',
                imageURL: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
                tips: ['Press directly overhead without hyper-arching back', 'Keep elbows slightly in front of shoulders']
            },
            {
                name: 'Lateral Raise with Dumbbells',
                description: 'The golden exercise for broad shoulders and lateral deltoid isolation.',
                sets: 4,
                reps: 15,
                rest: 45,
                videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
                youtubeId: '3VcKaXpzqRo',
                imageURL: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
                tips: ['Lead with elbows not wrists', 'Keep slight forward lean', 'Do not shrug shoulders']
            }
        ]
    },
    {
        name: 'Arms & Gun Show (Biceps & Triceps)',
        category: 'biceps',
        description: 'Super-pump arm workout pairing biceps and triceps for maximum hypertrophy.',
        durationInMinutes: 35,
        difficulty: 'Intermediate',
        targetMuscles: ['Biceps Brachii', 'Brachialis', 'Triceps Brachii'],
        imageURL: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
        exercises: [
            {
                name: 'Incline Dumbbell Bicep Curl',
                description: 'Puts long head of bicep under maximum stretch for unmatched peak growth.',
                sets: 3,
                reps: 12,
                rest: 60,
                videoUrl: 'https://www.youtube.com/embed/soxrZlIl35U',
                youtubeId: 'soxrZlIl35U',
                imageURL: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
                tips: ['Keep upper arms stationary', 'Supinate wrists at the top', 'Control negative 2-3 seconds']
            },
            {
                name: 'Tricep Rope Pushdowns',
                description: 'Isolates lateral and medial tricep heads with continuous cable tension.',
                sets: 3,
                reps: 15,
                rest: 45,
                videoUrl: 'https://www.youtube.com/embed/vB5OHsJ3EME',
                youtubeId: 'vB5OHsJ3EME',
                imageURL: 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=800&q=80',
                tips: ['Spread the rope apart at bottom', 'Lock elbows by ribs', 'Avoid using bodyweight to push down']
            }
        ]
    },
    {
        name: 'Quad & Hamstring Power (Legs)',
        category: 'legs',
        description: 'Heavy compound leg session building athletic lower body strength and symmetry.',
        durationInMinutes: 55,
        difficulty: 'Advanced',
        targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
        imageURL: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=800&q=80',
        exercises: [
            {
                name: 'Barbell Back Squat',
                description: 'The undisputed king of all lower-body strength and mass builders.',
                sets: 4,
                reps: 8,
                rest: 120,
                videoUrl: 'https://www.youtube.com/embed/MVMNk0HiTMg',
                youtubeId: 'MVMNk0HiTMg',
                imageURL: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
                tips: ['Hit parallel or below', 'Keep chest high and core braced', 'Drive knees out in line with toes']
            },
            {
                name: 'Romanian Deadlift (RDL)',
                description: 'Targets hamstrings and glutes through an intense hip hinge stretch.',
                sets: 3,
                reps: 10,
                rest: 90,
                videoUrl: 'https://www.youtube.com/embed/JCXUYuzwNrM',
                youtubeId: 'JCXUYuzwNrM',
                imageURL: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
                tips: ['Soft bend in knees, push hips straight back', 'Keep bar hugging close to shins']
            }
        ]
    }
];

// Seed endpoint - populates defaults if empty or requested
router.post('/seed', async (req, res) => {
    try {
        await Workout.deleteMany({});
        const inserted = await Workout.insertMany(defaultWorkouts);
        res.json(createResponse(true, 'Seeded workout library with video tutorials successfully', inserted));
    } catch (err) {
        res.status(500).json(createResponse(false, err.message));
    }
});

// Create new workout (Admin)
router.post('/workouts', adminTokenHandler, async (req, res) => {
    try {
        const { name, category, description, durationInMinutes, difficulty, targetMuscles, exercises, imageURL } = req.body;
        const workout = new Workout({
            name,
            category: category ? category.toLowerCase() : 'other',
            description,
            durationInMinutes,
            difficulty,
            targetMuscles,
            exercises,
            imageURL,
        });

        await workout.save();
        res.json(createResponse(true, 'Workout created successfully', workout));
    } catch (err) {
        res.status(400).json(createResponse(false, err.message));
    }
});

// Fetch all workouts
router.get('/workouts', async (req, res) => {
    try {
        let workouts = await Workout.find({});
        // Auto-seed if database is empty
        if (workouts.length === 0) {
            workouts = await Workout.insertMany(defaultWorkouts);
        }
        res.json(createResponse(true, 'Workouts fetched successfully', workouts));
    } catch (err) {
        res.status(500).json(createResponse(false, err.message));
    }
});

// Fetch workouts by category
router.get('/category/:category', async (req, res) => {
    try {
        const cat = req.params.category.toLowerCase();
        let workouts = await Workout.find({ category: cat });
        if (workouts.length === 0) {
            // Find in defaultWorkouts if not in DB
            const matched = defaultWorkouts.filter(w => w.category === cat);
            if (matched.length > 0) {
                workouts = await Workout.insertMany(matched);
            }
        }
        res.json(createResponse(true, `Workouts for ${cat} fetched`, workouts));
    } catch (err) {
        res.status(500).json(createResponse(false, err.message));
    }
});

// Fetch workout by ID
router.get('/workouts/:id', async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id);
        if (!workout) {
            return res.status(404).json(createResponse(false, 'Workout not found'));
        }
        res.json(createResponse(true, 'Workout fetched successfully', workout));
    } catch (err) {
        res.status(500).json(createResponse(false, err.message));
    }
});

// Update workout (Admin)
router.put('/workouts/:id', adminTokenHandler, async (req, res) => {
    try {
        const updated = await Workout.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json(createResponse(false, 'Workout not found'));
        }
        res.json(createResponse(true, 'Workout updated successfully', updated));
    } catch (err) {
        res.status(400).json(createResponse(false, err.message));
    }
});

// Delete workout (Admin) - FIXED Mongoose 7/8 remove() bug!
router.delete('/workouts/:id', adminTokenHandler, async (req, res) => {
    try {
        const deleted = await Workout.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json(createResponse(false, 'Workout not found'));
        }
        res.json(createResponse(true, 'Workout deleted successfully'));
    } catch (err) {
        res.status(500).json(createResponse(false, err.message));
    }
});

router.use(errorHandler);

module.exports = router;