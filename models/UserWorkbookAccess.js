import mongoose from 'mongoose';

const userWorkbookAccessSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    workbook: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workbook',
        required: true,
    },
    accessLevel: {
        type: String,
        enum: ['read', 'write', 'owner'], // You can define the access levels as per your needs.
        required: true,
    },
    lastModified: { // Optional: To track when the access level was last modified
        type: Date,
        default: Date.now,
    },
});

const UserWorkbookAccess = mongoose.models.UserWorkbookAccess || mongoose.model('UserWorkbookAccess', userWorkbookAccessSchema);

export default UserWorkbookAccess;