import mongoose from 'mongoose';
import User from './User';
import { Workbook } from './Workbook';

const memorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    workbook: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workbook',
        required: false,
    },
    memory: {
        type: String,
        required: true,
    },
    importance: {
        type: Number,
        required: true,
        default: 0,
    },
});

const Memory = mongoose.models.Memory || mongoose.model('Memory', memorySchema);

export default Memory;