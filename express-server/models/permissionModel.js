// In-memory permissions storage
let permissionId = 0;

// Map<fileId:number, Array<{ id:number, userId:string, role:string, createdAt:string }>>
const permsByFileId = new Map();

function initForFile(fileId, ownerId) {
  // Create a permission list for this file with an "owner" permission.
  const list = [];
  const ownerPerm = {
    id: ++permissionId,
    userId: String(ownerId),
    role: "owner",
    createdAt: new Date().toISOString(),
  };
  list.push(ownerPerm);
  permsByFileId.set(fileId, list);
  return ownerPerm;
}

function list(fileId) {
  return permsByFileId.get(fileId) || [];
}

function getById(fileId, pId) {
  const arr = list(fileId);
  return arr.find((p) => p.id === pId) || null;
}

function getRoleForUser(fileId, userId) {
  const uid = String(userId);
  const arr = list(fileId);
  const p = arr.find((x) => String(x.userId) === uid);
  return p ? p.role : null;
}

// Get role considering parent folder inheritance
function getEffectiveRoleForFile(fileId, userId) {
  const fileModel = require("./fileModel");
  
  // First check direct permission on this file/folder
  const directRole = getRoleForUser(fileId, userId);
  if (directRole) return directRole;

  // Then check parent folder permissions recursively
  const file = fileModel.getById(fileId);
  if (!file || !file.parentId) return null;

  // Recursively check parent's permissions
  return getEffectiveRoleForFile(file.parentId, userId);
}

function canRead(role) {
  return role === "owner" || role === "writer" || role === "reader";
}

function canWrite(role) {
  return role === "owner" || role === "writer";
}

function canManage(role) {
  return role === "owner";
}

function userHasAnyAccess(fileId, userId) {
  const role = getRoleForUser(fileId, userId);
  return role !== null;
}

function listSharedFileIdsForUser(userId) {
  const uid = String(userId);
  const out = [];
  for (const [fileId, arr] of permsByFileId.entries()) {
    if (arr.some((p) => String(p.userId) === uid)) out.push(fileId);
  }
  return out;
}

function create(fileId, userId, role) {
  const uid = String(userId);
  const r = String(role || "").toLowerCase();

  if (!["reader", "writer"].includes(r)) {
    return { ok: false, error: "Invalid role" };
  }

  const arr = list(fileId);

  // Owner permission exists and should not be duplicated.
  const existing = arr.find((p) => String(p.userId) === uid);
  if (existing) {
    return { ok: false, error: "Permission already exists" };
  }

  const perm = {
    id: ++permissionId,
    userId: uid,
    role: r,
    createdAt: new Date().toISOString(),
  };

  arr.push(perm);
  permsByFileId.set(fileId, arr);
  return { ok: true, perm };
}

function update(fileId, pId, updates) {
  const perm = getById(fileId, pId);
  if (!perm) return { ok: false, error: "Permission not found" };

  if (perm.role === "owner") {
    return { ok: false, error: "Cannot modify owner permission" };
  }

  if (updates.role !== undefined) {
    const r = String(updates.role || "").toLowerCase();
    if (!["reader", "writer"].includes(r)) {
      return { ok: false, error: "Invalid role" };
    }
    perm.role = r;
  }

  return { ok: true, perm };
}

function remove(fileId, pId) {
  const arr = list(fileId);
  const idx = arr.findIndex((p) => p.id === pId);
  if (idx === -1) return { ok: false, error: "Permission not found" };

  if (arr[idx].role === "owner") {
    return { ok: false, error: "Cannot delete owner permission" };
  }

  arr.splice(idx, 1);
  permsByFileId.set(fileId, arr);
  return { ok: true };
}

function removeAllForFile(fileId) {
  permsByFileId.delete(fileId);
}

module.exports = {
  initForFile,
  list,
  getById,
  getRoleForUser,
  getEffectiveRoleForFile, 
  canRead,
  canWrite,
  canManage,
  userHasAnyAccess,
  listSharedFileIdsForUser,
  create,
  update,
  remove,
  removeAllForFile,
};