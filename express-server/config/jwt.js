const jwt = require('jsonwebtoken');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'driveXsecret123';

const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET);
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    JWT_SECRET,
    generateToken,
    verifyToken
};
