const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
// File schema definition
const fileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    name: { type: String, required: true },
    data: { type: String, default: null },
    isFolder: { type: Boolean, default: false },
    storageKey: { type: String, default: uuidv4 },
    // array of user IDs who starred this file
    starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('File', fileSchema);