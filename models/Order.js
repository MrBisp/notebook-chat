import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    tokens: { type: Number, required: true, default: -1 },
    type: { type: String, required: true },
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;