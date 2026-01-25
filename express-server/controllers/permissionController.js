const Permission = require('../models/permissionModel');
const User = require('../models/userModel');
const File = require('../models/fileModel');
const mongoose = require('mongoose');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to calculate the role of a user for a specific file.
async function getEffectiveRole(fileId, userId, depth = 0) {
    if (!fileId || !userId) return null;

    // Safety check to prevent infinite recursion of circular folder references
    if (depth > 10) return null;

    try {
        // Convert to strings for reliable comparison
        const fileIdStr = fileId.toString();
        const userIdStr = userId.toString();

        const file = await File.findById(fileIdStr);
        if (!file) return null;

        // Check if the current user is the owner of the file
        const ownerId = file.userId ? file.userId.toString() : "";
        if (ownerId === userIdStr) {
            return 'owner';
        }

        // Get ALL permissions and filter by BOTH fileId AND userId using string comparison
        const allPerms = await Permission.find({});
        const matchingPerm = allPerms.find(p =>
            p.fileId.toString() === fileIdStr &&
            p.userId.toString() === userIdStr
        );
        if (matchingPerm) return matchingPerm.role;

        // If the file has a parent, recursively check permissions on the parent folder
        if (file.parentId) {
            return getEffectiveRole(file.parentId.toString(), userIdStr, depth + 1);
        }
    } catch (err) {
        // Log error internally if needed, but return null to fail safely
        console.error("getEffectiveRole error:", err);
        return null;
    }

    return null;
}
exports.getEffectiveRole = getEffectiveRole;

// Get user's role for a specific file
exports.getMyRole = async (req, res) => {
    const me = req.userId;
    const fileId = req.params.id;

    if (!isValidId(fileId)) return res.status(404).json({ error: "File not found" });

    try {
        const myRole = await getEffectiveRole(fileId, me);
        if (!myRole) {
            return res.status(403).json({ error: "No access to this file" });
        }
        return res.status(200).json({ role: myRole });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Helper: Get all permissions including inherited from parent folders
async function getAllPermissionsWithInheritance(fileId) {
    const allPermissions = [];
    const seenUserIds = new Set();
    let currentFileId = fileId;
    let depth = 0;

    while (currentFileId && depth < 10) {
        const fileIdStr = currentFileId.toString();

        // Get all permissions and filter by fileId
        const allPerms = await Permission.find({}).populate('userId', 'username email');
        const filePerms = allPerms.filter(p => p.fileId.toString() === fileIdStr);

        for (const perm of filePerms) {
            const userIdStr = perm.userId ? perm.userId._id.toString() : null;
            if (userIdStr && !seenUserIds.has(userIdStr)) {
                seenUserIds.add(userIdStr);
                allPermissions.push({
                    id: perm._id,
                    fileId: perm.fileId,
                    userId: perm.userId ? perm.userId._id : null,
                    username: perm.userId ? perm.userId.username : 'Unknown',
                    role: perm.role,
                    createdAt: perm.createdAt,
                    inherited: currentFileId.toString() !== fileId.toString()
                });
            }
        }

        // Move to parent folder
        const file = await File.findById(fileIdStr);
        if (file && file.parentId) {
            currentFileId = file.parentId;
            depth++;
        } else {
            break;
        }
    }

    return allPermissions;
}

// Get all permissions for a specific file (including inherited)
exports.getPermissions = async (req, res) => {
    const me = req.userId;
    const fileId = req.params.id;

    if (!isValidId(fileId)) return res.status(404).json({ error: "File not found" });

    try {
        const myRole = await getEffectiveRole(fileId, me);

        // If not owner, return their role info instead of forbidden error
        if (myRole !== 'owner') {
            return res.status(200).json({ notOwner: true, myRole: myRole || 'none' });
        }

        // Get all permissions including inherited from parent folders
        const permissions = await getAllPermissionsWithInheritance(fileId);

        return res.status(200).json(permissions);
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
        // First find the file to get its actual ObjectId
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ error: "File not found" });

        // Verify that the requester is the owner
        const myRole = await getEffectiveRole(fileId, me);
        if (myRole !== 'owner') {
            return res.status(403).json({ error: "Forbidden: Only owner can share" });
        }

        const { userId, role } = req.body || {};
        if (!userId) return res.status(400).json({ error: "userId is required" });

        const targetUser = await User.findById(userId);
        if (!targetUser) return res.status(404).json({ error: "User not found" });

        // Use the file's actual _id and target user's actual _id for consistency
        const newPerm = await Permission.create({
            fileId: file._id,
            userId: targetUser._id,
            role: role || 'reader'
        });
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