import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    input: { type: String, required: true },
    output: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    tokens: { type: Number, required: true },
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;