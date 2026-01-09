const permissionModel = require("./permissionModel");
// In memory storage
let idCounter = 0;
const filesById = new Map();

// Get file by ID
const getById = (fileId) => {
    return filesById.get(fileId) || null;
};

exports.getById = getById;

exports.exists = (fileId) => filesById.has(fileId);

// Add new file or folder
// If isFolder is true, this creates a folder instead of a file
exports.add = (userId, name, data, parentId = null, isFolder = false) => {
    const newId = ++idCounter;
    const storageKey = isFolder ? null : String(newId); // Folders don't need storage keys
    const now = new Date().toISOString();

    const newFile = {
        id: newId,
        ownerId: String(userId),
        name: String(name),
        data: isFolder ? null : (data || null),
        storageKey: storageKey,
        parentId: parentId, // null means root level
        isFolder: isFolder, // true for folders, false/undefined for files
        createdAt: now,
        modifiedAt: now,
        isStarred: false, // Track if file is starred
        isTrashed: false, // Track if file is in trash
        trashedAt: null // When file was moved to trash
    };

    filesById.set(newId, newFile);
    permissionModel.initForFile(newId, userId);
    return newFile;
};

// Update file by ID
exports.update = (fileId, updates) => {
    const file = getById(fileId);
    if (!file) return null;

    let changed = false;

    if (updates.name !== undefined && String(updates.name) !== file.name) {
        file.name = String(updates.name);
        changed = true;
    }

    if (updates.data !== undefined && !file.isFolder) {
        const nextData = updates.data === null ? null : String(updates.data);
        if (nextData !== file.data) {
            file.data = nextData;
            changed = true;
        }
    }

    if (updates.parentId !== undefined) {
        if (updates.parentId !== file.parentId) {
            file.parentId = updates.parentId;
            changed = true;
        }
    }

    if (changed) {
        file.modifiedAt = new Date().toISOString();
    }

    if (updates.isStarred !== undefined) file.isStarred = Boolean(updates.isStarred);

    if (updates.isTrashed !== undefined) {
        file.isTrashed = Boolean(updates.isTrashed);
        file.trashedAt = updates.isTrashed ? new Date().toISOString() : null;
    }

    return file;
};

// Delete file by ID
exports.delete = (fileId) => {
    const existed = filesById.delete(fileId);
    if (existed) permissionModel.removeAllForFile(fileId);
    return existed;
};

// Get all children of a folder (for recursive operations)
exports.getChildren = (folderId) => {
    const children = [];
    for (const [id, item] of filesById.entries()) {
        if (item.parentId === folderId) {
            children.push(item);
        }
    }
    return children;
};

// Files and folders visible to a user
exports.listForUser = (userId) => {
    const uid = String(userId);

    // Get file ids where this user has any permission or inherited permission
    const directSharedIds = new Set(permissionModel.listSharedFileIdsForUser(uid));
    
    // Also include items where user has inherited access through parent folders
    const accessibleIds = new Set(directSharedIds);
    
    // Build parent-child relationships
    const itemsArray = Array.from(filesById.values());
    
    // For each item with direct access, add all its children (if folder)
    for (const item of itemsArray) {
        if (directSharedIds.has(item.id)) {
            // Only add descendants if it's a folder
            if (item.isFolder) {
                addDescendants(item.id, accessibleIds, itemsArray);
            }
            // Don't add ancestors - user only sees items they have direct permission on
        }
    }
    
    // Also check if any item is accessible through parent chain
    for (const item of itemsArray) {
        if (hasAccessThroughParent(item.id, directSharedIds, itemsArray)) {
            accessibleIds.add(item.id);
        }
    }

    const out = [];
    for (const [id, f] of filesById.entries()) {
        if (accessibleIds.has(id)) {
            out.push({
                id: f.id,
                name: f.name,
                content: f.isFolder ? undefined : f.data,
                ownerId: f.ownerId,
                parentId: f.parentId,
                isFolder: f.isFolder || false,
                storageKey: f.storageKey,
                createdAt: f.createdAt,
                modifiedAt: f.modifiedAt || f.createdAt,
                isStarred: f.isStarred || false,
                isTrashed: f.isTrashed || false,
                trashedAt: f.trashedAt
            });
        }
    }
    return out;
};

// Helper: Add all descendants of a folder to the set
function addDescendants(parentId, idsSet, allItems) {
    for (const item of allItems) {
        if (item.parentId === parentId) {
            idsSet.add(item.id);
            if (item.isFolder) {
                addDescendants(item.id, idsSet, allItems);
            }
        }
    }
}

// Helper: Check if item has access through parent chain
function hasAccessThroughParent(itemId, directAccessIds, allItems) {
    const item = allItems.find(i => i.id === itemId);
    if (!item || !item.parentId) return false;
    
    if (directAccessIds.has(item.parentId)) return true;
    
    return hasAccessThroughParent(item.parentId, directAccessIds, allItems);
}

// Get items within a specific parent folder
exports.listInFolder = (userId, parentId) => {
    const uid = String(userId);
    const allAccessible = exports.listForUser(userId);
    
    return allAccessible.filter(item => item.parentId === parentId);
};

// Check if moving item would create a cycle (only relevant for folders)
exports.wouldCreateCycle = (itemId, newParentId) => {
    if (!newParentId) return false; // Moving to root is always safe
    if (itemId === newParentId) return true; // Can't be its own parent

    let current = newParentId;
    const visited = new Set();

    while (current) {
        if (current === itemId) return true; // Found a cycle
        if (visited.has(current)) break; // Already checked this path
        visited.add(current);

        const item = getById(current);
        if (!item) break;
        current = item.parentId;
    }

    return false;
};