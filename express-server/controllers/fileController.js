const fileModel = require('../models/fileModel');
const userModel = require('../models/userModel');
const permissionModel = require("../models/permissionModel");
const { sendToCppEngine } = require('../services/socketService');

// Get user ID from JWT authentication (in the middleware folder)
const getUserId = (req, res) => {
    // The middleware sets the req.userId
    return req.userId;
};

function parseIdOr404(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function ensureCanReadOr404(req, res, me, fileId) {
  const file = fileModel.getById(fileId);
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return null;
  }
  const role = permissionModel.getEffectiveRoleForFile(fileId, me);
  if (!permissionModel.canRead(role)) {
    res.status(404).json({ error: "File not found" });
    return null;
  }
  return file;
}

function ensureCanWriteOr404(req, res, me, fileId) {
  const file = fileModel.getById(fileId);
  if (!file) {
    console.log(`[PERMISSION] File ${fileId} not found`);
    res.status(404).json({ error: "File not found" });
    return null;
  }
  const role = permissionModel.getEffectiveRoleForFile(fileId, me);
  console.log(`[PERMISSION] User ${me} has role '${role}' for file ${fileId}`);
  if (!permissionModel.canWrite(role)) {
    console.log(`[PERMISSION] Role '${role}' cannot write`);
    res.status(404).json({ error: "File not found" });
    return null;
  }
  return file;
}

function ensureOwnerOr404(req, res, me, fileId) {
  const file = fileModel.getById(fileId);
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return null;
  }
  const role = permissionModel.getRoleForUser(fileId, me);
  if (role !== "owner") {
    res.status(404).json({ error: "File not found" });
    return null;
  }
  return file;
}

// Strip C++ server "200 ok\n\n" header if present
function stripCppOkHeader(s) {
  return String(s ?? "").replace(/^\s*200\s+ok\s*\r?\n\r?\n/i, "");
}

// GET /api/files - Get files and folders
exports.getFiles = (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    try {
        // Support query parameters for filtering
        const parentId = req.query.parentId;
        const onlyFolders = req.query.folders === 'true'; // ?folders=true
        const onlyFiles = req.query.files === 'true'; // ?files=true
        const view = req.query.view; // View type: my-drive, shared, starred, recent, trash

        let allItems;

        if (parentId !== undefined) {
            //  parentId - get items in specific folder
            const parsedParentId = parentId === 'null' ? null : parseIdOr404(parentId);
            if (parentId !== 'null' && !parsedParentId) {
                return res.status(400).json({ error: "Invalid parentId" });
            }
            allItems = fileModel.listInFolder(userId, parsedParentId);
        } else {
            // Get all accessible items
            const allAccessible = fileModel.listForUser(userId);

            // Apply view-based filtering
            if (view === 'starred') {
                // Show only starred items (not trashed)
                allItems = allAccessible.filter(item => item.isStarred && !item.isTrashed);
            } else if (view === 'shared') {
                // Show only items shared BY others (not owned by current user, not trashed)
                allItems = allAccessible.filter(item => {
                    const directRole = permissionModel.getRoleForUser(item.id, userId);
                    const isOwner = item.ownerId === userId;
                    return directRole !== null && !isOwner && !item.isTrashed;
                });
            } else if (view === 'trash') {
                // Show only trashed items owned by user
                allItems = allAccessible.filter(item => item.isTrashed && item.ownerId === userId);
            } else if (view === 'recent') {
                // Show recently created items (last 7 days, not trashed)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                allItems = allAccessible.filter(item => {
                    if (item.isTrashed) return false;
                    const createdDate = new Date(item.createdAt);
                    return createdDate >= sevenDaysAgo;
                });
                // Sort by date, newest first
                allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else {
                // DEFAULT (my-drive): Show root-level items PLUS items shared with user (not trashed)
                allItems = allAccessible.filter(item => {
                    if (item.isTrashed) return false;

                    // Show if at root level (parentId === null)
                    if (item.parentId === null) return true;

                    // OR show if user has DIRECT permission AND is NOT the owner
                    // (meaning someone else shared it with them)
                    const directRole = permissionModel.getRoleForUser(item.id, userId);
                    const isOwner = item.ownerId === userId;

                    // Show if: has direct permission AND not the owner (= shared with them)
                    return directRole !== null && !isOwner;
                });
            }
        }

        // Apply filters
        if (onlyFolders) {
            allItems = allItems.filter(item => item.isFolder);
        } else if (onlyFiles) {
            allItems = allItems.filter(item => !item.isFolder);
        }

        res.status(200).json(allItems);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve files" });
    }
};

