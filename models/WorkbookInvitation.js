import mongoose from 'mongoose';
import User from './User';
import { Workbook } from './Workbook';

const workbookInvitationSchema = new mongoose.Schema({
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
        required: true,
        default: 'write',
    },
    expiration: {
        type: Date,
        required: true,
        default: function () {
            return new Date(Date.now() + 24 * 60 * 60 * 1000 * 7); // 7 days from now
        },
    },
});

const WorkbookInvitation = mongoose.models.WorkbookInvitation || mongoose.model('WorkbookInvitation', workbookInvitationSchema);

export default WorkbookInvitation;