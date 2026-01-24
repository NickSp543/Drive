const { verifyToken } = require('../config/jwt');
const User = require('../models/userModel');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // token

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        const userId = decoded.userId || decoded.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        req.userId = user._id.toString(); 
        req.user = user;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Optional authentication for registering
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = verifyToken(token);
            if (decoded) {
                const userId = decoded.userId || decoded.id;
                const user = await User.findById(userId);
                
                if (user) {
                    req.userId = user._id.toString();
                    req.user = user;
                }
            }
        } catch (error) {
            // Silently ignore auth errors in optional auth
        }
    }

    next();
};

module.exports = {
    authenticateToken,
    optionalAuth
};