// GET /api/files/:id - Get file or folder by ID
exports.getFileById = async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const fileId = parseIdOr404(req.params.id);
    if (!fileId) return res.status(404).json({ error: "File not found" });

    try {
        const file = ensureCanReadOr404(req, res, userId, fileId);
        if (!file) return;

        // If it's a folder, optionally include contents
        if (file.isFolder) {
            const includeContents = req.query.contents === 'true';
            
            if (includeContents) {
                const contents = fileModel.listInFolder(userId, fileId);
                return res.status(200).json({
                    ...file,
                    contents: contents
                });
            }
            
            return res.status(200).json(file);
        }

        // Existing file logic: fetch from C++ server
        if (file.name && file.storageKey) {
            try {
                const cppData = await sendToCppEngine(`get ${file.storageKey}`);

                if (cppData.startsWith("4")) {
                    return res.status(500).json({ error: "C++ server failed to retrieve the file" });
                }

                file.data = stripCppOkHeader(cppData);
            } catch (error) {
                console.error('Failed to fetch from C++ server:', error);
            }
        }

        res.status(200).json(file);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve file" });
    }
};

// POST /api/files - Create new file OR folder
exports.createFile = async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { name, data, parentId, isFolder } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    // Folders shouldn't have data
    if (isFolder && data) {
        return res.status(400).json({ error: "Folders cannot have data" });
    }

    try {
        // If parentId is provided, verify user has write access to parent
        if (parentId) {
            const parsedParentId = parseIdOr404(parentId);
            if (!parsedParentId) {
                return res.status(404).json({ error: "Parent folder not found" });
            }
            const parent = fileModel.getById(parsedParentId);
            if (!parent) {
                return res.status(404).json({ error: "Parent folder not found" });
            }
            if (!parent.isFolder) {
                return res.status(400).json({ error: "Parent must be a folder" });
            }
            const role = permissionModel.getEffectiveRoleForFile(parsedParentId, userId);
            if (!permissionModel.canWrite(role)) {
                return res.status(403).json({ error: "No write access to parent folder" });
            }
        }

        // Create the item (file or folder)
        const newFile = fileModel.add(userId, name, data, parentId || null, isFolder || false);

        // If it's a file (not folder), save to C++ Server
        if (!isFolder) {
            // Escape newlines and backslashes for transmission
            const escapedData = (data || '')
                .replace(/\\/g, '\\\\')  // Escape backslashes first
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '\\r');  // Escape carriage returns

            const response = await sendToCppEngine(`post ${newFile.storageKey} ${escapedData}`);

            if (response.startsWith("400")) {
                fileModel.delete(newFile.id);
                return res.status(400).json({ error: "C++ server rejected the file" });
            }
        }

        res.status(201).set('Location', `/api/files/${newFile.id}`).send(); 
    } catch (error) {
        res.status(500).json({ error: error.toString() }); 
    }
};

