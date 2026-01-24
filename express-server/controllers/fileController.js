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

// Helper: Add isStarred and userRole computed fields for a user
async function addComputedFields(files, userId) {
    const userIdStr = userId.toString();
    const results = [];
    for (const file of files) {
        const fileObj = file.toObject ? file.toObject() : file;
        fileObj.isStarred = (fileObj.starredBy || []).some(id => id.toString() === userIdStr);

        // Compute user's role for this file
        const fileOwnerId = fileObj.userId ? fileObj.userId.toString() : '';
        if (fileOwnerId === userIdStr) {
            fileObj.userRole = 'owner';
        } else {
            // Check for permission (will inherit from parent via checkRoleLocal)
            // Get the file ID, ensuring it's a valid ObjectId
            const fileId = fileObj._id || fileObj.id;
            const role = await checkRoleLocal(fileId, userId);
            fileObj.userRole = role || 'reader'; // Default to reader if has access but role unknown
        }
        results.push(fileObj);
    }
    return results;
}

// Internal Helper: Check permissions locally (matches working part4 logic)
async function checkRoleLocal(fileId, userId, depth = 0) {
    if (!fileId || !userId) return null;
    if (depth > 10) return null;

    try {
        // Convert to strings for reliable comparison
        const fileIdStr = fileId.toString();
        const userIdStr = userId.toString();

        const file = await File.findById(fileIdStr);
        if (!file) return null;

        // Check ownership first
        const ownerId = file.userId ? file.userId.toString() : "";
        if (ownerId === userIdStr) return 'owner';

        // Get ALL permissions and filter by BOTH fileId AND userId using string comparison
        // This is the most reliable approach to avoid any ObjectId matching issues
        const allPerms = await Permission.find({});
        const matchingPerm = allPerms.find(p =>
            p.fileId.toString() === fileIdStr &&
            p.userId.toString() === userIdStr
        );
        if (matchingPerm) return matchingPerm.role;

        // Check parent folder permissions (inheritance)
        if (file.parentId) {
            return checkRoleLocal(file.parentId.toString(), userIdStr, depth + 1);
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

        if (view === 'starred') {
            // Find files starred by this user - use string comparison
            const userIdStr = userId.toString();
            const starredFiles = await File.find({ isTrashed: false });
            const filtered = starredFiles.filter(f =>
                (f.starredBy || []).some(id => id.toString() === userIdStr)
            );
            const itemsWithFields = await addComputedFields(filtered, userId);
            return res.status(200).json(itemsWithFields);
        } else if (view === 'trash') {
            // Show trashed files owned by user - use string comparison
            const userIdStr = userId.toString();
            const trashedFiles = await File.find({ isTrashed: true });
            const filtered = trashedFiles.filter(f => f.userId.toString() === userIdStr);
            const itemsWithFields = await addComputedFields(filtered, userId);
            return res.status(200).json(itemsWithFields);
        } else if (view === 'recent') {
            // Show recently created files owned by user
            const userIdStr = userId.toString();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentFiles = await File.find({ isTrashed: false, createdAt: { $gte: sevenDaysAgo } });
            const filtered = recentFiles.filter(f => f.userId.toString() === userIdStr);
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const itemsWithFields = await addComputedFields(filtered, userId);
            return res.status(200).json(itemsWithFields);
        } else if (view === 'shared') {
            // Find all permissions for this user - use string comparison for reliability
            const allPerms = await Permission.find({});
            const userIdStr = userId.toString();
            const userPerms = allPerms.filter(p => p.userId.toString() === userIdStr);
            const fileIds = userPerms.map(p => p.fileId);

            // Get files where user has permission and is NOT the owner
            const sharedFiles = await File.find({ _id: { $in: fileIds }, isTrashed: false });
            // Filter out files owned by current user
            const filteredFiles = sharedFiles.filter(f => f.userId.toString() !== userIdStr);
            const itemsWithFields = await addComputedFields(filteredFiles, userId);
            return res.status(200).json(itemsWithFields);
        } else {
            // Check if navigating into a folder
            if (parentId && parentId !== 'null') {
                if (!isValidId(parentId)) return res.status(400).json({ error: "Invalid parentId" });

                // Convert parentId to string for comparison
                const parentIdStr = parentId.toString();

                // Check if user has access to the parent folder
                const parentRole = await checkRoleLocal(parentIdStr, userId);

                if (parentRole) {
                    // Get ALL files and filter by parentId string comparison
                    // This avoids any ObjectId matching issues
                    const allFiles = await File.find({ isTrashed: false });

                    // Filter files whose parentId matches (using string comparison)
                    let childFiles = allFiles.filter(f => {
                        if (!f.parentId) return false;
                        return f.parentId.toString() === parentIdStr;
                    });

                    // Apply folder/file filter
                    if (folders === 'true') {
                        childFiles = childFiles.filter(f => f.isFolder);
                    } else if (files === 'true') {
                        childFiles = childFiles.filter(f => !f.isFolder);
                    }

                    // Sort: folders first, then by date
                    childFiles.sort((a, b) => {
                        if (a.isFolder && !b.isFolder) return -1;
                        if (!a.isFolder && b.isFolder) return 1;
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    });

                    const itemsWithFields = await addComputedFields(childFiles, userId);
                    return res.status(200).json(itemsWithFields);
                } else {
                    return res.status(403).json({ error: "Access denied to folder" });
                }
            } else {
                // Root level - show only user's own files
                const userIdStr = userId.toString();
                const userFiles = await File.find({ isTrashed: false, parentId: null });
                // Filter to only user's own files at root
                let ownedFiles = userFiles.filter(f => f.userId.toString() === userIdStr);

                // Apply folder/file filter if specified
                if (folders === 'true') {
                    ownedFiles = ownedFiles.filter(f => f.isFolder);
                } else if (files === 'true') {
                    ownedFiles = ownedFiles.filter(f => !f.isFolder);
                }

                // Sort: folders first, then by creation date
                ownedFiles.sort((a, b) => {
                    if (a.isFolder && !b.isFolder) return -1;
                    if (!a.isFolder && b.isFolder) return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });

                const itemsWithFields = await addComputedFields(ownedFiles, userId);
                return res.status(200).json(itemsWithFields);
            }
        }
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
        // Add computed isStarred field for current user
        fileData.isStarred = (fileData.starredBy || []).some(id => id.toString() === userId.toString());
        // Add user's role for this file
        fileData.userRole = role;

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
        let parentObjectId = null;

        if (parentId) {
             if (!isValidId(parentId)) return res.status(404).json({ error: "Parent folder not found" });

             // Find the parent folder to get its actual ObjectId
             const parentFolder = await File.findById(parentId);
             if (!parentFolder) {
                 return res.status(404).json({ error: "Parent folder not found" });
             }
             if (!parentFolder.isFolder) {
                 return res.status(400).json({ error: "Parent must be a folder" });
             }

             const role = await checkRoleLocal(parentFolder._id, userId);
             if (role !== 'owner' && role !== 'writer') {
                 return res.status(403).json({ error: "No write access to parent folder" });
             }

             // Use the actual ObjectId from the found document
             parentObjectId = parentFolder._id;
        }

        // Create file record in MongoDB using actual ObjectIds
        const newFile = await File.create({
            userId: new mongoose.Types.ObjectId(userId),
            name,
            parentId: parentObjectId,
            isFolder: isFolder || false,
            data: null // Don't store data in MongoDB - it goes to C++ server
        });

        // If it's a file (not folder), store content in C++ server
        if (!isFolder) {
            try {
                const escapedData = escapeData(data || '');
                await sendToCppEngine(`post ${newFile.storageKey} ${escapedData}`);
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

        // Handle per-user starring
        if (updates.isStarred !== undefined) {
            if (updates.isStarred) {
                // Add user to starredBy array if not already there
                await File.findByIdAndUpdate(fileId, {
                    $addToSet: { starredBy: userId }
                });
            } else {
                // Remove user from starredBy array
                await File.findByIdAndUpdate(fileId, {
                    $pull: { starredBy: userId }
                });
            }
            delete updates.isStarred; // Don't pass to the regular update
        }

        // If updating file content, send to C++ server
        if (updates.data !== undefined && !file.isFolder) {
            try {
                const escapedData = escapeData(updates.data);
                await sendToCppEngine(`post ${file.storageKey} ${escapedData}`);
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
            await sendToCppEngine(`delete ${file.storageKey}`);
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

        // Add isStarred and userRole computed fields for current user
        const resultsWithFields = await addComputedFields(allResults, userId);
        res.status(200).json(resultsWithFields);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};
