const express = require("express");
const router = express.Router({ mergeParams: true });

const permissionController = require("../controllers/permissionController");

// GET/POST at /api/files/:id/permissions
router.get("/", permissionController.getPermissions);
router.post("/", permissionController.createPermission);

// PATCH/DELETE at /api/files/:id/permissions/:pId
router.patch("/:pId", permissionController.updatePermission);
router.delete("/:pId", permissionController.deletePermission);

module.exports = router;
