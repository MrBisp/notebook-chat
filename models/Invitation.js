import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
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
    expiration: {
        type: Date,
        required: true,
        default: function () {
            return new Date(Date.now() + 24 * 60 * 60 * 1000 * 7); // 7 days from now
        },
    },

});

const Invitation = mongoose.models.Invitation || mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;