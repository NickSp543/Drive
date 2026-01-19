const File = require('../models/fileModel');
const Permission = require('../models/permissionModel');
const mongoose = require('mongoose');
const { sendToCppEngine } = require('../services/socketService');

// Helper to validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper to escape data for C++ server (convert newlines to escape sequences)
function escapeData(data) {
    if (!data) return '';
    return data
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// Helper to parse C++ server response
function parseResponse(response) {
    const lines = response.split('\n');
    const statusLine = lines[0] || '';
    const statusMatch = statusLine.match(/^(\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : 500;

    // For GET responses, data comes after empty line (status\n\ndata)
    let content = '';
    if (status === 200 && lines.length > 2) {
        content = lines.slice(2).join('\n');
        if (content.endsWith('\n')) {
            content = content.slice(0, -1);
        }
    }

    return { status, content };
}

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

        // If it's a file (not folder), get content from C++ server
        let fileData = file.toObject();
        if (!file.isFolder && file.storageKey) {
            try {
                const response = await sendToCppEngine(`get ${file.storageKey}`);
                const parsed = parseResponse(response);
                if (parsed.status === 200) {
                    fileData.data = parsed.content;
                }
            } catch (err) {
                console.error("Failed to get file content from C++ server:", err);
                // Continue without content if C++ server is unavailable
            }
        }

        if (file.isFolder) {
            const includeContents = req.query.contents === 'true';
            if (includeContents) {
                const contents = await File.find({ parentId: fileId, isTrashed: false });
                return res.status(200).json({ ...fileData, contents });
            }
            return res.status(200).json(fileData);
        }

        res.status(200).json(fileData);
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

        // Create file record in MongoDB (without data - data goes to C++ server)
        const newFile = await File.create({
            userId,
            name,
            parentId: parentId || null,
            isFolder: isFolder || false,
            data: null // Don't store data in MongoDB - it goes to C++ server
        });

        // If it's a file (not folder), store content in C++ server
        if (!isFolder) {
            try {
                const escapedData = escapeData(data || '');
                const response = await sendToCppEngine(`post ${newFile.storageKey} ${escapedData}`);
                console.log("C++ server response for post:", response);
            } catch (err) {
                console.error("C++ server error during file creation:", err);
                // File is created in MongoDB but content storage failed
            }
        }

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

        // If updating file content, send to C++ server
        if (updates.data !== undefined && !file.isFolder) {
            try {
                const escapedData = escapeData(updates.data);
                const response = await sendToCppEngine(`post ${file.storageKey} ${escapedData}`);
                console.log("C++ server response for update:", response);
            } catch (err) {
                console.error("C++ server error during file update:", err);
            }
            // Remove data from updates dont store it in MongoDB
            delete updates.data;
        }

        // Update metadata in MongoDB
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

    // Delete file content from C++ server if it's a file
    if (!file.isFolder && file.storageKey) {
        try {
            const response = await sendToCppEngine(`delete ${file.storageKey}`);
            console.log("C++ server response for delete:", response);
        } catch (err) {
            console.error("Failed to delete file from C++ server:", err);
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
        // First, search by filename in MongoDB
        const mongoResults = await File.find({
            userId,
            isTrashed: false,
            name: { $regex: query, $options: 'i' }
        });

        // Also search in C++ server for file content
        let cppStorageKeys = [];
        try {
            const response = await sendToCppEngine(`search ${query}`);
            const parsed = parseResponse(response);
            if (parsed.status === 200 && parsed.content) {
                // Response contains matching storage keys
                cppStorageKeys = parsed.content.split('\n').filter(k => k.trim());
            }
        } catch (err) {
            console.error("C++ search failed:", err);
        }

        // Find files that match the storage keys from C++ search
        let contentResults = [];
        if (cppStorageKeys.length > 0) {
            contentResults = await File.find({
                userId,
                isTrashed: false,
                storageKey: { $in: cppStorageKeys }
            });
        }

        // Combine and deduplicate results
        const allResults = [...mongoResults];
        for (const file of contentResults) {
            if (!allResults.find(f => f._id.toString() === file._id.toString())) {
                allResults.push(file);
            }
        }

        res.status(200).json(allResults);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};
