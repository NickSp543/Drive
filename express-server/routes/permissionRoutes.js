const express = require("express");
const router = express.Router({ mergeParams: true });

const permissionController = require("../controllers/permissionController");

// GET/POST at /api/files/:id/permissions
router.get("/", permissionController.getPermissions);
router.post("/", permissionController.createPermission);

// GET at /api/files/:id/permissions/my-role - get current user's role
router.get("/my-role", permissionController.getMyRole);

// PATCH/DELETE at /api/files/:id/permissions/:pId
router.patch("/:pId", permissionController.updatePermission);
router.delete("/:pId", permissionController.deletePermission);

module.exports = router;
