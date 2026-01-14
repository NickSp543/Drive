const mongoose = require('mongoose');
// User schema definition
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    image: { type: String, default: null },
    phoneNumber: { type: String, required: true },
    gender: { type: String, required: true },
    birthDate: { type: String, required: true }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('User', userSchema);