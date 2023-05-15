import mongoose from "mongoose";

const connection = {};

async function dbConnect() {
    const db = await mongoose.connection.close();
    await mongoose.disconnect();
}

export default dbConnect;