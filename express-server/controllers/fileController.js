const File = require('../models/fileModel');
const Permission = require('../models/permissionModel');
const mongoose = require('mongoose');

// Helper to validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Internal Helper: Check permissions locally
async function checkRoleLocal(fileId, userId, depth = 0) {
    if (!fileId || !userId) return null;
    if (depth > 10) return null;

    try {
        const file = await File.findById(fileId);
        if (!file) return null;

        const ownerId = file.userId ? file.userId.toString() : "";
        const currentUserId = userId.toString();

        if (ownerId === currentUserId) return 'owner';

        const perm = await Permission.findOne({ fileId, userId });
        if (perm) return perm.role;

        if (file.parentId) {
            return checkRoleLocal(file.parentId, userId, depth + 1);
        }
    } catch (err) {
        console.error("Role check error:", err);
        return null;
    }
    return null;
}

//CONTROLLER METHODS
exports.getFiles = async (req, res) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { parentId, folders, files, view } = req.query;
        let query = {};

        if (view === 'starred') {
            query = { userId, isStarred: true, isTrashed: false };
        } else if (view === 'trash') {
            query = { userId, isTrashed: true };
        } else if (view === 'recent') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            query = { userId, isTrashed: false, createdAt: { $gte: sevenDaysAgo } };
        } else if (view === 'shared') {
            const perms = await Permission.find({ userId });
            const fileIds = perms.map(p => p.fileId);
            query = { _id: { $in: fileIds }, isTrashed: false, userId: { $ne: userId } };
        } else {
            query = { userId, isTrashed: false };
            if (parentId && parentId !== 'null') {
                if (!isValidId(parentId)) return res.status(400).json({ error: "Invalid parentId" });
                query.parentId = parentId;
            } else {
                query.parentId = null;
            }
        }

        if (folders === 'true') query.isFolder = true;
        if (files === 'true') query.isFolder = false;

        const allItems = await File.find(query).sort({ isFolder: -1, createdAt: -1 });
        res.status(200).json(allItems);
    } catch (error) {
        console.error("getFiles Error:", error);
        res.status(500).json({ error: "Failed to retrieve files" });
    }
};

exports.getFileById = async (req, res) => {
    const userId = req.userId;
    const fileId = req.params.id;
    if (!isValidId(fileId)) return res.status(404).json({ error: "File not found" });

    try {
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ error: "File not found" });

        const role = await checkRoleLocal(fileId, userId);
        if (!role) {
             return res.status(404).json({ error: "File not found (Permission denied)" });
        }

        if (file.isFolder) {
            const includeContents = req.query.contents === 'true';
            if (includeContents) {
                const contents = await File.find({ parentId: fileId, isTrashed: false });
                return res.status(200).json({ ...file.toObject(), contents });
            }
            return res.status(200).json(file);
        }

        res.status(200).json(file);
    } catch (error) {
        console.error("getFileById Error:", error);
        res.status(500).json({ error: "Internal Server Error during file fetch" });
    }
};

exports.createFile = async (req, res) => {
    const userId = req.userId;
    const { name, data, parentId, isFolder } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
        if (parentId) {
             if (!isValidId(parentId)) return res.status(404).json({ error: "Parent folder not found" });

             const role = await checkRoleLocal(parentId, userId);
             if (role !== 'owner' && role !== 'writer') {
                 return res.status(403).json({ error: "No write access to parent folder" });
             }
        }

        // Store file data in MongoDB only
        const newFile = await File.create({
            userId,
            name,
            parentId: parentId || null,
            isFolder: isFolder || false,
            data: isFolder ? null : (data || "")
        });

        res.status(201).set('Location', `/api/files/${newFile._id}`).json(newFile);
    } catch (error) {
        console.error("createFile Error:", error);
        res.status(500).json({ error: error.toString() });
    }
};

exports.updateFile = async (req, res) => {
    const userId = req.userId;
    const fileId = req.params.id;
    const updates = req.body;

    if (!isValidId(fileId)) return res.status(404).json({ error: "File not found" });

    try {
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ error: "File not found" });

        const role = await checkRoleLocal(fileId, userId);
        const canWrite = (role === 'writer' || role === 'owner');
        const canRead = (role !== null);

        if (updates.isStarred !== undefined && !canRead) {
             return res.status(403).json({ error: "No read permission" });
        } else if (updates.data !== undefined || updates.name !== undefined) {
             if (!canWrite) return res.status(403).json({ error: "No write permission" });
        }

        // MongoDB update only
        const updatedFile = await File.findByIdAndUpdate(fileId, updates, { new: true });
        res.status(200).json(updatedFile);
    } catch (error) {
        console.error("updateFile Error:", error);
        res.status(500).json({ error: error.toString() });
    }
};

exports.deleteFile = async (req, res) => {
    const userId = req.userId;
    const fileId = req.params.id;
    const permanent = req.query.permanent === 'true';

    if (!isValidId(fileId)) return res.status(404).json({ error: "File not found" });

    try {
        const file = await File.findById(fileId);
        if (!file) return res.status(404).json({ error: "File not found" });

        if (file.userId.toString() !== userId) {
             return res.status(403).json({ error: "Only owner can delete" });
        }

        if (file.isTrashed || permanent) {
            await deleteRecursive(file);
        } else {
            await trashRecursive(file);
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};

async function trashRecursive(file) {
    if (file.isFolder) {
        const children = await File.find({ parentId: file._id });
        for (const child of children) {
            await trashRecursive(child);
        }
    }
    await File.findByIdAndUpdate(file._id, { isTrashed: true, trashedAt: new Date() });
}

async function deleteRecursive(file) {
    if (file.isFolder) {
        const children = await File.find({ parentId: file._id });
        for (const child of children) {
            await deleteRecursive(child);
        }
    }

    await Permission.deleteMany({ fileId: file._id });
    await File.findByIdAndDelete(file._id);
}

exports.searchFiles = async (req, res) => {
    const userId = req.userId;
    const query = req.params.query;
    if (!query) return res.status(400).json({ error: "Search query is required" });

    try {
        // Search in MongoDB only (by name and content)
        const results = await File.find({
            userId,
            isTrashed: false,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { data: { $regex: query, $options: 'i' } }
            ]
        });

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};
