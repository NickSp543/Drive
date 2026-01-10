const User = require('../models/userModel');
const { generateToken } = require('../config/jwt');

async function registerUser(req, res) {
    // Grab the parameters from the request
    const {
        username, password, image, firstName, lastName,
        phoneNumber, gender, birthDate
    } = req.body;

    // Validate the required fields
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    if (!firstName || !lastName) {
        return res.status(400).json({ error: "First name and last name are required" });
    }

    if (!phoneNumber || !gender || !birthDate) {
        return res.status(400).json({ error: "Phone number, gender, and birth date are required" });
    }

    // Validate username length (min of 3 characters)
    if (username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
    }

    // Validate password length (min of 8 characters)
    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Validate phone number format (10 digits - israel)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[-\s]/g, ''))) {
        return res.status(400).json({ error: "Phone number must be 10 digits" });
    }

    // Validate the gender 
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender.toLowerCase())) {
        return res.status(400).json({ error: "Invalid gender" });
    }

    // Validate birth date be in the past
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    if (birthDateObj >= today || isNaN(birthDateObj.getTime())) {
        return res.status(400).json({ error: "Invalid birth date" });
    }

    try {
        // Taken username
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: "Username already exists" });
        }

        // Create the user
        const user = await User.create({
            username, password, image, firstName, lastName,
            phoneNumber, gender, birthDate
        });

        // Generate the JWT token
        const token = generateToken(user._id);

        res.status(201).json({
            id: user._id,
            token,
            user: {
                id: user._id,
                username: user.username,
                image: user.image,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                gender: user.gender,
                birthDate: user.birthDate
            }
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Server error" });
    }
}

// Find a user given it's ID, return the user's data for the user
async function getUser(req, res) {
    try {
        const user = await User.findById(req.params.id); // Get the user via ID
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get data & Send data
        res.json({
            id: user._id,
            username: user.username,
            image: user.image,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            gender: user.gender,
            birthDate: user.birthDate
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}

// Login using username and password, return JWT token if it was successful
async function login(req, res) {
    const { username, password } = req.body; // Get the parameters from the request

    try {
        const user = await User.findOne({ username });

        // Simple password check (since not encrypted yet)
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate the JWT token
        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                image: user.image,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                gender: user.gender,
                birthDate: user.birthDate
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}

// Find the user by username, return basic user info (for sharing/searching)
async function getUserByUsername(req, res) {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return basic public info only
        res.json({
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = { registerUser, getUser, login, getUserByUsername };