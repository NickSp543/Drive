const fileModel = require("../models/fileModel");
const permissionModel = require("../models/permissionModel");
const userModel = require("../models/userModel");

// Get user ID from JWT authentication 
function getUserId(req, res) {
  // The authenticateToken middleware sets  req.userId
  return req.userId;
}

// Verify that the provided value is a positive integer ID
function parseIdOr404(value) {
  const n = Number(value);
  if (Number.isInteger(n) && n > 0) {
    return n;
  } else {
    return null;
  }
}

// GET /api/files/:id/permissions
exports.getPermissions = (req, res) => {
  const me = getUserId(req, res);
  if (!me) return;

  const fileId = parseIdOr404(req.params.id);
  if (!fileId || !fileModel.exists(fileId)) {
    return res.status(404).json({ error: "File not found" });
  }

  const myRole = permissionModel.getRoleForUser(fileId, me);
  if (!permissionModel.canManage(myRole)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.status(200).json(permissionModel.list(fileId));
};

// POST /api/files/:id/permissions
exports.createPermission = (req, res) => {
  const me = getUserId(req, res);
  if (!me) return;

  const fileId = parseIdOr404(req.params.id);
  if (!fileId || !fileModel.exists(fileId)) {
    return res.status(404).json({ error: "File not found" });
  }

  const myRole = permissionModel.getRoleForUser(fileId, me);
  if (!permissionModel.canManage(myRole)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { userId, role } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  if (!userModel.getUserById(String(userId))) {
    return res.status(404).json({ error: "User not found" });
  }

  const result = permissionModel.create(fileId, String(userId), role);
  if (!result.ok) {
    if (result.error === "Permission already exists") {
      return res.status(409).json({ error: result.error });
    }
    return res.status(400).json({ error: result.error });
  }

  return res
    .status(201)
    .set("Location", `/api/files/${fileId}/permissions/${result.perm.id}`)
    .send();
};

// PATCH /api/files/:id/permissions/:pId
exports.updatePermission = (req, res) => {
  const me = getUserId(req, res);
  if (!me) return;

  const fileId = parseIdOr404(req.params.id);
  if (!fileId || !fileModel.exists(fileId)) {
    return res.status(404).json({ error: "File not found" });
  }

  const myRole = permissionModel.getRoleForUser(fileId, me);
  if (!permissionModel.canManage(myRole)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const pId = parseIdOr404(req.params.pId);
  if (!pId) return res.status(404).json({ error: "Permission not found" });

  const result = permissionModel.update(fileId, pId, req.body || {});
  if (!result.ok) {
    if (result.error === "Permission not found") {
      return res.status(404).json({ error: "Permission not found" });
    }
    return res.status(400).json({ error: result.error });
  }

  return res.status(204).send();
};

// DELETE /api/files/:id/permissions/:pId
exports.deletePermission = (req, res) => {
  const me = getUserId(req, res);
  if (!me) return;

  const fileId = parseIdOr404(req.params.id);
  if (!fileId || !fileModel.exists(fileId)) {
    return res.status(404).json({ error: "File not found" });
  }

  const myRole = permissionModel.getRoleForUser(fileId, me);
  if (!permissionModel.canManage(myRole)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const pId = parseIdOr404(req.params.pId);
  if (!pId) return res.status(404).json({ error: "Permission not found" });

  const result = permissionModel.remove(fileId, pId);
  if (!result.ok) {
    if (result.error === "Permission not found") {
      return res.status(404).json({ error: "Permission not found" });
    }
    return res.status(400).json({ error: result.error });
  }

  return res.status(204).send();
};
