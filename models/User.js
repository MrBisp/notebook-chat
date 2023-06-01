// models/User.js

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
});

const conversationSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: false
    },
    messages: {
        type: [messageSchema],
        required: true,
        default: [],
    },
    systemMessage: {
        type: String,
        required: false,
    },
    model: {
        type: String,
        required: false,
    },
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    conversations: {
        type: [conversationSchema],
        default: [],
    },
    token: {
        type: String,
        required: false,
    },
    workbooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workbook',
    }],
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;