// PATCH /api/files/:id - Update file or folder
exports.updateFile = async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const fileId = parseIdOr404(req.params.id);
    const updates = req.body;

    const hasName = updates.name !== undefined;
    const hasData = updates.data !== undefined;
    const hasParentId = updates.parentId !== undefined;
    const hasIsStarred = updates.isStarred !== undefined;
    const hasIsTrashed = updates.isTrashed !== undefined;

    if (!hasName && !hasData && !hasParentId && !hasIsStarred && !hasIsTrashed) {
        return res.status(400).json({ error: "No valid fields to update" });
    }

    if (hasName && String(updates.name).trim() === "") {
        return res.status(400).json({ error: "Name cannot be empty" });
    }

    const cppStatus = (raw) => {
        const s = String(raw ?? "").trimStart();
        const m = s.match(/^(\d{3})\b/);
        return m ? Number(m[1]) : null;
    };

    try {
        // For starring, only need read permission; for other updates need write permission
        const needsWrite = hasName || hasData || hasParentId || hasIsTrashed;

        let file;
        if (needsWrite) {
            file = ensureCanWriteOr404(req, res, userId, fileId);
            if (!file) {
                console.log(`[UPDATE] User ${userId} does not have write permission for file ${fileId}`);
                return;
            }
            console.log(`[UPDATE] User ${userId} updating file ${fileId}, has write permission`);
        } else {
            // Just starring/unstarring - only needs read permission
            file = ensureCanReadOr404(req, res, userId, fileId);
            if (!file) return;
        }

        // Folders can't have data
        if (file.isFolder && hasData) {
            return res.status(400).json({ error: "Cannot set data on a folder" });
        }

        // If moving to a new parent, check permissions and cycles
        if (hasParentId) {
            const newParentId = updates.parentId ? parseIdOr404(updates.parentId) : null;
            
            if (newParentId) {
                const parent = fileModel.getById(newParentId);
                if (!parent) {
                    return res.status(404).json({ error: "Parent folder not found" });
                }
                if (!parent.isFolder) {
                    return res.status(400).json({ error: "Parent must be a folder" });
                }
                
                const role = permissionModel.getEffectiveRoleForFile(newParentId, userId);
                if (!permissionModel.canWrite(role)) {
                    return res.status(403).json({ error: "No write access to target folder" });
                }

                // Check for cycles if moving a folder
                if (file.isFolder && fileModel.wouldCreateCycle(fileId, newParentId)) {
                    return res.status(400).json({ error: "Cannot move folder: would create circular reference" });
                }
            }
        }

        // If updating file data, update C++ server
        if (hasData && !file.isFolder) {
            const delRes = await sendToCppEngine(`delete ${file.storageKey}`);
            const delCode = cppStatus(delRes);
            if (delCode >= 400 && delCode !== 404) {
                return res.status(500).json({ error: "C++ server failed to delete existing file data" });
            }

            // Escape newlines and backslashes for transmission
            const escapedData = (updates.data || '')
                .replace(/\\/g, '\\\\')  // Escape backslashes first
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '\\r');  // Escape carriage returns

            const postRes = await sendToCppEngine(`post ${file.storageKey} ${escapedData}`);
            const postCode = cppStatus(postRes);
            if (postCode >= 400) {
                return res.status(500).json({ error: "C++ server rejected the updated file data" });
            }
        }

        const toStore = {};
        if (hasData) toStore.data = updates.data;
        if (hasName) toStore.name = String(updates.name).trim();
        if (hasParentId) toStore.parentId = updates.parentId ? parseIdOr404(updates.parentId) : null;
        if (hasIsStarred) toStore.isStarred = Boolean(updates.isStarred);
        if (hasIsTrashed) toStore.isTrashed = Boolean(updates.isTrashed);

        fileModel.update(fileId, toStore);

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};

