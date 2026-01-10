const File = require('../models/fileModel');
const Permission = require('../models/permissionModel');
const { sendToCppEngine } = require('../services/socketService');
const mongoose = require('mongoose');

// Helper to validate MongoDB ObjectId

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

function stripCppOkHeader(s) { 
    return String(s ?? "").replace(/^\s*200\s+ok\s*/i, "").trim();
}

function cppStatus(raw) {
    const s = String(raw ?? "").trimStart();
    const m = s.match(/^(\d{3})\b/);
    return m ? Number(m[1]) : null;
}

function escapeData(data) {
    // Escape only for C++ protocol
    return (data || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
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

        if (file.isFolder) {
            const includeContents = req.query.contents === 'true';
            if (includeContents) {
                const contents = await File.find({ parentId: fileId, isTrashed: false });
                return res.status(200).json({ ...file.toObject(), contents });
            }
            return res.status(200).json(file);
        }

        // Return the CLEAN data from MongoDB directly.
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

        // CRITICAL FIX: Save 'data' exactly as received (RAW) to MongoDB.
        // This ensures images (Base64) remain valid for the browser.
        const newFile = await File.create({
            userId,
            name,
            parentId: parentId || null,
            isFolder: isFolder || false,
            data: isFolder ? null : (data || "") 
        });

        if (!isFolder) {
            const safeData = data ? escapeData(data) : "EMPTY_FILE"; 
            const response = await sendToCppEngine(`post ${newFile.storageKey} ${safeData}`);

            if (cppStatus(response) >= 400) {
                console.warn("C++ Engine warning:", response);
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

        // Update C++ storage if data changed
        if (updates.data !== undefined && !file.isFolder) {
            await sendToCppEngine(`delete ${file.storageKey}`);
            const escapedData = escapeData(updates.data); // Escape for C++ only
            await sendToCppEngine(`post ${file.storageKey} ${escapedData}`);
        }

        // MongoDB update
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
    } else {
        try {
             await sendToCppEngine(`delete ${file.storageKey}`);
        } catch (error) { console.error("C++ delete warning:", error); }
    }
    
    await Permission.deleteMany({ fileId: file._id });
    await File.findByIdAndDelete(file._id);
}

exports.searchFiles = async (req, res) => {
    const userId = req.userId;
    const query = req.params.query;
    if (!query) return res.status(400).json({ error: "Search query is required" });

    try {
        const mongoResults = await File.find({
            userId,
            name: { $regex: query, $options: 'i' },
            isTrashed: false
        });

        let contentResults = [];
        try {
            const cppRes = await sendToCppEngine(`search ${query}`);
            if (cppStatus(cppRes) === 200) {
                const body = stripCppOkHeader(cppRes);
                const keys = body.split(/\r?\n/).map(k => k.trim()).filter(Boolean);
                
                if (keys.length > 0) {
                    contentResults = await File.find({
                        storageKey: { $in: keys },
                        userId,
                        isTrashed: false
                    });
                }
            }
        } catch (e) { console.error("Search C++ warning:", e); }

        const combined = [...mongoResults];
        for (const f of contentResults) {
            if (!combined.find(ex => ex._id.equals(f._id))) combined.push(f);
        }

        res.status(200).json(combined);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};