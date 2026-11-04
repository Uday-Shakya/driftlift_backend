'use client';
const express = require('express');
const router = express.Router();
const User = require('../Models/UserSchema')
const errorHandler = require('../Middlewares/errorMiddleware');
const authTokenHandler = require('../Middlewares/checkAuthToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'udayshak8962@gmail.com',
        pass: 'hufmdsijhxwpebpj'
    }
})
router.get('/test', async (req, res) => {
    res.json({
        message: "Auth api is working"
    })
})
function createResponse(ok, message, data) {
    return {
        ok,
        message,
        data,
    };
}
router.post('/register', async (req, res, next) => {
    console.log(req.body);
    try {
        const { name, email, password, weightInKg, heightInCm, gender, dob, goal, activityLevel } = req.body;
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return res.status(409).json(createResponse(false, 'Email already exists'));
        }
        const newUser = new User({
            name,
            password,
            email,
            weight: [
                {
                    weight: weightInKg,
                    unit: "kg",
                    date: Date.now()
                }
            ],
            height: [
                {
                    height: heightInCm,
                    date: Date.now(),
                    unit: "cm"
                }
            ],
            gender,
            dob,
            goal,
            activityLevel
        });
        await newUser.save(); // Await the save operation

        res.status(201).json(createResponse(true, 'User registered successfully'));

    }
    catch (err) {
        next(err);
    }
})
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json(createResponse(false, 'Invalid credentials'));
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json(createResponse(false, 'Invalid credentials'));
        }

        const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '50m' });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: '100m' });

        const cookieOptions = {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        };

        res.cookie('authToken', authToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, cookieOptions);
        res.status(200).json(createResponse(true, 'Login successful', {
            authToken,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                goal: user.goal,
                gender: user.gender,
            }
        }));
    }
    catch (err) {
        next(err);
    }
})
router.post('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.clearCookie('refreshToken');
    res.json(createResponse(true, 'Logged out successfully'));
});
router.post('/sendotp', async (req, res) => {
    try {
        const { email } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000);

        const mailOptions = {
            from: 'udayshak8962@gmail.com',
            to: email,
            subject: 'OTP for verification',
            text: `Your OTP is ${otp}`
        }

        transporter.sendMail(mailOptions, async (err, info) => {
            if (err) {
                console.log(err);
                res.status(500).json(createResponse(false, err.message));
            } else {
                res.json(createResponse(true, 'OTP sent successfully', { otp }));
            }
        });
    }
    catch (err) {
        next(err);
    }
})
router.post('/checklogin', authTokenHandler, async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json(createResponse(false, 'User not found'));
        }
        res.json({
            ok: true,
            message: 'User authenticated successfully',
            user,
        });
    } catch (err) {
        next(err);
    }
});

router.get('/getuser', authTokenHandler, async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json(createResponse(false, 'User not found'));
        }
        res.json(createResponse(true, 'User profile fetched', user));
    } catch (err) {
        next(err);
    }
});

router.put('/updateuser', authTokenHandler, async (req, res, next) => {
    try {
        const { name, goal, activityLevel, gender, dob } = req.body;
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json(createResponse(false, 'User not found'));
        }
        if (name) user.name = name;
        if (goal) user.goal = goal;
        if (activityLevel) user.activityLevel = activityLevel;
        if (gender) user.gender = gender;
        if (dob) user.dob = dob;

        await user.save();
        res.json(createResponse(true, 'Profile updated successfully', user));
    } catch (err) {
        next(err);
    }
});

router.use(errorHandler)

module.exports = router;