// DELETE /api/files/:id - Delete file or folder (soft delete or permanent)
exports.deleteFile = async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;

    const fileId = parseIdOr404(req.params.id);
    const permanent = req.query.permanent === 'true'; // ?permanent=true for permanent delete

    try {
        const file = fileModel.getById(fileId);
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        // Check if user is the owner (only owners can delete)
        const role = permissionModel.getRoleForUser(fileId, userId);
        if (role !== "owner") {
            return res.status(404).json({ error: "File not found" });
        }

        if (file.isTrashed || permanent) {
            // File is already in trash OR permanent delete requested - delete permanently
            if (file.isFolder) {
                await deleteFolderRecursive(fileId);
            } else {
                // Delete file from C++ server
                try {
                    await sendToCppEngine(`delete ${file.storageKey}`);
                } catch (error) {
                    console.error(`Failed to delete file ${fileId} from C++ server:`, error);
                }
                // Delete from local storage
                fileModel.delete(fileId);
            }
        } else {
            // First delete - move to trash (soft delete)
            if (file.isFolder) {
                // Mark folder and all children as trashed
                await trashFolderRecursive(fileId);
            } else {
                fileModel.update(fileId, { isTrashed: true });
            }
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};

// Helper function to recursively trash folders and all contents
async function trashFolderRecursive(folderId) {
    const children = fileModel.getChildren(folderId);

    // Trash all children recursively
    for (const child of children) {
        if (child.isFolder) {
            await trashFolderRecursive(child.id);
        } else {
            fileModel.update(child.id, { isTrashed: true });
        }
    }

    // Finally, trash the folder itself
    fileModel.update(folderId, { isTrashed: true });
}

// Helper function to recursively delete folders and all contents
async function deleteFolderRecursive(folderId) {
    // Use the new getChildren method from fileModel
    const children = fileModel.getChildren(folderId);

    // Delete all children recursively
    for (const child of children) {
        if (child.isFolder) {
            // Recursively delete subfolders
            await deleteFolderRecursive(child.id);
        } else {
            // Delete file from C++ server
            try {
                if (child.storageKey) {
                    await sendToCppEngine(`delete ${child.storageKey}`);
                }
            } catch (error) {
                console.error(`Failed to delete file ${child.id} from C++ server:`, error);
            }
            // Delete file metadata
            fileModel.delete(child.id);
        }
    }

    // Finally, delete the folder itself
    fileModel.delete(folderId);
}

// Helper to parse C++ server response status code
function cppStatus(raw) {
  const s = String(raw ?? "").trimStart();
  const m = s.match(/^(\d{3})\b/);
  return m ? Number(m[1]) : null;
}

// Helper to strip C++ server 200 Ok header
function stripCpp200Header(raw) {
  return String(raw ?? "").replace(/^\s*200\s+Ok\s*\r?\n\r?\n/i, "");
}

// Helper to parse C++ server list of filenames response
function parseCppList(raw) {
  const code = cppStatus(raw);
  if (code !== 200) return { code, ids: [], raw: String(raw ?? "") };

  const body = stripCpp200Header(raw);
  const ids = body
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);

  return { code, ids, raw: String(raw ?? ""), body };
}

// GET /api/search/:query - Search files by name or content
exports.searchFiles = async (req, res) => {
    const userId = getUserId(req, res);
    if (!userId) return;
    
    const query = String(req.params.query ?? "").trim();
    if (!query) return res.status(400).json({ error: "Search query is required" });

    const qLower = query.toLowerCase();

    try {
        const visibleItems = fileModel.listForUser(userId);

        const byKey = new Map();
        for (const f of visibleItems) {
            // Only add files with storage keys (not folders)
            if (!f.isFolder && f.storageKey) {
                const key = String(f.storageKey);
                byKey.set(key, f);
            }
        }

        const results = [];
        const addedIds = new Set();

        const addItem = (f) => {
            if (!f) return;
            const id = String(f.id);
            if (addedIds.has(id)) return;
            addedIds.add(id);
            results.push(f);
        };

        // Search both files AND folders by name
        for (const f of visibleItems) {
            const name = String(f.name ?? "").toLowerCase();
            if (name.includes(qLower)) addItem(f);
        }

        // Send search query to C++ server (for file contents only)
        const cppRes = await sendToCppEngine(`search ${query}`);
        const parsed = parseCppList(cppRes);

        if (parsed.code === 404) {
            return res.status(200).json(results);
        }

        if (parsed.code >= 400) {
            return res.status(parsed.code).json({ error: parsed.raw.trim() });
        }

        if (parsed.code === null) {
            return res.status(500).json({ error: "Invalid response from C++ server" });
        }

        // Intersect C++ results with visible files
        for (const key of parsed.ids) {
            const f = byKey.get(String(key));
            addItem(f);
        }
        
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
};