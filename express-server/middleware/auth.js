const { verifyToken } = require('../config/jwt');
const User = require('../models/userModel');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // token

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const user = User.getUserById(decoded.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
};

// Optional authentication - doesn't fail if no token - for registering
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            const user = User.getUserById(decoded.userId);
            if (user) {
                req.userId = decoded.userId;
                req.user = user;
            }
        }
    }

    next();
};

module.exports = {
    authenticateToken,
    optionalAuth
};
