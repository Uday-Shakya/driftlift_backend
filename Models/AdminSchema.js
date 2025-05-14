const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure that each admin's email is unique
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Pre-save hook to hash the password before saving
adminSchema.pre('save', async function (next) {
    const admin = this;

    if (admin.isModified('password')) {
        admin.password = await bcrypt.hash(admin.password, 8); // Salt rounds set to 8
    }

    next();
});

// Prevent model overwrite if the model already exists
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

module.exports = Admin;
