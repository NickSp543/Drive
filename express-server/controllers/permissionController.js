const Permission = require('../models/permissionModel');
const User = require('../models/userModel');
const File = require('../models/fileModel');
const mongoose = require('mongoose');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to calculate the effective role of a user for a specific file.
async function getEffectiveRole(fileId, userId, depth = 0) {
    if (!fileId || !userId) return null;
    
    // Safety check to prevent infinite recursion in case of circular folder references
    if (depth > 10) return null;

    try {
        const file = await File.findById(fileId);
        if (!file) return null;

        // Check if the current user is the owner of the file.
        const ownerId = file.userId ? file.userId.toString() : "";
        const currentUserId = userId.toString();

        if (ownerId === currentUserId) {
            return 'owner';
        }

        // Check for explicit permission on this specific file
        const perm = await Permission.findOne({ fileId, userId });
        if (perm) return perm.role;

        // If the file has a parent, recursively check permissions on the parent folder
        if (file.parentId) {
            return getEffectiveRole(file.parentId, userId, depth + 1);
        }
    } catch (err) {
        // Log error internally if needed, but return null to fail safely
        return null;
    }

    return null;
}
exports.getEffectiveRole = getEffectiveRole;

// Get all permissions for a specific file
exports.getPermissions = async (req, res) => {
    const me = req.userId;
    const fileId = req.params.id;

    if (!isValidId(fileId)) return res.status(404).json({ error: "File not found" });

    try {
        const myRole = await getEffectiveRole(fileId, me);
        
        // Only the owner is allowed to view the permission list
        if (myRole !== 'owner') {
            return res.status(403).json({ error: "Forbidden" });
        }

        const permissions = await Permission.find({ fileId }).populate('userId', 'username email');
        
        const formatted = permissions.map(p => ({
            id: p._id,
            userId: p.userId ? p.userId._id : null,
            username: p.userId ? p.userId.username : 'Unknown',
            role: p.role,
            createdAt: p.createdAt
        }));

        return res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Share a file with another user
exports.createPermission = async (req, res) => {
    const me = req.userId;
    const fileId = req.params.id;

    if (!isValidId(fileId)) return res.status(404).json({ error: "File not found" });

    try {
        // Verify that the requester is the owner
        const myRole = await getEffectiveRole(fileId, me);
        if (myRole !== 'owner') {
            return res.status(403).json({ error: "Forbidden: Only owner can share" });
        }

        const { userId, role } = req.body || {};
        if (!userId) return res.status(400).json({ error: "userId is required" });
        
        const targetUser = await User.findById(userId);
        if (!targetUser) return res.status(404).json({ error: "User not found" });

        const newPerm = await Permission.create({ fileId, userId, role });
        return res.status(201).json(newPerm);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "Permission already exists" });
        }
        return res.status(500).json({ error: error.message });
    }
};

// Update an existing permission role
exports.updatePermission = async (req, res) => {
    const me = req.userId;
    const { id: fileId, pId } = req.params;

    if (!isValidId(fileId) || !isValidId(pId)) return res.status(404).json({ error: "Not found" });

    try {
        const myRole = await getEffectiveRole(fileId, me);
        if (myRole !== 'owner') {
            return res.status(403).json({ error: "Forbidden" });
        }

        const updated = await Permission.findByIdAndUpdate(pId, { role: req.body.role }, { new: true });
        if (!updated) return res.status(404).json({ error: "Permission not found" });

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Remove a permission (unshare)
exports.deletePermission = async (req, res) => {
    const me = req.userId;
    const { id: fileId, pId } = req.params;

    if (!isValidId(fileId) || !isValidId(pId)) return res.status(404).json({ error: "Not found" });

    try {
        const myRole = await getEffectiveRole(fileId, me);
        if (myRole !== 'owner') {
            return res.status(403).json({ error: "Forbidden" });
        }

        await Permission.findByIdAndDelete(pId);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};