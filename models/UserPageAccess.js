import mongoose from 'mongoose';

const userPageAccessSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    page: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Page',
        required: true,
    },
    accessLevel: {
        type: String, // This can be 'read', 'edit', or custom roles.
        required: true,
    },
});

const UserPageAccess = mongoose.models.UserPageAccess || mongoose.model('UserPageAccess', userPageAccessSchema);

module.exports = UserPageAccess;