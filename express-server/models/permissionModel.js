const mongoose = require('mongoose');
// Permission schema definition
const permissionSchema = new mongoose.Schema({
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { 
        type: String, 
        enum: ['owner', 'writer', 'reader'], 
        required: true 
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

permissionSchema.index({ fileId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);