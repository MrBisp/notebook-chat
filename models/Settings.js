import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    setting: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
    },
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

export default Settings;